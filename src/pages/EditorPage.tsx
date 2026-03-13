import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Copy, Download, Eye, Save, PanelRightClose, PanelRightOpen, X } from 'lucide-react';

import { db } from '@/db/database';
import { useToast } from '@/context/ToastContext';
import { useAccessibleModal } from '@/hooks/useAccessibleModal';
import { useDebounce } from '@/hooks/useDebounce';
import type { Category, ContextMenu, Prompt } from '@/models/types';
import {
  CompiledPromptPayload,
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
} from '@/models/promptSchema';
import { savePromptToSupabase } from '@/services/supabasePrompts';
import { renderFinalPromptText, syncTemplateWithLinkedMenus } from '@/utils/promptArtifacts';
import { saveLocalBackup } from '@/utils/backupManager';
import { copyToClipboard, downloadJson } from '@/utils/exportJson';
import { migrateTemplateToCurrentSchema } from '@/utils/templateMigration';

import { EditorMetaForm } from '@/components/editor/EditorMetaForm';
import { EditorDefinitionForm } from '@/components/editor/EditorDefinitionForm';
import { EditorContextMenuSelector } from '@/components/editor/EditorContextMenuSelector';
import { EditorPlayground } from '@/components/editor/EditorPlayground';
import { EditorPreviewModal } from '@/components/editor/EditorPreviewModal';

type FreeInputEntry = { key: string; value: string };

type TemplateFormState = {
  categoryId: number;
  template: TemplatePayload;
  selection: UserSelection;
  freeInputs: FreeInputEntry[];
};

