import { useEffect, useMemo, useState } from 'react';
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
  X,
  Zap,
} from 'lucide-react';

import { db } from '@/db/database';
import { useToast } from '@/context/ToastContext';
import { useDebounce } from '@/hooks/useDebounce';
import type { Category, ContextMenu, Prompt } from '@/models/types';
import {
  CompiledPromptPayload,
  MenuDefinition,
  MenuDefinitionSchema,
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
import { saveLocalBackup } from '@/utils/backupManager';
import { copyToClipboard, downloadJson } from '@/utils/exportJson';

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

function contextMenuToDefinition(menu: ContextMenu): MenuDefinition {
  return MenuDefinitionSchema.parse({
    menu_id: menu.menuId,
    menu_name: menu.menuName,
    description: menu.description,
    selection_mode: menu.selectionMode,
    required: false,
    options: (menu.options || []).map((option) => ({
      label: option.label,
      value: option.value,
      description: '',
      sub_options: (option.subOptions || []).map((subOption) => ({
        label: subOption.label,
        value: subOption.value,
        description: '',
      })),
    })),
  });
}

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

function mergeLegacyMenusIntoTemplate(template: TemplatePayload, contextMenus: ContextMenu[]): TemplatePayload {
  if (template.menu_definitions.length > 0) {
    return template;
  }

  if (contextMenus.length === 0) {
    return template;
  }

  return TemplatePayloadSchema.parse({
    ...template,
    menu_definitions: contextMenus.map(contextMenuToDefinition),
  });
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

function buildFormStateFromPrompt(prompt: Prompt, contextMenus: ContextMenu[]): TemplateFormState {
  const template = mergeLegacyMenusIntoTemplate(parsePromptPayload(prompt.promptPayload), contextMenus);
  const selection = parseUserSelection(prompt.selectionPayload, template.meta.template_id, {
    title: prompt.title,
    schemaVersion: prompt.schemaVersion,
    language: prompt.language,
  });

  return {
    categoryId: prompt.categoryId,
    template,
    selection,
    freeInputs: toFreeInputEntries(selection),
  };
}

function replaceMenuAt(template: TemplatePayload, index: number, nextMenu: MenuDefinition): TemplatePayload {
  const menu_definitions = [...template.menu_definitions];
  menu_definitions[index] = nextMenu;
  return TemplatePayloadSchema.parse({
    ...template,
    menu_definitions,
  });
}

function buildPersistedArtifacts(form: TemplateFormState) {
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

  const rawSelection = UserSelectionSchema.parse({
    ...form.selection,
    template_id: normalizedTemplate.meta.template_id,
    free_inputs: fromFreeInputEntries(form.freeInputs),
  });

  const normalizedSelection = sanitizeUserSelection(normalizedTemplate, rawSelection);
  const compiledPayload = compilePromptPayload(normalizedTemplate, normalizedSelection);

  return {
    template: normalizedTemplate,
    selection: normalizedSelection,
    compiledPayload,
  };
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isNew = id === 'novo';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState<TemplateFormState>(buildInitialFormState());

  const contextMenus = useLiveQuery(() => db.contextMenus.toArray()) ?? [];
  const debouncedForm = useDebounce(form, 1200);

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
        setForm(buildFormStateFromPrompt(prompt, contextMenus));
      }
      setLoaded(true);
    });
  }, [contextMenus, id, isNew]);

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
      const artifacts = buildPersistedArtifacts(form);
      return {
        payload: artifacts.compiledPayload,
        template: artifacts.template,
        selection: artifacts.selection,
        error: null,
      };
    } catch (error: any) {
      return {
        payload: null,
        template: null,
        selection: null,
        error: error.message || 'Payload inválido',
      };
    }
  }, [form]);

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

  const addMenuGroup = () => {
    updateTemplate((current) =>
      TemplatePayloadSchema.parse({
        ...current,
        menu_definitions: [
          ...current.menu_definitions,
          {
            menu_id: '',
            menu_name: '',
            description: '',
            selection_mode: 'single',
            required: false,
            options: [],
          },
        ],
      })
    );
  };

  const removeMenuGroup = (menuIndex: number) => {
    setForm((current) => {
      const removedMenu = current.template.menu_definitions[menuIndex];
      const nextTemplate = TemplatePayloadSchema.parse({
        ...current.template,
        menu_definitions: current.template.menu_definitions.filter((_, index) => index !== menuIndex),
      });

      const nextSelection = UserSelectionSchema.parse({
        ...current.selection,
        selected_menus: current.selection.selected_menus.filter((item) => item.menu_id !== removedMenu?.menu_id),
      });

      return {
        ...current,
        template: nextTemplate,
        selection: nextSelection,
      };
    });
  };

  const updateMenuGroup = (menuIndex: number, updater: (menu: MenuDefinition) => MenuDefinition) => {
    updateTemplate((current) => replaceMenuAt(current, menuIndex, updater(current.menu_definitions[menuIndex])));
  };

  const addMenuOption = (menuIndex: number) => {
    updateMenuGroup(menuIndex, (menu) =>
      MenuDefinitionSchema.parse({
        ...menu,
        options: [
          ...menu.options,
          {
            label: '',
            value: '',
            description: '',
            sub_options: [],
          },
        ],
      })
    );
  };

  const removeMenuOption = (menuIndex: number, optionIndex: number) => {
    setForm((current) => {
      const menu = current.template.menu_definitions[menuIndex];
      const removedOption = menu.options[optionIndex];
      const nextMenu = MenuDefinitionSchema.parse({
        ...menu,
        options: menu.options.filter((_, index) => index !== optionIndex),
      });

      const nextTemplate = replaceMenuAt(current.template, menuIndex, nextMenu);
      const nextSelection = UserSelectionSchema.parse({
        ...current.selection,
        selected_menus: current.selection.selected_menus.map((selectedMenu) => {
          if (selectedMenu.menu_id !== menu.menu_id) return selectedMenu;
          return {
            ...selectedMenu,
            selected_options: selectedMenu.selected_options.filter(
              (selectedOption) => selectedOption.option_value !== removedOption?.value
            ),
          };
        }),
      });

      return {
        ...current,
        template: nextTemplate,
        selection: nextSelection,
      };
    });
  };

  const updateMenuOption = (
    menuIndex: number,
    optionIndex: number,
    updater: (option: MenuDefinition['options'][number]) => MenuDefinition['options'][number]
  ) => {
    updateMenuGroup(menuIndex, (menu) =>
      MenuDefinitionSchema.parse({
        ...menu,
        options: menu.options.map((option, index) => (index === optionIndex ? updater(option) : option)),
      })
    );
  };

  const addSubOption = (menuIndex: number, optionIndex: number) => {
    updateMenuOption(menuIndex, optionIndex, (option) => ({
      ...option,
      sub_options: [
        ...option.sub_options,
        {
          label: '',
          value: '',
          description: '',
        },
      ],
    }));
  };

  const removeSubOption = (menuIndex: number, optionIndex: number, subOptionIndex: number) => {
    setForm((current) => {
      const menu = current.template.menu_definitions[menuIndex];
      const option = menu.options[optionIndex];
      const removedSubOption = option.sub_options[subOptionIndex];

      const nextOption = {
        ...option,
        sub_options: option.sub_options.filter((_, index) => index !== subOptionIndex),
      };

      const nextMenu = MenuDefinitionSchema.parse({
        ...menu,
        options: menu.options.map((item, index) => (index === optionIndex ? nextOption : item)),
      });

      const nextTemplate = replaceMenuAt(current.template, menuIndex, nextMenu);
      const nextSelection = UserSelectionSchema.parse({
        ...current.selection,
        selected_menus: current.selection.selected_menus.map((selectedMenu) => {
          if (selectedMenu.menu_id !== menu.menu_id) return selectedMenu;

          return {
            ...selectedMenu,
            selected_options: selectedMenu.selected_options.map((selectedOption) => {
              if (selectedOption.option_value !== option.value) return selectedOption;
              return {
                ...selectedOption,
                selected_sub_options: selectedOption.selected_sub_options.filter(
                  (value) => value !== removedSubOption?.value
                ),
              };
            }),
          };
        }),
      });

      return {
        ...current,
        template: nextTemplate,
        selection: nextSelection,
      };
    });
  };

  const updateSubOption = (
    menuIndex: number,
    optionIndex: number,
    subOptionIndex: number,
    updater: (subOption: MenuDefinition['options'][number]['sub_options'][number]) => MenuDefinition['options'][number]['sub_options'][number]
  ) => {
    updateMenuOption(menuIndex, optionIndex, (option) => ({
      ...option,
      sub_options: option.sub_options.map((subOption, index) =>
        index === subOptionIndex ? updater(subOption) : subOption
      ),
    }));
  };

  const toggleOptionSelection = (menu: MenuDefinition, optionValue: string) => {
    setForm((current) => {
      const existingMenu = current.selection.selected_menus.find((item) => item.menu_id === menu.menu_id);
      const hasOption = existingMenu?.selected_options.some((item) => item.option_value === optionValue);

      let selected_menus = [...current.selection.selected_menus];

      if (menu.selection_mode === 'single') {
        if (hasOption) {
          selected_menus = selected_menus.filter((item) => item.menu_id !== menu.menu_id);
        } else {
          selected_menus = [
            ...selected_menus.filter((item) => item.menu_id !== menu.menu_id),
            {
              menu_id: menu.menu_id,
              selected_options: [{ option_value: optionValue, selected_sub_options: [] }],
            },
          ];
        }
      } else if (existingMenu) {
        selected_menus = selected_menus.map((item) => {
          if (item.menu_id !== menu.menu_id) return item;
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
            menu_id: menu.menu_id,
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

    try {
      ({ template, selection, compiledPayload } = buildPersistedArtifacts(form));
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
      console.error('Erro ao salvar no Supabase:', error);
      showToast('Template salvo localmente. Sincronize ao fazer login.', 'info');
    }
  };

  const handleCopy = async () => {
    if (!previewState.payload) {
      showToast(previewState.error || 'Payload inválido', 'error');
      return;
    }

    const ok = await copyToClipboard(JSON.stringify(previewState.payload, null, 2));
    showToast(ok ? 'Payload compilado copiado!' : 'Erro ao copiar', ok ? 'success' : 'error');
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
            <Eye size={16} /> Preview compilado
          </button>
          <button className="btn btn--secondary" onClick={handleCopy}>
            <Copy size={16} /> Copiar
          </button>
          <button className="btn btn--secondary" onClick={handleDownload}>
            <Download size={16} /> Baixar
          </button>
          <button className="btn btn--primary" onClick={handleSave}>
            <Save size={16} /> Salvar
          </button>
        </div>
      </header>

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
                  <Layers size={18} /> Menus do Template
                </h3>
                <p className="page-header__subtitle">
                  Cada template define seus próprios grupos, opções e sub-opções.
                </p>
              </div>
              <button className="btn btn--secondary" onClick={addMenuGroup}>
                <Plus size={16} /> Novo grupo
              </button>
            </div>

            {form.template.menu_definitions.length === 0 ? (
              <p className="ctx-empty-hint">Nenhum grupo criado para este template.</p>
            ) : (
              <div className="dynamic-list">
                {form.template.menu_definitions.map((menu, menuIndex) => (
                  <div key={`${menu.menu_id || 'menu'}-${menuIndex}`} className="card card--active">
                    <div className="page-header">
                      <div>
                        <h4 className="page-header__title">{menu.menu_name || `Grupo ${menuIndex + 1}`}</h4>
                        <p className="page-header__subtitle">{menu.description || 'Sem descrição'}</p>
                      </div>
                      <button
                        className="btn btn--ghost btn--icon"
                        onClick={() => removeMenuGroup(menuIndex)}
                        aria-label="Remover grupo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Menu ID</label>
                      <input
                        value={menu.menu_id}
                        onChange={(event) =>
                          updateMenuGroup(menuIndex, (currentMenu) => ({
                            ...currentMenu,
                            menu_id: event.target.value,
                          }))
                        }
                        placeholder="personagens"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Menu name</label>
                      <input
                        value={menu.menu_name}
                        onChange={(event) =>
                          updateMenuGroup(menuIndex, (currentMenu) => ({
                            ...currentMenu,
                            menu_name: event.target.value,
                          }))
                        }
                        placeholder="PERSONAGENS NA CENA"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        value={menu.description}
                        onChange={(event) =>
                          updateMenuGroup(menuIndex, (currentMenu) => ({
                            ...currentMenu,
                            description: event.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Explique o objetivo do grupo"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Selection mode</label>
                      <select
                        value={menu.selection_mode}
                        onChange={(event) =>
                          updateMenuGroup(menuIndex, (currentMenu) => ({
                            ...currentMenu,
                            selection_mode: event.target.value as MenuDefinition['selection_mode'],
                          }))
                        }
                      >
                        <option value="single">single</option>
                        <option value="multiple">multiple</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <input
                          type="checkbox"
                          checked={menu.required}
                          onChange={(event) =>
                            updateMenuGroup(menuIndex, (currentMenu) => ({
                              ...currentMenu,
                              required: event.target.checked,
                            }))
                          }
                        />
                        {' '}Grupo obrigatório
                      </label>
                    </div>

                    <div className="dynamic-list">
                      {menu.options.map((option, optionIndex) => (
                        <div key={`${option.value || 'option'}-${optionIndex}`} className="card">
                          <div className="page-header">
                            <div>
                              <h4 className="page-header__title">{option.label || `Opção ${optionIndex + 1}`}</h4>
                            </div>
                            <button
                              className="btn btn--ghost btn--icon"
                              onClick={() => removeMenuOption(menuIndex, optionIndex)}
                              aria-label="Remover opção"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Label</label>
                            <input
                              value={option.label}
                              onChange={(event) =>
                                updateMenuOption(menuIndex, optionIndex, (currentOption) => ({
                                  ...currentOption,
                                  label: event.target.value,
                                }))
                              }
                              placeholder="1 pessoa"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Value</label>
                            <input
                              value={option.value}
                              onChange={(event) =>
                                updateMenuOption(menuIndex, optionIndex, (currentOption) => ({
                                  ...currentOption,
                                  value: event.target.value,
                                }))
                              }
                              placeholder="uma_pessoa"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Description</label>
                            <input
                              value={option.description}
                              onChange={(event) =>
                                updateMenuOption(menuIndex, optionIndex, (currentOption) => ({
                                  ...currentOption,
                                  description: event.target.value,
                                }))
                              }
                              placeholder="Cena com uma pessoa"
                            />
                          </div>

                          <div className="dynamic-list">
                            {option.sub_options.map((subOption, subOptionIndex) => (
                              <div key={`${subOption.value || 'sub'}-${subOptionIndex}`} className="card">
                                <div className="page-header">
                                  <div>
                                    <h4 className="page-header__title">{subOption.label || `Sub-opção ${subOptionIndex + 1}`}</h4>
                                  </div>
                                  <button
                                    className="btn btn--ghost btn--icon"
                                    onClick={() => removeSubOption(menuIndex, optionIndex, subOptionIndex)}
                                    aria-label="Remover sub-opção"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>

                                <div className="form-group">
                                  <label className="form-label">Label</label>
                                  <input
                                    value={subOption.label}
                                    onChange={(event) =>
                                      updateSubOption(menuIndex, optionIndex, subOptionIndex, (currentSubOption) => ({
                                        ...currentSubOption,
                                        label: event.target.value,
                                      }))
                                    }
                                    placeholder="Jovem adulto (18-29)"
                                  />
                                </div>

                                <div className="form-group">
                                  <label className="form-label">Value</label>
                                  <input
                                    value={subOption.value}
                                    onChange={(event) =>
                                      updateSubOption(menuIndex, optionIndex, subOptionIndex, (currentSubOption) => ({
                                        ...currentSubOption,
                                        value: event.target.value,
                                      }))
                                    }
                                    placeholder="1p_jovem_adulto_18_29"
                                  />
                                </div>
                              </div>
                            ))}

                            <button className="btn btn--ghost btn--sm dynamic-list__add" onClick={() => addSubOption(menuIndex, optionIndex)}>
                              <Plus size={14} /> Nova sub-opção
                            </button>
                          </div>
                        </div>
                      ))}

                      <button className="btn btn--ghost btn--sm dynamic-list__add" onClick={() => addMenuOption(menuIndex)}>
                        <Plus size={14} /> Nova opção
                      </button>
                    </div>
                  </div>
                ))}
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

          <div className="form-section">
            <div className="page-header">
              <div>
                <h3 className="form-section__title">
                  <Settings2 size={18} /> Playground de Uso
                </h3>
                <p className="page-header__subtitle">
                  Essas seleções são persistidas e alimentam o payload compilado.
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

            {form.template.menu_definitions.length === 0 ? (
              <p className="ctx-empty-hint">Crie grupos de menu acima para testar a compilação.</p>
            ) : (
              <div className="ctx-editor-grid">
                {form.template.menu_definitions.map((menu) => (
                  <div key={menu.menu_id} className="ctx-editor-menu">
                    <div className="ctx-editor-menu__header">
                      <span className="ctx-editor-menu__name">{menu.menu_name || menu.menu_id}</span>
                      <span className="ctx-editor-menu__selection">
                        {menu.selection_mode === 'multiple' ? 'Múltipla' : 'Única'}
                      </span>
                    </div>
                    {menu.description && <p className="form-label__hint">{menu.description}</p>}
                    <div className="menu-selector">
                      {menu.options.map((option) => {
                        const selection = form.selection.selected_menus
                          .find((item) => item.menu_id === menu.menu_id)
                          ?.selected_options.find((item) => item.option_value === option.value);

                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`menu-tag ${selection ? 'menu-tag--selected' : ''}`}
                            onClick={() => toggleOptionSelection(menu, option.value)}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>

                    {(form.selection.selected_menus.find((item) => item.menu_id === menu.menu_id)?.selected_options || []).map(
                      (selectedOption) => {
                        const optionDefinition = menu.options.find((option) => option.value === selectedOption.option_value);
                        if (!optionDefinition || optionDefinition.sub_options.length === 0) {
                          return null;
                        }

                        return (
                          <div key={`${menu.menu_id}-${selectedOption.option_value}`} className="ctx-editor-suboptions">
                            <span className="ctx-editor-suboptions__label">
                              Sub-opções de "{optionDefinition.label}"
                            </span>
                            <div className="menu-selector menu-selector--sub">
                              {optionDefinition.sub_options.map((subOption) => (
                                <button
                                  key={subOption.value}
                                  type="button"
                                  className={`menu-tag menu-tag--sub ${
                                    selectedOption.selected_sub_options.includes(subOption.value)
                                      ? 'menu-tag--selected'
                                      : ''
                                  }`}
                                  onClick={() => toggleSubOptionSelection(menu.menu_id, optionDefinition.value, subOption.value)}
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

          <div className="editor-footer">
            <button className="btn btn--secondary btn--lg" onClick={() => navigate(-1)}>
              Cancelar
            </button>
            <button className="btn btn--primary btn--lg" onClick={handleSave}>
              <Save size={18} /> Salvar Template
            </button>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal__header">
              <h2>Preview compilado</h2>
              <button
                className="btn btn--ghost btn--icon"
                onClick={() => setShowPreview(false)}
                aria-label="Fechar preview"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal__body">
              {previewState.payload ? (
                <pre className="json-preview">{JSON.stringify(previewState.payload, null, 2)}</pre>
              ) : (
                <div className="form-error" role="alert">
                  {previewState.error}
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={handleCopy}>
                <Copy size={16} /> Copiar
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
