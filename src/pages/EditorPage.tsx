import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Copy, Download, Eye, Save, PanelRightClose, PanelRightOpen, X, Settings2 } from 'lucide-react';

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
  sanitizeUserSelection,
} from '@/models/promptSchema';
import { savePromptToSupabase } from '@/services/supabasePrompts';
import { fetchMemory, saveMemory, deleteMemory, syncMemory } from '@/services/memoryService';
import { renderFinalPromptText, syncTemplateWithLinkedMenus } from '@/utils/promptArtifacts';
import { saveLocalBackup } from '@/utils/backupManager';
import { copyToClipboard, downloadJson, formatPromptAsMarkdown } from '@/utils/exportJson';
import { migrateTemplateToCurrentSchema } from '@/utils/templateMigration';

import { EditorMetaForm } from '@/components/editor/EditorMetaForm';
import { EditorDefinitionForm } from '@/components/editor/EditorDefinitionForm';
import { EditorPlayground } from '@/components/editor/EditorPlayground';
import { EditorPreviewModal } from '@/components/editor/EditorPreviewModal';
import { Breadcrumb } from '@/components/Breadcrumb';
import SEO from '@/components/SEO';
import { z } from 'zod';

type FreeInputEntry = { key: string; value: string };

const FreeInputEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
});

type TemplateFormState = {
  categoryId: number;
  template: TemplatePayload;
  selection: UserSelection;
  freeInputs: FreeInputEntry[];
  selectedMenuIds: number[];
};

const TemplateFormStatePartialSchema = z.object({
  categoryId: z.number().optional(),
  template: TemplatePayloadSchema.optional(),
  selection: UserSelectionSchema.optional(),
  freeInputs: z.array(FreeInputEntrySchema).optional(),
  selectedMenuIds: z.array(z.number()).optional(),
}).passthrough();

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
    selectedMenuIds: [],
  };
}

function getLinkedContextMenusFromSelection(
  contextMenus: ContextMenu[],
  selectedMenuIds: number[],
) {
  return contextMenus.filter(
    (menu): menu is ContextMenu & { id: number } =>
      typeof menu.id === 'number' && selectedMenuIds.includes(menu.id),
  );
}

function syncFormMenus(current: TemplateFormState, contextMenus: ContextMenu[]): TemplateFormState {
  const linkedContextMenus = getLinkedContextMenusFromSelection(
    contextMenus,
    current.selectedMenuIds,
  );
  const linkedMenuIds = linkedContextMenus.map((menu) => menu.menuId);
  const template = syncTemplateWithLinkedMenus(
    TemplatePayloadSchema.parse({ ...current.template, menu_ids: linkedMenuIds }),
    linkedContextMenus,
  );

  return {
    ...current,
    template,
    selection: UserSelectionSchema.parse({
      ...current.selection,
      template_id: template.meta.template_id,
      selected_menus: current.selection.selected_menus.filter((item) =>
        linkedMenuIds.includes(item.menu_id),
      ),
    }),
  };
}

function buildFormStateFromPrompt(prompt: Prompt, contextMenus: ContextMenu[]): TemplateFormState {
  const parsedTemplate = parsePromptPayload(prompt.promptPayload);
  const persistedMenuIds = prompt.selectedMenuIds || [];
  const inferredSelectedMenuIds =
    persistedMenuIds.length > 0
      ? persistedMenuIds
      : contextMenus
          .filter(
            (menu): menu is ContextMenu & { id: number } =>
              typeof menu.id === 'number' &&
              [
                ...(parsedTemplate.menu_ids || []),
                ...parsedTemplate.menu_definitions.map((menuDefinition) => menuDefinition.menu_id),
              ].includes(menu.menuId),
          )
          .map((menu) => menu.id);
  const selection = parseUserSelection(prompt.selectionPayload, parsedTemplate.meta.template_id, {
    title: prompt.title,
    schemaVersion: prompt.schemaVersion,
    language: prompt.language,
  });

  const baseState: TemplateFormState = {
    categoryId: prompt.categoryId,
    template: parsedTemplate,
    selection,
    freeInputs: toFreeInputEntries(selection),
    selectedMenuIds: inferredSelectedMenuIds,
  };

  return contextMenus.length > 0 ? syncFormMenus(baseState, contextMenus) : baseState;
}

