import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  CheckSquare,
  Copy,
  Download,
  Eye,
  FileText,
  Layers,
  Plus,
  Save,
  Settings2,
  Trash2,
  PanelRightClose,
  PanelRightOpen,
  X,
  Zap,
} from 'lucide-react';

import { db } from '@/db/database';
import { useToast } from '@/context/ToastContext';
import { useAccessibleModal } from '@/hooks/useAccessibleModal';
import { useDebounce } from '@/hooks/useDebounce';
import type { Category, ContextMenu, Prompt } from '@/models/types';
import {
  CompiledPromptPayload,
  PROMPT_OUTPUT_FORMATS,
  PromptOutputContract,
  PromptOutputContractSchema,
  TemplatePayload,
  TemplatePayloadSchema,
  UserSelection,
  UserSelectionSchema,
  compilePromptPayload,
  createEmptyPromptPayload,
  createEmptyUserSelection,
  getPromptSummaryFields,
  parsePromptPayload,
  parseUserSelection,
  sanitizeUserSelection,
} from '@/models/promptSchema';
import { savePromptToSupabase } from '@/services/supabasePrompts';
import { renderFinalPromptText, syncTemplateWithLinkedMenus } from '@/utils/promptArtifacts';
import { saveLocalBackup } from '@/utils/backupManager';
import { copyToClipboard, downloadJson } from '@/utils/exportJson';
import { migrateTemplateToCurrentSchema } from '@/utils/templateMigration';

type FreeInputEntry = {
  key: string;
  value: string;
};

type TemplateFormState = {
  categoryId: number;
  template: TemplatePayload;
  selection: UserSelection;
  freeInputs: FreeInputEntry[];
};



function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(values: string[]): string {
  return values.join('\n');
}

function toFreeInputEntries(selection: UserSelection): FreeInputEntry[] {
  const entries = Object.entries(selection.free_inputs || {}).map(([key, value]) => ({ key, value }));
  return entries.length > 0 ? entries : [{ key: '', value: '' }];
}

function fromFreeInputEntries(entries: FreeInputEntry[]): Record<string, string> {
  return Object.fromEntries(
    entries
      .map((entry) => [entry.key.trim(), entry.value] as const)
      .filter(([key]) => Boolean(key))
  );
}

function buildInitialFormState(categoryId = 0): TemplateFormState {
  const template = createEmptyPromptPayload('Novo Template');
  return {
    categoryId,
    template,
    selection: createEmptyUserSelection(template.meta.template_id),
    freeInputs: [{ key: '', value: '' }],
  };
}

function buildFormStateFromPrompt(prompt: Prompt): TemplateFormState {
  const template = parsePromptPayload(prompt.promptPayload);
  const linkedMenuIds = [...new Set([...(template.menu_ids || []), ...template.menu_definitions.map((menu) => menu.menu_id)])];
  const selection = parseUserSelection(prompt.selectionPayload, template.meta.template_id, {
    title: prompt.title,
    schemaVersion: prompt.schemaVersion,
    language: prompt.language,
  });

  return {
    categoryId: prompt.categoryId,
    template: TemplatePayloadSchema.parse({
      ...template,
      menu_ids: linkedMenuIds,
    }),
    selection,
    freeInputs: toFreeInputEntries(selection),
  };
}


function buildPersistedArtifacts(form: TemplateFormState, contextMenus: ContextMenu[]) {
  const normalizedTemplate = TemplatePayloadSchema.parse({
    ...form.template,
    meta: {
      ...form.template.meta,
      template_id:
        form.template.meta.template_id.trim() || form.template.meta.template_name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      template_name: form.template.meta.template_name.trim(),
      template_type: form.template.meta.template_type.trim(),
      schema_version: form.template.meta.schema_version.trim() || '1.0.0',
      language: form.template.meta.language.trim() || 'pt-BR',
    },
    prompt_definition: {
      ...form.template.prompt_definition,
      constraints: splitLines(joinLines(form.template.prompt_definition.constraints)),
      negative_prompt: splitLines(joinLines(form.template.prompt_definition.negative_prompt)),
    },
    output_contract: PromptOutputContractSchema.parse(form.template.output_contract),
  });
  const migration = migrateTemplateToCurrentSchema(
    syncTemplateWithLinkedMenus(normalizedTemplate, contextMenus)
  );
  const syncedTemplate = migration.template;

  const rawSelection = UserSelectionSchema.parse({
    ...form.selection,
    template_id: syncedTemplate.meta.template_id,
    free_inputs: fromFreeInputEntries(form.freeInputs),
  });

  const normalizedSelection = sanitizeUserSelection(syncedTemplate, rawSelection);
  const compiledPayload = compilePromptPayload(syncedTemplate, normalizedSelection);
  const renderedPrompt = renderFinalPromptText(syncedTemplate, compiledPayload);

  return {
    template: syncedTemplate,
    selection: normalizedSelection,
    compiledPayload,
    renderedPrompt,
    migrationWarnings: migration.warnings,
  };
}

