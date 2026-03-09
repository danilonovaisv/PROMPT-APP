import { useEffect, useState } from 'react';
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
    ListChecks,
    Plus,
    Save,
    ShieldOff,
    Target,
    Trash2,
    X,
    Zap,
} from 'lucide-react';

import { db } from '@/db/database';
import { useToast } from '@/context/ToastContext';
import { useDebounce } from '@/hooks/useDebounce';
import {
    MenuDefinitionSchema,
    PROMPT_OUTPUT_FORMATS,
    PromptContractSchema,
    createEmptyPromptPayload,
    getPrimaryReferenceUrl,
    getPromptSummaryFields,
    sanitizeSelectedOptions,
    type MenuDefinition,
    type PromptOutputContract,
    type SelectedOption,
} from '@/models/promptSchema';
import type { Category, ContextMenu, FewShotExample, Prompt } from '@/models/types';
import { savePromptToSupabase } from '@/services/supabasePrompts';
import { saveLocalBackup } from '@/utils/backupManager';
import { copyToClipboard, downloadPrompt } from '@/utils/exportJson';
import { normalizeFewShotExamples } from '@/utils/normalizeFewShot';

type PromptFormState = {
    categoryId: number;
    title: string;
    roleDescription: string;
    objectiveTask: string;
    projectContext: string;
    selectedOptions: SelectedOption[];
    policiesMust: string[];
    policiesMustNot: string[];
    outputContract: PromptOutputContract;
    referenceUrl: string;
    fewShotExamples: FewShotExample[];
};

function contextMenuToDefinition(menu: ContextMenu): MenuDefinition {
    return MenuDefinitionSchema.parse({
        id: menu.menuId,
        label: menu.menuName,
        description: menu.description,
        selection_mode: menu.selectionMode,
        options: (menu.options || []).map((option) => ({
            value: option.value,
            label: option.label,
            sub_options: (option.subOptions || []).map((subOption) => ({
                value: subOption.value,
                label: subOption.label,
            })),
        })),
    });
}

function createEmptyFormState(categoryId = 0): PromptFormState {
    const payload = createEmptyPromptPayload();
    return {
        categoryId,
        title: payload.meta.name,
        roleDescription: payload.role.description,
        objectiveTask: payload.objective.task,
        projectContext: payload.project.context,
        selectedOptions: payload.selected_options,
        policiesMust: [''],
        policiesMustNot: [''],
        outputContract: payload.output_contract,
        referenceUrl: '',
        fewShotExamples: [],
    };
}

function buildFormStateFromPrompt(prompt: Prompt): PromptFormState {
    const payload = prompt.promptPayload;
    return {
        categoryId: prompt.categoryId,
        title: payload.meta.name,
        roleDescription: payload.role.description,
        objectiveTask: payload.objective.task,
        projectContext: payload.project.context,
        selectedOptions: payload.selected_options,
        policiesMust: payload.policies.must.length > 0 ? payload.policies.must : [''],
        policiesMustNot: payload.policies.must_not.length > 0 ? payload.policies.must_not : [''],
        outputContract: payload.output_contract,
        referenceUrl: getPrimaryReferenceUrl(payload) || '',
        fewShotExamples: prompt.fewShotExamples || [],
    };
}

function buildPromptPayload(form: PromptFormState, menuDefinitions: MenuDefinition[]) {
    const basePayload = createEmptyPromptPayload(form.title);
    const selectedOptions = sanitizeSelectedOptions(form.selectedOptions, menuDefinitions);
    const safeTitle = form.title.trim() || basePayload.meta.name;
    const referenceUrls = (() => {
        const rawValue = form.referenceUrl.trim();
        if (!rawValue) {
            return [];
        }

        const parsed = new URL(rawValue);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Use apenas URLs http ou https');
        }

        return [rawValue];
    })();

    return PromptContractSchema.parse({
        ...basePayload,
        meta: {
            ...basePayload.meta,
            name: safeTitle,
            prompt_id: basePayload.meta.prompt_id,
        },
        role: {
            id: form.roleDescription.trim()
                ? form.roleDescription
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '_')
                      .replace(/^_+|_+$/g, '')
                : 'custom_role',
            description: form.roleDescription.trim(),
        },
        objective: {
            ...basePayload.objective,
            task: form.objectiveTask.trim(),
        },
        project: {
            ...basePayload.project,
            context: form.projectContext.trim(),
            reference_urls: referenceUrls,
        },
        selected_options: selectedOptions,
        policies: {
            must: form.policiesMust.map((item) => item.trim()).filter(Boolean),
            must_not: form.policiesMustNot.map((item) => item.trim()).filter(Boolean),
        },
        output_contract: {
            ...form.outputContract,
            required_sections: form.outputContract.required_sections.map((item) => item.trim()).filter(Boolean),
            route_audit_order: form.outputContract.route_audit_order.map((item) => item.trim()).filter(Boolean),
            ordered_evaluation_blocks: form.outputContract.ordered_evaluation_blocks.map((item) => item.trim()).filter(Boolean),
            acceptance_criteria: form.outputContract.acceptance_criteria.map((item) => item.trim()).filter(Boolean),
            status_enum: form.outputContract.status_enum.map((item) => item.trim()).filter(Boolean),
            severity_enum: form.outputContract.severity_enum.map((item) => item.trim()).filter(Boolean),
            structure_notes: form.outputContract.structure_notes.trim(),
        },
    });
}