function buildPersistedArtifacts(
  form: TemplateFormState,
  contextMenus: ContextMenu[],
  fixedMemory: Record<string, string> = {}
) {
  const linkedContextMenus = getLinkedContextMenusFromSelection(
    contextMenus,
    form.selectedMenuIds,
  );
  const linkedMenuIds = linkedContextMenus.map((menu) => menu.menuId);
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
      few_shot_examples: form.template.prompt_definition.few_shot_examples.filter(
        (example) => example.input.trim().length > 0 && example.output.trim().length > 0
      ),
    },
    menu_ids: linkedMenuIds,
    output_contract: PromptOutputContractSchema.parse(form.template.output_contract),
  });
  const migration = migrateTemplateToCurrentSchema(
    syncTemplateWithLinkedMenus(normalizedTemplate, linkedContextMenus)
  );
  const syncedTemplate = migration.template;

  const rawSelection = UserSelectionSchema.parse({
    ...form.selection,
    template_id: syncedTemplate.meta.template_id,
    free_inputs: {
      ...fixedMemory,
      ...fromFreeInputEntries(form.freeInputs),
    },
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

const EMPTY_MENUS: never[] = [];

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const previewModalRef = useRef<HTMLDivElement>(null);
  const draftAppliedRef = useRef(false);
  const isNew = id === 'novo';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? !window.matchMedia('(max-width: 768px)').matches : true
  );
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [form, setForm] = useState<TemplateFormState>(buildInitialFormState());
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [fixedMemory, setFixedMemory] = useState<Record<string, string>>({});
  const [isMemoryLoading, setIsMemoryLoading] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);

  const contextMenus = useLiveQuery(async () => {
    return await db.contextMenus.filter((m) => !m.isDeleted).toArray();
  }) ?? EMPTY_MENUS;
  
  const debouncedForm = useDebounce(form, 300);
  const debouncedFixedMemory = useDebounce(fixedMemory, 800);
  
  const availableContextMenus = useMemo(
    () => Array.from(new Map(contextMenus.map((menu) => [menu.menuId, menu])).values()),
    [contextMenus]
  );

  useEffect(() => {
    (async () => {
      const categoryList = await db.categories.filter((c) => !c.isDeleted).toArray();
      setCategories(categoryList.sort((a, b) => a.name.localeCompare(b.name)));
    })();
  }, []);

  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add('editor-focus-mode');
    } else {
      document.body.classList.remove('editor-focus-mode');
    }
    return () => {
      document.body.classList.remove('editor-focus-mode');
    };
  }, [isFocusMode]);

  useEffect(() => {
    if (!form.template.meta.template_id) return;

    (async () => {
      try {
        setIsMemoryLoading(true);
        const memory = await fetchMemory(form.template.meta.template_id);
        setFixedMemory(memory);
      } catch (error) {
        console.error('Erro ao carregar memória fixa:', error);
      } finally {
        setIsMemoryLoading(false);
      }
    })();
  }, [form.template.meta.template_id]);

  // Autosave da Memória Fixa (Debounced)
  useEffect(() => {
    // Evita salvar no load inicial ou se nada mudou de fato
    if (!loaded || !form.template.meta.template_id || Object.keys(debouncedFixedMemory).length === 0) return;

    const saveChanges = async () => {
      setIsSavingMemory(true);
      try {
        await syncMemory(form.template.meta.template_id, debouncedFixedMemory);
      } catch (error) {
        if (!isUnauthenticatedCloudError(error)) {
          showToast('Erro ao sincronizar memória context', 'error');
        }
      } finally {
        // Feedback visual mínimo
        setTimeout(() => setIsSavingMemory(false), 800);
      }
    };

    saveChanges();
  }, [debouncedFixedMemory, loaded, form.template.meta.template_id, showToast]);

  useEffect(() => {
    if (!loaded && isNew && categories.length > 0) {
      const categoryFromQuery = Number(searchParams.get('categoria') || categories[0]?.id || 0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(buildInitialFormState(categoryFromQuery));
      setLoaded(true);
    }
  }, [categories, isNew, loaded, searchParams]);

  useEffect(() => {
    if (isNew || loaded) return;
    db.prompts.get(Number(id)).then((prompt) => {
      if (prompt) setForm(buildFormStateFromPrompt(prompt, availableContextMenus));
      setLoaded(true);
    });
  }, [availableContextMenus, id, isNew, loaded]);

  useEffect(() => {
    if (!loaded || availableContextMenus.length === 0) {
      return;
    }

    setForm((current) => {
      let nextState = current;

      // If a draft was applied, its selectedMenuIds take precedence — do not
      // overwrite them with the inference from menu_ids.
      const skipInference = draftAppliedRef.current;

      if (!skipInference && current.selectedMenuIds.length === 0 && (current.template.menu_ids || []).length > 0) {
        const inferredSelectedMenuIds = availableContextMenus
          .filter(
            (menu): menu is ContextMenu & { id: number } =>
              typeof menu.id === 'number' && (current.template.menu_ids || []).includes(menu.menuId),
          )
          .map((menu) => menu.id);

        if (inferredSelectedMenuIds.length > 0) {
          nextState = {
            ...current,
            selectedMenuIds: inferredSelectedMenuIds,
          };
        }
      }

      return syncFormMenus(nextState, availableContextMenus);
    });
  }, [availableContextMenus, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const draftKey = `template_draft_${id}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (!savedDraft) return;
    try {
      const rawDraftData = JSON.parse(savedDraft);
      const parsedDraftResult = TemplateFormStatePartialSchema.safeParse(rawDraftData);

      if (parsedDraftResult.success) {
        const draftData = parsedDraftResult.data as Partial<TemplateFormState>;
        if (draftData.template?.meta?.template_name) {
          // Mark draft as applied BEFORE calling setForm so the menu-sync
          // effect that may fire afterwards knows to preserve selectedMenuIds.
          draftAppliedRef.current = true;
          // startTransition evita o warning "setState within an effect":
          // o React adia esta atualização para depois do commit em curso,
          // quebrando a cadeia síncrona de renderizações.
          import('react').then(({ startTransition }) => {
            startTransition(() => {
              setForm((current) => ({ ...current, ...draftData }));
            });
          });
          showToast('Rascunho recuperado automaticamente!', 'info');
        }
      } else {
        console.error('Rascunho inválido detectado:', parsedDraftResult.error);
        localStorage.removeItem(draftKey);
      }
    } catch (error) {
      console.error('Erro ao recuperar rascunho:', error);
    }
  }, [id, loaded, showToast]);

  useEffect(() => {
    // Only autosave after the component has fully loaded (and the draft
    // recovery effect has had a chance to run), to avoid overwriting a
    // pre-existing draft in localStorage before we can restore it.
    if (!loaded) return;
    localStorage.setItem(`template_draft_${id}`, JSON.stringify(debouncedForm));
    const now = new Date();
    setTimeout(() => setLastSaved(now), 0);
  }, [debouncedForm, id, loaded]);

  const clearDraft = () => localStorage.removeItem(`template_draft_${id}`);

  const handleSave = useCallback(async () => {
    if (!form.template.meta.template_name.trim()) {
      showToast('Nome do template é obrigatório', 'error');
      return;
    }
    if (!form.categoryId) {
      showToast('Selecione uma categoria', 'error');
      return;
    }

    // Validar que a categoria ainda existe e não foi excluída
    const selectedCategory = await db.categories.get(form.categoryId);
    if (!selectedCategory) {
      showToast('Categoria selecionada não existe mais', 'error');
      return;
    }
    if (selectedCategory.isDeleted === true) {
      showToast('Categoria selecionada foi excluída. Selecione outra categoria.', 'error');
      return;
    }

    let template: TemplatePayload;
    let selection: UserSelection;
    let compiledPayload: CompiledPromptPayload;
    let migrationWarnings: string[];

    try {
      ({ template, selection, compiledPayload, migrationWarnings } = buildPersistedArtifacts(form, availableContextMenus, fixedMemory));
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Template inválido';
      showToast(errorMessage, 'error');
      return;
    }

    const summary = getPromptSummaryFields(template);
    const now = new Date();
    const promptRecord: Omit<Prompt, 'id'> = {
      categoryId: form.categoryId,
      title: summary.title,
      selectedMenuIds: form.selectedMenuIds,
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

    let localId: number | null;
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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Erro ao salvar localmente';
      console.error('Erro ao salvar localmente:', e);
      showToast(errorMessage, 'error');
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
  }, [availableContextMenus, clearDraft, fixedMemory, form, id, isNew, navigate, showToast]);

  // Shortcut handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (cmdKey && e.key === 'p') {
        e.preventDefault();
        setShowPreview(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const previewState = useMemo(() => {
    try {
      const artifacts = buildPersistedArtifacts(debouncedForm, availableContextMenus, fixedMemory);
      return {
        payload: artifacts.compiledPayload,
        template: artifacts.template,
        selection: artifacts.selection,
        renderedPrompt: artifacts.renderedPrompt,
        error: null,
      };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Payload inválido';
      return { payload: null, template: null, selection: null, renderedPrompt: '', error: errorMessage };
    }
  }, [availableContextMenus, debouncedForm, fixedMemory]);

  useAccessibleModal({ isOpen: showPreview, onClose: () => setShowPreview(false), containerRef: previewModalRef });

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
    updateTemplate((current) => {
      const nextDefinition = { ...current.prompt_definition, [field]: value };
      // Strip incomplete few-shot entries so Zod's min(1) constraint doesn't
      // fire while the user is actively typing into a newly-added row.
      return TemplatePayloadSchema.parse({
        ...current,
        prompt_definition: nextDefinition,
      });
    });
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

  const handleSaveMemory = (key: string, value: string) => {
    // Atualiza estado local imediatamente para fluidez
    setFixedMemory((prev) => ({ ...prev, [key]: value }));
  };

  const handleDeleteMemory = async (key: string) => {
    try {
      await deleteMemory(form.template.meta.template_id, key);
      setFixedMemory((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      showToast('Chave de memória removida', 'success');
    } catch (error) {
      if (!isUnauthenticatedCloudError(error)) {
        showToast('Erro ao remover chave de memória', 'error');
      }
    }
  };

  const handleAddMemoryKey = (key: string) => {
    if (fixedMemory[key] !== undefined) {
      showToast('Esta chave já existe', 'info');
      return;
    }
    // Adiciona ao estado local, o autosave cuidará do resto assim que houver valor
    // ou podemos salvar imediatamente como vazio se quisermos persistir a existência da chave
    setFixedMemory((prev) => ({ ...prev, [key]: '' }));
  };

  const handleCopy = async () => {
    if (!previewState.payload || previewState.error) {
      showToast(previewState.error || 'Payload inválido', 'error');
      return;
    }
    
    // Use structured markdown format
    const templatePayload = previewState.template as TemplatePayload | null;
    const markdownPrompt = templatePayload && previewState.payload
      ? formatPromptAsMarkdown(templatePayload, previewState.payload)
      : previewState.renderedPrompt;
    
    const ok = await copyToClipboard(markdownPrompt);
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

  const handleSelectedMenuIdsChange = (menuIds: number[]) => {
    setForm((current) => {
      const uniqueSelectedIds = Array.from(new Set(menuIds));

      return syncFormMenus(
        {
          ...current,
          selectedMenuIds: uniqueSelectedIds,
        },
        availableContextMenus,
      );
    });
  };

  if (!loaded) return null;

  return (
    <>
      <SEO
        title={isNew ? 'Novo Template' : (form.template.meta.template_name || 'Editar Template')}
        description={
          isNew
            ? 'Crie um novo template estruturado com categorias, menus vinculados e output contract.'
            : `Edite o template ${form.template.meta.template_name || 'selecionado'} com preview e playground em tempo real.`
        }
      />
      <header className="app-header">
        <div className="flex-row-center">
          <button className="btn btn--ghost btn--icon" onClick={() => navigate(-1)} aria-label="Voltar" title="Voltar">
            <ArrowLeft size={18} />
          </button>
          <h1 className="app-header__title mobile-hide">{isNew ? 'Novo Template' : 'Editar Template'}</h1>
          {!isNew && (
             <div className="app-header__title-mobile mobile-only">
                {form.template.meta.template_name || 'Editar Template'}
             </div>
          )}
        </div>
        <div className="app-header__actions mobile-hide">
          {lastSaved && (
            <span className="app-header__autosave-status" aria-live="polite">
              Rascunho salvo às {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button 
            className={`btn btn--ghost ${isFocusMode ? 'btn--active' : ''}`} 
            onClick={() => setIsFocusMode(!isFocusMode)}
            title={isFocusMode ? "Sair do modo foco" : "Modo foco"}
          >
            <Eye size={16} /> {isFocusMode ? 'Ver Tudo' : 'Foco'}
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
        <div className="mobile-only flex-row-center editor-mobile-actions">
             <button 
                className={`btn btn--ghost btn--icon ${isFocusMode ? 'btn--active' : ''}`} 
                onClick={() => setIsFocusMode(!isFocusMode)} 
                aria-label="Modo Foco"
                data-tooltip="Modo Foco"
             >
                <Eye size={20} />
             </button>
             <button 
                className="btn btn--ghost btn--icon" 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                aria-label="Playground"
                data-tooltip="Playground"
             >
                <Settings2 size={20} />
             </button>
        </div>
      </header>

      <div className={`editor-sidebar-container ${isSidebarOpen ? 'editor-sidebar-container--split' : ''}`}>
        <div className={`editor-main-scrollable ${isSidebarOpen ? 'editor-main-scrollable--with-sidebar' : ''}`}>
          <div className="app-content">
            <div className="editor-form--constrained">
              {/* A11y Audit Fix #09: Breadcrumbs */}
              <Breadcrumb
                items={[
                  { label: 'Início', href: '/' },
                  ...(form.categoryId
                    ? [{ label: categories.find((c) => c.id === form.categoryId)?.name ?? 'Categoria', href: `/categoria/${form.categoryId}` }]
                    : []),
                  { label: isNew ? 'Novo Template' : (form.template.meta.template_name || 'Editar Template') },
                ]}
              />
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
                selectedMenuIds={form.selectedMenuIds}
                onMenuSelectionChange={handleSelectedMenuIdsChange}
                availableContextMenus={availableContextMenus}
              />

              <div className="editor-footer editor-footer--spaced mobile-hide">
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

        <aside
          id="editor-playground-panel"
          className={`editor-floating-sidebar ${isSidebarOpen ? 'editor-floating-sidebar--open' : ''}`}
          aria-hidden={!isSidebarOpen}
        >
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
              freeInputs={form.freeInputs}
              fixedMemory={fixedMemory}
              isMemoryLoading={isMemoryLoading}
              isSavingMemory={isSavingMemory}
              onSaveMemory={handleSaveMemory}
              onDeleteMemory={handleDeleteMemory}
              onAddMemoryKey={handleAddMemoryKey}
              renderedPrompt={previewState.renderedPrompt}
              outputError={previewState.error}
              contextMenus={availableContextMenus}
              selectedMenuIds={form.selectedMenuIds}
              onAddFreeInput={addFreeInput}
              onRemoveFreeInput={removeFreeInput}
              onUpdateFreeInput={updateFreeInput}
              onToggleOption={toggleOptionSelection}
              onToggleSubOption={toggleSubOptionSelection}
            />
          </div>
        </aside>

        <button
          className={`editor-floating-toggle mobile-hide ${isSidebarOpen ? 'editor-floating-toggle--active' : ''}`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Alternar Playground"
          aria-expanded={isSidebarOpen}
          aria-controls="editor-playground-panel"
        >
          {isSidebarOpen ? <PanelRightClose size={24} /> : <PanelRightOpen size={24} />}
        </button>
      </div>

      <div className="sticky-mobile-bar mobile-only">
        <button className="btn btn--secondary" onClick={() => setShowPreview(true)} aria-label="Preview" data-tooltip="Preview">
          <Eye size={20} />
        </button>
        <button className="btn btn--secondary" onClick={handleCopy} aria-label="Copiar" data-tooltip="Copiar">
          <Copy size={20} />
        </button>
        <button className="btn btn--primary editor-mobile-save" onClick={handleSave} data-tooltip="Salvar Template">
          <Save size={20} /> Salvar
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