function splitLines(value: string): string[] {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
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
    entries.map((entry) => [entry.key.trim(), entry.value] as const).filter(([key]) => Boolean(key))
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
  const linkedMenuIds = [
    ...new Set([...(template.menu_ids || []), ...template.menu_definitions.map((menu) => menu.menu_id)]),
  ];
  const selection = parseUserSelection(prompt.selectionPayload, template.meta.template_id, {
    title: prompt.title,
    schemaVersion: prompt.schemaVersion,
    language: prompt.language,
  });

  return {
    categoryId: prompt.categoryId,
    template: TemplatePayloadSchema.parse({ ...template, menu_ids: linkedMenuIds }),
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
        form.template.meta.template_id.trim() ||
        form.template.meta.template_name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
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

  return { template: syncedTemplate, selection: normalizedSelection, compiledPayload, renderedPrompt, migrationWarnings: migration.warnings };
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
      if (prompt) setForm(buildFormStateFromPrompt(prompt));
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
        setForm((current) => ({ ...current, ...draftData }));
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
      return { payload: null, template: null, selection: null, renderedPrompt: '', error: error.message || 'Payload inválido' };
    }
  }, [availableContextMenus, form]);

  useAccessibleModal({ isOpen: showPreview, onClose: () => setShowPreview(false) });

  const updateTemplate = (updater: (current: TemplatePayload) => TemplatePayload) => {
    setForm((current) => {
      const nextTemplate = updater(current.template);
      const nextSelection =
        current.selection.template_id === current.template.meta.template_id
          ? { ...current.selection, template_id: nextTemplate.meta.template_id }
          : current.selection;
      return { ...current, template: nextTemplate, selection: nextSelection };
    });
  };

  const updateMetaField = <K extends keyof TemplatePayload['meta']>(field: K, value: TemplatePayload['meta'][K]) => {
    updateTemplate((current) => TemplatePayloadSchema.parse({ ...current, meta: { ...current.meta, [field]: value } }));
  };

  const updatePromptDefinitionField = <K extends keyof TemplatePayload['prompt_definition']>(
    field: K,
    value: TemplatePayload['prompt_definition'][K]
  ) => {
    updateTemplate((current) =>
      TemplatePayloadSchema.parse({ ...current, prompt_definition: { ...current.prompt_definition, [field]: value } })
    );
  };

  const updateOutputContractField = <K extends keyof PromptOutputContract>(field: K, value: PromptOutputContract[K]) => {
    updateTemplate((current) =>
      TemplatePayloadSchema.parse({ ...current, output_contract: { ...current.output_contract, [field]: value } })
    );
  };

  const toggleOptionSelection = (menuId: string, selectionMode: string, optionValue: string) => {
    setForm((current) => {
      const existingMenu = current.selection.selected_menus.find((item) => item.menu_id === menuId);
      const hasOption = existingMenu?.selected_options.some((item) => item.option_value === optionValue);
      let selected_menus = [...current.selection.selected_menus];

      if (selectionMode === 'single') {
        selected_menus = hasOption
          ? selected_menus.filter((item) => item.menu_id !== menuId)
          : [...selected_menus.filter((item) => item.menu_id !== menuId), { menu_id: menuId, selected_options: [{ option_value: optionValue, selected_sub_options: [] }] }];
      } else if (existingMenu) {
        selected_menus = selected_menus.map((item) =>
          item.menu_id !== menuId
            ? item
            : {
                ...item,
                selected_options: hasOption
                  ? item.selected_options.filter((selectedOption) => selectedOption.option_value !== optionValue)
                  : [...item.selected_options, { option_value: optionValue, selected_sub_options: [] }],
              }
        );
      } else {
        selected_menus = [...selected_menus, { menu_id: menuId, selected_options: [{ option_value: optionValue, selected_sub_options: [] }] }];
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
    setForm((current) => ({ ...current, freeInputs: current.freeInputs.map((entry, i) => (i === index ? nextEntry : entry)) }));
  };

  const addFreeInput = () => setForm((current) => ({ ...current, freeInputs: [...current.freeInputs, { key: '', value: '' }] }));
  const removeFreeInput = (index: number) => {
    setForm((current) => ({
      ...current,
      freeInputs: current.freeInputs.filter((_, i) => i !== index).length > 0
        ? current.freeInputs.filter((_, i) => i !== index)
        : [{ key: '', value: '' }],
    }));
  };

  const clearDraft = () => localStorage.removeItem(`template_draft_${id}`);

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
        localId = (await db.prompts.add({ ...promptRecord, syncStatus: 'pending' } as Prompt)) ?? null;
        navigate(`/editor/${localId}`, { replace: true });
      } else {
        localId = Number(id);
        const existingPrompt = await db.prompts.get(localId);
        await db.prompts.update(localId, { ...promptRecord, createdAt: existingPrompt?.createdAt || now, syncStatus: 'pending' });
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
      const savedRemote = await savePromptToSupabase({ ...promptRecord, remoteId: existingPrompt?.remoteId });
      if (localId !== null) {
        await db.prompts.update(localId, { remoteId: savedRemote.id, syncStatus: 'synced' });
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

  const handleMenuToggle = (menuId: string, checked: boolean) => {
    setForm((current) => {
      const nextMenuIds = checked
        ? [...(current.template.menu_ids || []), menuId]
        : (current.template.menu_ids || []).filter((id) => id !== menuId);
      const uniqueMenuIds = [...new Set(nextMenuIds)];
      return {
        ...current,
        template: syncTemplateWithLinkedMenus(
          TemplatePayloadSchema.parse({ ...current.template, menu_ids: uniqueMenuIds }),
          availableContextMenus
        ),
        selection: UserSelectionSchema.parse({
          ...current.selection,
          selected_menus: current.selection.selected_menus.filter((item) => uniqueMenuIds.includes(item.menu_id)),
        }),
      };
    });
  };

  if (!loaded) return null;

  return (
    <>
      <header className="app-header">
        <div className="flex-row-center">
          <button className="btn btn--ghost btn--icon" onClick={() => navigate(-1)} aria-label="Voltar" title="Voltar">
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
        <div className={`editor-main-scrollable ${isSidebarOpen ? 'editor-main-scrollable--with-sidebar' : ''}`}>
          <div className="app-content">
            <div className="editor-form--constrained">
              <EditorMetaForm
                template={form.template}
                categoryId={form.categoryId}
                categories={categories}
                updateMetaField={updateMetaField}
                onCategoryChange={(categoryId) => setForm((current) => ({ ...current, categoryId }))}
              />

              <EditorDefinitionForm
                template={form.template}
                updatePromptDefinitionField={updatePromptDefinitionField}
                updateOutputContractField={updateOutputContractField}
              />

              <EditorContextMenuSelector
                template={form.template}
                contextMenus={availableContextMenus}
                onMenuToggle={handleMenuToggle}
              />

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

        <aside className={`editor-floating-sidebar ${isSidebarOpen ? 'editor-floating-sidebar--open' : ''}`}>
          <div className="editor-floating-sidebar__header">
            <h3 className="form-section__title editor-floating-sidebar__title">
              <Settings2 size={18} /> Playground
            </h3>
            <button className="btn btn--ghost btn--icon" onClick={() => setIsSidebarOpen(false)} aria-label="Fechar Playground">
              <X size={18} />
            </button>
          </div>
          <div className="editor-floating-sidebar__content">
            <EditorPlayground
              template={form.template}
              selection={form.selection}
              contextMenus={availableContextMenus}
              onAddFreeInput={addFreeInput}
              onRemoveFreeInput={removeFreeInput}
              onUpdateFreeInput={updateFreeInput}
              onToggleOption={toggleOptionSelection}
              onToggleSubOption={toggleSubOptionSelection}
            />
          </div>
        </aside>

        <button
          className={`editor-floating-toggle ${isSidebarOpen ? 'editor-floating-toggle--active' : ''}`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Alternar Playground"
        >
          {isSidebarOpen ? <PanelRightClose size={24} /> : <PanelRightOpen size={24} />}
        </button>
      </div>

      <EditorPreviewModal
        isOpen={showPreview}
        renderedPrompt={previewState.renderedPrompt}
        payload={previewState.payload}
        error={previewState.error}
        onClose={() => setShowPreview(false)}
        onCopy={handleCopy}
        onDownload={handleDownload}
      />
    </>
  );
}