function updateListItem(list: string[], index: number, value: string) {
    const next = [...list];
    next[index] = value;
    return next;
}

function removeListItem(list: string[], index: number) {
    const next = list.filter((_, currentIndex) => currentIndex !== index);
    return next.length > 0 ? next : [''];
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
    const [form, setForm] = useState<PromptFormState>(createEmptyFormState());

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
            setForm(createEmptyFormState(categoryFromQuery));
            setLoaded(true);
        }
    }, [categories, isNew, loaded, searchParams]);

    useEffect(() => {
        if (isNew) {
            return;
        }

        db.prompts.get(Number(id)).then((prompt) => {
            if (prompt) {
                setForm(buildFormStateFromPrompt(prompt));
            }
            setLoaded(true);
        });
    }, [id, isNew]);

    useEffect(() => {
        if (!loaded) {
            return;
        }

        const draftKey = `prompt_draft_${id}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (!savedDraft) {
            return;
        }

        try {
            const draftData = JSON.parse(savedDraft) as Partial<PromptFormState>;
            if (draftData.title || draftData.objectiveTask || draftData.roleDescription) {
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
        if (!loaded) {
            return;
        }

        localStorage.setItem(`prompt_draft_${id}`, JSON.stringify(debouncedForm));
    }, [debouncedForm, id, loaded]);

    const menuDefinitions = contextMenus.map(contextMenuToDefinition);

    const updateField = <K extends keyof PromptFormState>(field: K, value: PromptFormState[K]) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const updateOutputContract = <K extends keyof PromptOutputContract>(
        field: K,
        value: PromptOutputContract[K]
    ) => {
        setForm((current) => ({
            ...current,
            outputContract: {
                ...current.outputContract,
                [field]: value,
            },
        }));
    };

    const selectionsForGroup = (groupId: string) =>
        form.selectedOptions.filter((selection) => selection.group === groupId);

    const optionSelection = (groupId: string, optionValue: string) =>
        form.selectedOptions.find(
            (selection) => selection.group === groupId && selection.option === optionValue
        );

    const toggleMenuOption = (menu: ContextMenu, optionValue: string) => {
        setForm((current) => {
            const existing = current.selectedOptions.find(
                (selection) => selection.group === menu.menuId && selection.option === optionValue
            );

            if (menu.selectionMode === 'single') {
                if (existing) {
                    return {
                        ...current,
                        selectedOptions: current.selectedOptions.filter(
                            (selection) => selection.group !== menu.menuId
                        ),
                    };
                }

                return {
                    ...current,
                    selectedOptions: [
                        ...current.selectedOptions.filter((selection) => selection.group !== menu.menuId),
                        { group: menu.menuId, option: optionValue, sub_options: [] },
                    ],
                };
            }

            if (existing) {
                return {
                    ...current,
                    selectedOptions: current.selectedOptions.filter(
                        (selection) =>
                            !(selection.group === menu.menuId && selection.option === optionValue)
                    ),
                };
            }

            return {
                ...current,
                selectedOptions: [
                    ...current.selectedOptions,
                    { group: menu.menuId, option: optionValue, sub_options: [] },
                ],
            };
        });
    };

    const toggleSubOption = (groupId: string, optionValue: string, subOptionValue: string) => {
        setForm((current) => ({
            ...current,
            selectedOptions: current.selectedOptions.map((selection) => {
                if (selection.group !== groupId || selection.option !== optionValue) {
                    return selection;
                }

                const hasSubOption = selection.sub_options.includes(subOptionValue);
                return {
                    ...selection,
                    sub_options: hasSubOption
                        ? selection.sub_options.filter((item) => item !== subOptionValue)
                        : [...selection.sub_options, subOptionValue],
                };
            }),
        }));
    };

    const clearDraft = () => {
        localStorage.removeItem(`prompt_draft_${id}`);
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            showToast('Título é obrigatório', 'error');
            return;
        }

        if (!form.categoryId) {
            showToast('Selecione uma categoria', 'error');
            return;
        }

        let promptPayload;
        try {
            promptPayload = buildPromptPayload(form, menuDefinitions);
        } catch (error: any) {
            showToast(error.message || 'Payload inválido', 'error');
            return;
        }

        const summary = getPromptSummaryFields(promptPayload);
        const now = new Date();
        const promptRecord: Omit<Prompt, 'id'> = {
            categoryId: form.categoryId,
            title: summary.title,
            promptPayload,
            schemaVersion: summary.schemaVersion,
            language: summary.language,
            outputFormat: summary.outputFormat,
            referenceUrl: getPrimaryReferenceUrl(promptPayload),
            fewShotExamples: normalizeFewShotExamples(form.fewShotExamples),
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

            showToast(isNew ? 'Prompt criado e sincronizado!' : 'Prompt atualizado e sincronizado!', 'success');
        } catch (error) {
            console.error('Erro ao salvar no Supabase:', error);
            showToast('Prompt salvo localmente. Sincronize ao fazer login.', 'info');
        }
    };

    const previewState = (() => {
        try {
            return {
                payload: buildPromptPayload(form, menuDefinitions),
                error: null,
            };
        } catch (error: any) {
            return {
                payload: null,
                error: error.message || 'Payload inválido',
            };
        }
    })();

    const handleCopy = async () => {
        if (!previewState.payload) {
            showToast(previewState.error || 'Payload inválido', 'error');
            return;
        }

        const ok = await copyToClipboard(JSON.stringify(previewState.payload, null, 2));
        showToast(ok ? 'JSON copiado!' : 'Erro ao copiar', ok ? 'success' : 'error');
    };

    const handleDownload = () => {
        if (!previewState.payload) {
            showToast(previewState.error || 'Payload inválido', 'error');
            return;
        }

        const summary = getPromptSummaryFields(previewState.payload);
        downloadPrompt({
            categoryId: form.categoryId,
            title: summary.title,
            promptPayload: previewState.payload,
            schemaVersion: summary.schemaVersion,
            language: summary.language,
            outputFormat: summary.outputFormat,
            referenceUrl: getPrimaryReferenceUrl(previewState.payload),
            fewShotExamples: form.fewShotExamples,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
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
                    <h1 className="app-header__title">{isNew ? 'Novo Prompt' : 'Editar Prompt'}</h1>
                </div>
                <div className="app-header__actions">
                    <button className="btn btn--ghost" onClick={() => setShowPreview(true)}>
                        <Eye size={16} /> Preview JSON
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
                            <FileText size={18} /> Informações Básicas
                        </h3>

                        <div className="form-group">
                            <label className="form-label" htmlFor="prompt-title">Título do Prompt</label>
                            <input
                                id="prompt-title"
                                value={form.title}
                                onChange={(event) => updateField('title', event.target.value)}
                                placeholder="Ex: Auditoria do Prompt App"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="editor-category">Categoria</label>
                            <select
                                id="editor-category"
                                value={form.categoryId}
                                onChange={(event) => updateField('categoryId', Number(event.target.value))}
                            >
                                <option value={0}>Selecione uma categoria</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.icon} {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="form-section__title">
                            <Zap size={18} /> Role
                        </h3>
                        <div className="form-group">
                            <label className="form-label" htmlFor="prompt-role">
                                Descrição do papel do agente
                            </label>
                            <textarea
                                id="prompt-role"
                                value={form.roleDescription}
                                onChange={(event) => updateField('roleDescription', event.target.value)}
                                rows={4}
                                placeholder="Você é um engenheiro sênior focado em..."
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="form-section__title">
                            <Target size={18} /> Objective
                        </h3>
                        <div className="form-group">
                            <label className="form-label" htmlFor="prompt-task">Tarefa principal</label>
                            <textarea
                                id="prompt-task"
                                value={form.objectiveTask}
                                onChange={(event) => updateField('objectiveTask', event.target.value)}
                                rows={4}
                                placeholder="Descreva exatamente o que o modelo deve executar."
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="form-section__title">
                            <FileText size={18} /> Project Context
                        </h3>
                        <div className="form-group">
                            <label className="form-label" htmlFor="prompt-context">Contexto do projeto</label>
                            <textarea
                                id="prompt-context"
                                value={form.projectContext}
                                onChange={(event) => updateField('projectContext', event.target.value)}
                                rows={4}
                                placeholder="Explique o cenário, o produto e o contexto necessário para a execução."
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="reference-url">URL de referência</label>
                            <input
                                id="reference-url"
                                value={form.referenceUrl}
                                onChange={(event) => updateField('referenceUrl', event.target.value)}
                                placeholder="https://prompt-app-dan.netlify.app"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="form-section__title">
                            <Layers size={18} /> Menus de Contexto
                        </h3>

                        {contextMenus.length === 0 ? (
                            <p className="ctx-empty-hint">
                                Nenhum menu de contexto configurado.
                                <button className="btn btn--ghost btn--sm" onClick={() => navigate('/menus')}>
                                    Criar menus
                                </button>
                            </p>
                        ) : (
                            <div className="ctx-editor-grid">
                                {contextMenus.map((menu) => (
                                    <div key={menu.id} className="ctx-editor-menu">
                                        <div className="ctx-editor-menu__header">
                                            <span className="ctx-editor-menu__name">{menu.menuName}</span>
                                            <span className="ctx-editor-menu__selection">
                                                {menu.selectionMode === 'multiple' ? 'Múltipla' : 'Única'}
                                            </span>
                                        </div>
                                        {menu.description && (
                                            <p className="form-label__hint">{menu.description}</p>
                                        )}
                                        <div className="menu-selector">
                                            {menu.options.map((option) => {
                                                const selection = optionSelection(menu.menuId, option.value);
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        className={`menu-tag ${selection ? 'menu-tag--selected' : ''}`}
                                                        onClick={() => toggleMenuOption(menu, option.value)}
                                                    >
                                                        {option.label}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {selectionsForGroup(menu.menuId).map((selection) => {
                                            const optionDefinition = menu.options.find(
                                                (option) => option.value === selection.option
                                            );

                                            if (!optionDefinition || optionDefinition.subOptions.length === 0) {
                                                return null;
                                            }

                                            return (
                                                <div key={`${selection.group}-${selection.option}`} className="ctx-editor-suboptions">
                                                    <span className="ctx-editor-suboptions__label">
                                                        Sub-opções de "{optionDefinition.label}"
                                                    </span>
                                                    <div className="menu-selector menu-selector--sub">
                                                        {optionDefinition.subOptions.map((subOption) => (
                                                            <button
                                                                key={subOption.value}
                                                                type="button"
                                                                className={`menu-tag menu-tag--sub ${
                                                                    selection.sub_options.includes(subOption.value)
                                                                        ? 'menu-tag--selected'
                                                                        : ''
                                                                }`}
                                                                onClick={() =>
                                                                    toggleSubOption(
                                                                        selection.group,
                                                                        selection.option,
                                                                        subOption.value
                                                                    )
                                                                }
                                                            >
                                                                {subOption.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-section">
                        <h3 className="form-section__title">
                            <ListChecks size={18} /> Policies Must
                        </h3>
                        <div className="dynamic-list">
                            {form.policiesMust.map((item, index) => (
                                <div key={`must-${index}`} className="dynamic-list__item">
                                    <input
                                        value={item}
                                        onChange={(event) =>
                                            updateField('policiesMust', updateListItem(form.policiesMust, index, event.target.value))
                                        }
                                        placeholder={`Obrigação ${index + 1}`}
                                    />
                                    <button
                                        className="btn btn--ghost btn--icon"
                                        onClick={() =>
                                            updateField('policiesMust', removeListItem(form.policiesMust, index))
                                        }
                                        aria-label="Remover regra obrigatória"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                className="btn btn--ghost btn--sm dynamic-list__add"
                                onClick={() => updateField('policiesMust', [...form.policiesMust, ''])}
                            >
                                <Plus size={14} /> Adicionar regra
                            </button>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="form-section__title">
                            <ShieldOff size={18} /> Policies Must Not
                        </h3>
                        <div className="dynamic-list">
                            {form.policiesMustNot.map((item, index) => (
                                <div key={`must-not-${index}`} className="dynamic-list__item">
                                    <input
                                        value={item}
                                        onChange={(event) =>
                                            updateField(
                                                'policiesMustNot',
                                                updateListItem(form.policiesMustNot, index, event.target.value)
                                            )
                                        }
                                        placeholder={`Proibição ${index + 1}`}
                                    />
                                    <button
                                        className="btn btn--ghost btn--icon"
                                        onClick={() =>
                                            updateField(
                                                'policiesMustNot',
                                                removeListItem(form.policiesMustNot, index)
                                            )
                                        }
                                        aria-label="Remover regra proibida"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                className="btn btn--ghost btn--sm dynamic-list__add"
                                onClick={() => updateField('policiesMustNot', [...form.policiesMustNot, ''])}
                            >
                                <Plus size={14} /> Adicionar proibição
                            </button>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3 className="form-section__title">
                            <CheckSquare size={18} /> Output Contract
                        </h3>

                        <div className="form-group">
                            <label className="form-label" htmlFor="output-format">Formato</label>
                            <select
                                id="output-format"
                                value={form.outputContract.format}
                                onChange={(event) =>
                                    updateOutputContract(
                                        'format',
                                        event.target.value as PromptOutputContract['format']
                                    )
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
                            <label className="form-label" htmlFor="output-language">Idioma de resposta</label>
                            <input
                                id="output-language"
                                value={form.outputContract.language}
                                onChange={(event) => updateOutputContract('language', event.target.value)}
                                placeholder="pt-BR"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="output-structure-notes">
                                Notas de estrutura
                            </label>
                            <textarea
                                id="output-structure-notes"
                                value={form.outputContract.structure_notes}
                                onChange={(event) => updateOutputContract('structure_notes', event.target.value)}
                                rows={3}
                                placeholder="Explique a estrutura desejada da resposta."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <input
                                    type="checkbox"
                                    checked={form.outputContract.strict_mode}
                                    onChange={(event) => updateOutputContract('strict_mode', event.target.checked)}
                                />
                                {' '}Strict mode
                            </label>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <input
                                    type="checkbox"
                                    checked={form.outputContract.require_evidence_for_claims}
                                    onChange={(event) =>
                                        updateOutputContract('require_evidence_for_claims', event.target.checked)
                                    }
                                />
                                {' '}Exigir evidências para claims
                            </label>
                        </div>

                        {[
                            ['required_sections', 'Seções obrigatórias'],
                            ['route_audit_order', 'Ordem de auditoria'],
                            ['ordered_evaluation_blocks', 'Blocos de avaliação'],
                            ['acceptance_criteria', 'Critérios de aceite'],
                            ['status_enum', 'Status permitidos'],
                            ['severity_enum', 'Severidades permitidas'],
                        ].map(([field, label]) => {
                            const listField = field as keyof Pick<
                                PromptOutputContract,
                                | 'required_sections'
                                | 'route_audit_order'
                                | 'ordered_evaluation_blocks'
                                | 'acceptance_criteria'
                                | 'status_enum'
                                | 'severity_enum'
                            >;
                            const currentList = form.outputContract[listField];

                            return (
                                <div key={field} className="form-group">
                                    <label className="form-label">{label}</label>
                                    <div className="dynamic-list">
                                        {currentList.map((item, index) => (
                                            <div key={`${field}-${index}`} className="dynamic-list__item">
                                                <input
                                                    value={item}
                                                    onChange={(event) =>
                                                        updateOutputContract(
                                                            listField,
                                                            updateListItem(currentList, index, event.target.value)
                                                        )
                                                    }
                                                    placeholder={`${label} ${index + 1}`}
                                                />
                                                <button
                                                    className="btn btn--ghost btn--icon"
                                                    onClick={() =>
                                                        updateOutputContract(
                                                            listField,
                                                            removeListItem(currentList, index)
                                                        )
                                                    }
                                                    aria-label={`Remover ${label}`}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            className="btn btn--ghost btn--sm dynamic-list__add"
                                            onClick={() =>
                                                updateOutputContract(listField, [...currentList, ''])
                                            }
                                        >
                                            <Plus size={14} /> Adicionar item
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="editor-footer">
                        <button className="btn btn--secondary btn--lg" onClick={() => navigate(-1)}>
                            Cancelar
                        </button>
                        <button className="btn btn--primary btn--lg" onClick={handleSave}>
                            <Save size={18} /> Salvar Prompt
                        </button>
                    </div>
                </div>
            </div>

            {showPreview && (
                <div className="modal-overlay" onClick={() => setShowPreview(false)}>
                    <div className="modal" onClick={(event) => event.stopPropagation()}>
                        <div className="modal__header">
                            <h2>Preview JSON</h2>
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