function isUnauthenticatedCloudError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes('Usuário não autenticado') || error.name === 'AuthSessionMissingError')
  );
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const previewModalRef = useRef<HTMLDivElement>(null);
  const previewCloseButtonRef = useRef<HTMLButtonElement>(null);
  const isNew = id === 'novo';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [form, setForm] = useState<TemplateFormState>(buildInitialFormState());

  const contextMenus = useLiveQuery(() => db.contextMenus.toArray()) ?? [];
  const debouncedForm = useDebounce(form, 1200);
  const availableContextMenus = useMemo(
    () => Array.from(new Map(contextMenus.map((menu) => [menu.menuId, menu])).values()),
    [contextMenus]
  );

  useEffect(() => {
    (async () => {
      const categoryList = await db.categories.toArray();
      setCategories(categoryList.sort((a, b) => a.name.localeCompare(b.name)));
    })();
  }, []);

  useEffect(() => {
    if (!loaded && isNew && categories.length > 0) {
      const categoryFromQuery = Number(searchParams.get('categoria') || categories[0]?.id || 0);
      setForm(buildInitialFormState(categoryFromQuery));
      setLoaded(true);
    }
  }, [categories, isNew, loaded, searchParams]);

  useEffect(() => {
    if (isNew) return;

    db.prompts.get(Number(id)).then((prompt) => {
      if (prompt) {
        setForm(buildFormStateFromPrompt(prompt));
      }
      setLoaded(true);
    });
  }, [id, isNew]);

  useEffect(() => {
    if (!loaded) return;

    const draftKey = `template_draft_${id}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (!savedDraft) return;

    try {
      const draftData = JSON.parse(savedDraft) as Partial<TemplateFormState>;
      if (draftData.template?.meta?.template_name) {
        setForm((current) => ({
          ...current,
          ...draftData,
        }));
        showToast('Rascunho recuperado automaticamente!', 'info');
      }
    } catch (error) {
      console.error('Erro ao recuperar rascunho:', error);
    }
  }, [id, loaded, showToast]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(`template_draft_${id}`, JSON.stringify(debouncedForm));
  }, [debouncedForm, id, loaded]);

  const previewState = useMemo(() => {
    try {
      const artifacts = buildPersistedArtifacts(form, availableContextMenus);
      return {
        payload: artifacts.compiledPayload,
        template: artifacts.template,
        selection: artifacts.selection,
        renderedPrompt: artifacts.renderedPrompt,
        error: null,
      };
    } catch (error: any) {
      return {
        payload: null,
        template: null,
        selection: null,
        renderedPrompt: '',
        error: error.message || 'Payload inválido',
      };
    }
  }, [availableContextMenus, form]);

  useAccessibleModal({
    isOpen: showPreview,
    onClose: () => setShowPreview(false),
    containerRef: previewModalRef,
    initialFocusRef: previewCloseButtonRef,
  });

  const updateTemplate = (updater: (current: TemplatePayload) => TemplatePayload) => {
    setForm((current) => {
      const nextTemplate = updater(current.template);
      const nextSelection =
        current.selection.template_id === current.template.meta.template_id
          ? {
              ...current.selection,
              template_id: nextTemplate.meta.template_id,
            }
          : current.selection;

      return {
        ...current,
        template: nextTemplate,
        selection: nextSelection,
      };
    });
  };

  const updateMetaField = <K extends keyof TemplatePayload['meta']>(
    field: K,
    value: TemplatePayload['meta'][K]
  ) => {
    updateTemplate((current) =>
      TemplatePayloadSchema.parse({
        ...current,
        meta: {
          ...current.meta,
          [field]: value,
        },
      })
    );
  };

  const updatePromptDefinitionField = <K extends keyof TemplatePayload['prompt_definition']>(
    field: K,
    value: TemplatePayload['prompt_definition'][K]
  ) => {
    updateTemplate((current) =>
      TemplatePayloadSchema.parse({
        ...current,
        prompt_definition: {
          ...current.prompt_definition,
          [field]: value,
        },
      })
    );
  };

  const updateOutputContractField = <K extends keyof PromptOutputContract>(
    field: K,
    value: PromptOutputContract[K]
  ) => {
    updateTemplate((current) =>
      TemplatePayloadSchema.parse({
        ...current,
        output_contract: {
          ...current.output_contract,
          [field]: value,
        },
      })
    );
  };

  const toggleOptionSelection = (menuId: string, selectionMode: string, optionValue: string) => {
    setForm((current) => {
      const existingMenu = current.selection.selected_menus.find((item) => item.menu_id === menuId);
      const hasOption = existingMenu?.selected_options.some((item) => item.option_value === optionValue);

      let selected_menus = [...current.selection.selected_menus];

      if (selectionMode === 'single') {
        if (hasOption) {
          selected_menus = selected_menus.filter((item) => item.menu_id !== menuId);
        } else {
          selected_menus = [
            ...selected_menus.filter((item) => item.menu_id !== menuId),
            {
              menu_id: menuId,
              selected_options: [{ option_value: optionValue, selected_sub_options: [] }],
            },
          ];
        }
      } else if (existingMenu) {
        selected_menus = selected_menus.map((item) => {
          if (item.menu_id !== menuId) return item;
          return {
            ...item,
            selected_options: hasOption
              ? item.selected_options.filter((selectedOption) => selectedOption.option_value !== optionValue)
              : [...item.selected_options, { option_value: optionValue, selected_sub_options: [] }],
          };
        });
      } else {
        selected_menus = [
          ...selected_menus,
          {
            menu_id: menuId,
            selected_options: [{ option_value: optionValue, selected_sub_options: [] }],
          },
        ];
      }

      return {
        ...current,
        selection: UserSelectionSchema.parse({
          ...current.selection,
          template_id: current.template.meta.template_id,
          selected_menus: selected_menus.filter((item) => item.selected_options.length > 0),
        }),
      };
    });
  };



  const toggleSubOptionSelection = (menuId: string, optionValue: string, subOptionValue: string) => {
    setForm((current) => ({
      ...current,
      selection: UserSelectionSchema.parse({
        ...current.selection,
        selected_menus: current.selection.selected_menus.map((menuSelection) => {
          if (menuSelection.menu_id !== menuId) return menuSelection;
          return {
            ...menuSelection,
            selected_options: menuSelection.selected_options.map((selectedOption) => {
              if (selectedOption.option_value !== optionValue) return selectedOption;
              const alreadySelected = selectedOption.selected_sub_options.includes(subOptionValue);
              return {
                ...selectedOption,
                selected_sub_options: alreadySelected
                  ? selectedOption.selected_sub_options.filter((value) => value !== subOptionValue)
                  : [...selectedOption.selected_sub_options, subOptionValue],
              };
            }),
          };
        }),
      }),
    }));
  };

  const updateFreeInput = (index: number, nextEntry: FreeInputEntry) => {
    setForm((current) => ({
      ...current,
      freeInputs: current.freeInputs.map((entry, entryIndex) => (entryIndex === index ? nextEntry : entry)),
    }));
  };

  const addFreeInput = () => {
    setForm((current) => ({
      ...current,
      freeInputs: [...current.freeInputs, { key: '', value: '' }],
    }));
  };

  const removeFreeInput = (index: number) => {
    setForm((current) => ({
      ...current,
      freeInputs:
        current.freeInputs.filter((_, entryIndex) => entryIndex !== index).length > 0
          ? current.freeInputs.filter((_, entryIndex) => entryIndex !== index)
          : [{ key: '', value: '' }],
    }));
  };

  const clearDraft = () => {
    localStorage.removeItem(`template_draft_${id}`);
  };

  const handleSave = async () => {
    if (!form.template.meta.template_name.trim()) {
      showToast('Nome do template é obrigatório', 'error');
      return;
    }

    if (!form.categoryId) {
      showToast('Selecione uma categoria', 'error');
      return;
    }

    let template: TemplatePayload;
    let selection: UserSelection;
    let compiledPayload: CompiledPromptPayload;
    let migrationWarnings: string[] = [];

    try {
      ({ template, selection, compiledPayload, migrationWarnings } = buildPersistedArtifacts(form, availableContextMenus));
    } catch (error: any) {
      showToast(error.message || 'Template inválido', 'error');
      return;
    }

    const summary = getPromptSummaryFields(template);
    const now = new Date();
    const promptRecord: Omit<Prompt, 'id'> = {
      categoryId: form.categoryId,
      title: summary.title,
      promptPayload: template,
      selectionPayload: selection,
      compiledPayload,
      schemaVersion: summary.schemaVersion,
      language: summary.language,
      outputFormat: summary.outputFormat,
      fewShotExamples: template.prompt_definition.few_shot_examples,
      createdAt: now,
      updatedAt: now,
    };

    let localId: number | null = null;

    try {
      if (isNew) {
        localId = (await db.prompts.add({
          ...promptRecord,
          syncStatus: 'pending',
        } as Prompt)) ?? null;
        navigate(`/editor/${localId}`, { replace: true });
      } else {
        localId = Number(id);
        const existingPrompt = await db.prompts.get(localId);
        await db.prompts.update(localId, {
          ...promptRecord,
          createdAt: existingPrompt?.createdAt || now,
          syncStatus: 'pending',
        });
      }

      clearDraft();
      await saveLocalBackup();
    } catch (error: any) {
      console.error('Erro ao salvar localmente:', error);
      showToast(error.message || 'Erro ao salvar localmente', 'error');
      return;
    }

    migrationWarnings.forEach((warning) => showToast(warning, 'info'));

    try {
      const existingPrompt = !isNew && localId !== null ? await db.prompts.get(localId) : undefined;
      const savedRemote = await savePromptToSupabase({
        ...promptRecord,
        remoteId: existingPrompt?.remoteId,
      });

      if (localId !== null) {
        await db.prompts.update(localId, {
          remoteId: savedRemote.id,
          syncStatus: 'synced',
        });
      }

      showToast(isNew ? 'Template criado e sincronizado!' : 'Template atualizado e sincronizado!', 'success');
    } catch (error) {
      if (!isUnauthenticatedCloudError(error)) {
        console.error('Erro ao salvar no Supabase:', error);
      }
      showToast('Template salvo localmente. Sincronize ao fazer login.', 'info');
    }
  };

  const handleCopy = async () => {
    if (!previewState.payload || !previewState.renderedPrompt) {
      showToast(previewState.error || 'Payload inválido', 'error');
      return;
    }

    const ok = await copyToClipboard(previewState.renderedPrompt);
    showToast(ok ? 'Prompt final copiado!' : 'Erro ao copiar', ok ? 'success' : 'error');
  };

  const handleDownload = () => {
    if (!previewState.payload || !previewState.template) {
      showToast(previewState.error || 'Payload inválido', 'error');
      return;
    }

    const safeName = previewState.template.meta.template_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadJson(previewState.payload, `compiled_prompt_${safeName}`);
    showToast('Download iniciado!');
  };

  if (!loaded) {
    return null;
  }

  return (
    <>
      <header className="app-header">
        <div className="flex-row-center">
          <button
            className="btn btn--ghost btn--icon"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="app-header__title">{isNew ? 'Novo Template' : 'Editar Template'}</h1>
        </div>
        <div className="app-header__actions">
          <button className="btn btn--ghost" onClick={() => setShowPreview(true)}>
            <Eye size={16} /> Preview do prompt
          </button>
          <button className="btn btn--secondary" onClick={handleCopy}>
            <Copy size={16} /> Copiar prompt
          </button>
          <button className="btn btn--secondary" onClick={handleDownload}>
            <Download size={16} /> Baixar
          </button>
          <button className="btn btn--primary" onClick={handleSave}>
            <Save size={16} /> Salvar
          </button>
        </div>
      </header>

      <div className="editor-sidebar-container">
        <div
          className={`editor-main-scrollable ${
            isSidebarOpen ? 'editor-main-scrollable--with-sidebar' : ''
          }`}
        >
          <div className="app-content">
            <div className="editor-form--constrained">
          <div className="form-section">
            <h3 className="form-section__title">
              <FileText size={18} /> Metadados do Template
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="template-name">Nome do template</label>
              <input
                id="template-name"
                value={form.template.meta.template_name}
                onChange={(event) => updateMetaField('template_name', event.target.value)}
                placeholder="Ex: Gerador de Cenas Publicitárias"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="template-id">ID do template</label>
              <input
                id="template-id"
                value={form.template.meta.template_id}
                onChange={(event) => updateMetaField('template_id', event.target.value)}
                placeholder="scene_generator_v1"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="template-type">Tipo</label>
              <input
                id="template-type"
                value={form.template.meta.template_type}
                onChange={(event) => updateMetaField('template_type', event.target.value)}
                placeholder="scene_generation"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="template-category">Categoria</label>
              <select
                id="template-category"
                value={form.categoryId}
                onChange={(event) => setForm((current) => ({ ...current, categoryId: Number(event.target.value) }))}
              >
                <option value={0}>Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="template-language">Idioma</label>
              <input
                id="template-language"
                value={form.template.meta.language}
                onChange={(event) => updateMetaField('language', event.target.value)}
                placeholder="pt-BR"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="template-schema-version">Schema version</label>
              <input
                id="template-schema-version"
                value={form.template.meta.schema_version}
                onChange={(event) => updateMetaField('schema_version', event.target.value)}
                placeholder="1.0.0"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="template-status">Status</label>
              <select
                id="template-status"
                value={form.template.meta.status}
                onChange={(event) => updateMetaField('status', event.target.value as TemplatePayload['meta']['status'])}
              >
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="archived">archived</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section__title">
              <Zap size={18} /> Definição do Prompt
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="system-role">System role</label>
              <textarea
                id="system-role"
                value={form.template.prompt_definition.system_role}
                onChange={(event) => updatePromptDefinitionField('system_role', event.target.value)}
                rows={4}
                placeholder="Defina o papel do modelo"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task">Task</label>
              <textarea
                id="task"
                value={form.template.prompt_definition.task}
                onChange={(event) => updatePromptDefinitionField('task', event.target.value)}
                rows={4}
                placeholder="Descreva a tarefa principal"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="context">Context</label>
              <textarea
                id="context"
                value={form.template.prompt_definition.context}
                onChange={(event) => updatePromptDefinitionField('context', event.target.value)}
                rows={4}
                placeholder="Explique o contexto do template"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="constraints">Constraints</label>
              <textarea
                id="constraints"
                value={joinLines(form.template.prompt_definition.constraints)}
                onChange={(event) => updatePromptDefinitionField('constraints', splitLines(event.target.value))}
                rows={4}
                placeholder="Uma restrição por linha"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="negative-prompt">Negative prompt</label>
              <textarea
                id="negative-prompt"
                value={joinLines(form.template.prompt_definition.negative_prompt)}
                onChange={(event) => updatePromptDefinitionField('negative_prompt', splitLines(event.target.value))}
                rows={4}
                placeholder="Uma proibição por linha"
              />
            </div>
          </div>

          <div className="form-section">
            <div className="page-header">
              <div>
                <h3 className="form-section__title">
                  <Layers size={18} /> Menus Vinculados
                </h3>
                <p className="page-header__subtitle">
                  Vincule menus globais e gere um snapshot confiável para este template.
                </p>
              </div>
            </div>

            {availableContextMenus.length === 0 ? (
              <p className="ctx-empty-hint">Nenhum menu global encontrado. Crie um em "Menus do Template".</p>
            ) : (
              <div className="menu-selector-grid">
                {availableContextMenus.map((menu) => {
                  const isSelected = form.template.menu_ids?.includes(menu.menuId);
                  return (
                    <label 
                      key={menu.menuId} 
                      className={`card menu-selector-card ${isSelected ? 'card--active' : ''}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((current) => {
                            const nextMenuIds = checked
                              ? [...(current.template.menu_ids || []), menu.menuId]
                              : (current.template.menu_ids || []).filter((id) => id !== menu.menuId);
                            const uniqueMenuIds = [...new Set(nextMenuIds)];

                            return {
                              ...current,
                              template: syncTemplateWithLinkedMenus(
                                TemplatePayloadSchema.parse({
                                  ...current.template,
                                  menu_ids: uniqueMenuIds,
                                }),
                                availableContextMenus
                              ),
                              selection: UserSelectionSchema.parse({
                                ...current.selection,
                                selected_menus: current.selection.selected_menus.filter((item) =>
                                  uniqueMenuIds.includes(item.menu_id)
                                ),
                              }),
                            };
                          });
                        }} 
                      />
                      <div className="menu-selector-card__info">
                        <h4 className="menu-selector-card__title">{menu.menuName}</h4>
                        <span className="menu-selector-card__id">
                          {menu.menuId}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="form-section">
            <h3 className="form-section__title">
              <CheckSquare size={18} /> Output Contract
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="output-format">Format</label>
              <select
                id="output-format"
                value={form.template.output_contract.format}
                onChange={(event) =>
                  updateOutputContractField('format', event.target.value as PromptOutputContract['format'])
                }
              >
                {PROMPT_OUTPUT_FORMATS.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="output-language">Response language</label>
              <input
                id="output-language"
                value={form.template.output_contract.language}
                onChange={(event) => updateOutputContractField('language', event.target.value)}
                placeholder="pt-BR"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={form.template.output_contract.strict_mode}
                  onChange={(event) => updateOutputContractField('strict_mode', event.target.checked)}
                />
                {' '}Strict mode
              </label>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="required-fields">Required fields</label>
              <textarea
                id="required-fields"
                value={joinLines(form.template.output_contract.required_fields)}
                onChange={(event) => updateOutputContractField('required_fields', splitLines(event.target.value))}
                rows={4}
                placeholder="Um campo obrigatório por linha"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="response-rules">Response rules</label>
              <textarea
                id="response-rules"
                value={joinLines(form.template.output_contract.response_rules)}
                onChange={(event) => updateOutputContractField('response_rules', splitLines(event.target.value))}
                rows={4}
                placeholder="Uma regra por linha"
              />
            </div>
          </div>

          <div className="editor-footer editor-footer--spaced">
            <button className="btn btn--secondary btn--lg" onClick={() => navigate(-1)}>
              Cancelar
            </button>
            <button className="btn btn--primary btn--lg" onClick={handleSave}>
              <Save size={18} /> Salvar Template
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* SIDEBAR DO PLAYGROUND */}
    <aside className={`editor-floating-sidebar ${isSidebarOpen ? 'editor-floating-sidebar--open' : ''}`}>
      <div className="editor-floating-sidebar__header">
        <h3 className="form-section__title editor-floating-sidebar__title">
          <Settings2 size={18} /> Playground
        </h3>
        <button className="btn btn--ghost btn--icon" onClick={() => setIsSidebarOpen(false)} aria-label="Fechar Playground" title="Fechar Playground">
          <X size={18} />
        </button>
      </div>
      <div className="editor-floating-sidebar__content">
        <div className="form-section">
          <div className="page-header">
              <div>
                <h3 className="form-section__title">
                  <Settings2 size={18} /> Playground de Uso
                </h3>
                <p className="page-header__subtitle">
                  Essas seleções alimentam o prompt final copiável e o payload técnico.
                </p>
              </div>
            </div>

            <div className="dynamic-list">
              {form.freeInputs.map((entry, index) => (
                <div key={`free-input-${index}`} className="card">
                  <div className="form-group">
                    <label className="form-label">Chave</label>
                    <input
                      value={entry.key}
                      onChange={(event) => updateFreeInput(index, { ...entry, key: event.target.value })}
                      placeholder="user_scene_description"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Valor</label>
                    <textarea
                      value={entry.value}
                      onChange={(event) => updateFreeInput(index, { ...entry, value: event.target.value })}
                      rows={3}
                      placeholder="Descreva o input livre"
                    />
                  </div>

                  <button
                    className="btn btn--ghost btn--icon"
                    onClick={() => removeFreeInput(index)}
                    aria-label="Remover input livre"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button className="btn btn--ghost btn--sm dynamic-list__add" onClick={addFreeInput}>
                <Plus size={14} /> Novo input livre
              </button>
            </div>

            {(!form.template.menu_ids || form.template.menu_ids.length === 0) ? (
              <p className="ctx-empty-hint">Vincule menus na seção acima para testar a compilação.</p>
            ) : (
              <div className="ctx-editor-grid">
                {availableContextMenus
                  .filter((menu) => form.template.menu_ids?.includes(menu.menuId))
                  .map((menu) => (
                  <div key={menu.menuId} className="ctx-editor-menu">
                    <div className="ctx-editor-menu__header">
                      <span className="ctx-editor-menu__name">{menu.menuName || menu.menuId}</span>
                      <span className="ctx-editor-menu__selection">
                        {menu.selectionMode === 'multiple' ? 'Múltipla' : 'Única'}
                      </span>
                    </div>
                    {menu.description && <p className="form-label__hint">{menu.description}</p>}
                    <div className="menu-selector">
                      {(menu.options || []).map((option) => {
                        const selection = form.selection.selected_menus
                          .find((item) => item.menu_id === menu.menuId)
                          ?.selected_options.find((item) => item.option_value === option.value);

                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`menu-tag ${selection ? 'menu-tag--selected' : ''}`}
                            onClick={() => toggleOptionSelection(menu.menuId, menu.selectionMode, option.value)}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>

                    {(form.selection.selected_menus.find((item) => item.menu_id === menu.menuId)?.selected_options || []).map(
                      (selectedOption) => {
                        const optionDefinition = (menu.options || []).find((option) => option.value === selectedOption.option_value);
                        if (!optionDefinition || !optionDefinition.subOptions || optionDefinition.subOptions.length === 0) {
                          return null;
                        }

                        return (
                          <div key={`${menu.menuId}-${selectedOption.option_value}`} className="ctx-editor-suboptions">
                            <span className="ctx-editor-suboptions__label">
                              Sub-opções de "{optionDefinition.label}"
                            </span>
                            <div className="menu-selector menu-selector--sub">
                              {optionDefinition.subOptions.map((subOption) => (
                                <button
                                  key={subOption.value}
                                  type="button"
                                  className={`menu-tag menu-tag--sub ${
                                    selectedOption.selected_sub_options.includes(subOption.value)
                                      ? 'menu-tag--selected'
                                      : ''
                                  }`}
                                  onClick={() => toggleSubOptionSelection(menu.menuId, optionDefinition.value, subOption.value)}
                                >
                                  {subOption.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Toggle Button for Mobile / Closed State */}
      <button
        className={`editor-floating-toggle ${isSidebarOpen ? 'editor-floating-toggle--active' : ''}`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Alternar Playground"
      >
        {isSidebarOpen ? <PanelRightClose size={24} /> : <PanelRightOpen size={24} />}
      </button>
    </div>

    {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div
            ref={previewModalRef}
            className="modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-preview-title"
            tabIndex={-1}
          >
            <div className="modal__header">
              <h2 id="editor-preview-title">Preview do prompt</h2>
              <button
                ref={previewCloseButtonRef}
                className="btn btn--ghost btn--icon"
                onClick={() => setShowPreview(false)}
                aria-label="Fechar preview"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal__body">
              {previewState.payload ? (
                <>
                  <div className="form-section form-section--flush">
                    <h3 className="section-title">Prompt final</h3>
                    <pre className="json-preview json-preview--prompt">{previewState.renderedPrompt}</pre>
                  </div>
                  <div className="form-section form-section--flush">
                    <h3 className="section-title">Payload técnico</h3>
                    <pre className="json-preview">{JSON.stringify(previewState.payload, null, 2)}</pre>
                  </div>
                </>
              ) : (
                <div className="form-error" role="alert">
                  {previewState.error}
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={handleCopy}>
                <Copy size={16} /> Copiar prompt
              </button>
              <button className="btn btn--primary" onClick={handleDownload}>
                <Download size={16} /> Baixar .json
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
