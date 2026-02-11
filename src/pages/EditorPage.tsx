/* ======================================================
   Editor de Prompt — formulário completo (v2 com menus hierárquicos)
   ====================================================== */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useToast } from '@/context/ToastContext';
import { toExportFormat, copyToClipboard, downloadPrompt } from '@/utils/exportJson';
import { saveLocalBackup } from '@/utils/backupManager';
import type { Prompt, FewShotExample, OutputSchema, MenuSelectionsMap, ContextMenuSelection } from '@/models/types';
import {
    ArrowLeft,
    Save,
    Copy,
    Download,
    Eye,
    Plus,
    Trash2,
    X,
    Zap,
    MessageSquare,
    Target,
    FileText,
    ShieldOff,
    ListChecks,
    BookOpen,
    Layers,
    ChevronDown,
    PlusCircle,
} from 'lucide-react';

const EMPTY_PROMPT: Omit<Prompt, 'id'> = {
    categoryId: 0,
    title: '',
    systemRole: '',
    task: '',
    context: '',
    menus: { tom: '', publico: '', idioma: '', estilo: '' },
    contextMenus: {},
    enabledMenuIds: [],
    constraints: [''],
    negativePrompt: [''],
    outputSchema: { formato: 'texto', estrutura: '' },
    fewShotExamples: [{ input: '', output: '' }],
    createdAt: new Date(),
    updatedAt: new Date(),
};

export default function EditorPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const isNew = id === 'novo';

    const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
    const contextMenus = useLiveQuery(() => db.contextMenus.toArray()) ?? [];

    const [form, setForm] = useState<Omit<Prompt, 'id'>>(EMPTY_PROMPT);
    const [showPreview, setShowPreview] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [showMenuPicker, setShowMenuPicker] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

    /* Carregar prompt existente */
    useEffect(() => {
        if (isNew) {
            const catId = searchParams.get('categoria');
            setForm({
                ...EMPTY_PROMPT,
                categoryId: catId ? Number(catId) : categories[0]?.id ?? 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            setLoaded(true);
        } else {
            db.prompts.get(Number(id)).then((p) => {
                if (p) {
                    setForm({
                        ...p,
                        contextMenus: p.contextMenus || {},
                        enabledMenuIds: p.enabledMenuIds || [],
                        constraints: p.constraints.length > 0 ? p.constraints : [''],
                        negativePrompt: p.negativePrompt.length > 0 ? p.negativePrompt : [''],
                        fewShotExamples: p.fewShotExamples.length > 0 ? p.fewShotExamples : [{ input: '', output: '' }],
                    });
                }
                setLoaded(true);
            });
        }
    }, [id, isNew, searchParams, categories]);

    /* --- Sistema de Rascunho (Draft) --- */
    // Carregar rascunho se existir
    useEffect(() => {
        if (loaded) {
            const draftKey = `prompt_draft_${id}`;
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                try {
                    const draftData = JSON.parse(savedDraft);
                    setForm(prev => ({ ...prev, ...draftData }));
                    showToast('Rascunho recuperado automaticamente!', 'info');
                } catch (e) {
                    console.error('Erro ao recuperar rascunho:', e);
                }
            }
        }
    }, [loaded, id]);

    // Salvar rascunho automaticamente
    useEffect(() => {
        if (loaded && form !== EMPTY_PROMPT) {
            const draftKey = `prompt_draft_${id}`;
            localStorage.setItem(draftKey, JSON.stringify(form));
        }
    }, [form, id, loaded]);

    // Limpar rascunho ao salvar com sucesso
    const clearDraft = () => {
        localStorage.removeItem(`prompt_draft_${id}`);
    };

    /* Atualizar categoryId quando categorias carregarem */
    useEffect(() => {
        if (isNew && form.categoryId === 0 && categories.length > 0) {
            const catId = searchParams.get('categoria');
            setForm((prev) => ({
                ...prev,
                categoryId: catId ? Number(catId) : categories[0]?.id ?? 0,
            }));
        }
    }, [categories, isNew, form.categoryId, searchParams]);

    /* --- Handlers de campos --- */
    const updateField = <K extends keyof Omit<Prompt, 'id'>>(key: K, value: Omit<Prompt, 'id'>[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    /* --- Menus hierárquicos (v2) --- */
    const getMenuSelection = (menuId: string): ContextMenuSelection => {
        return form.contextMenus[menuId] || { option: '', subOptions: [] };
    };

    const selectMenuOption = (menuId: string, optionValue: string) => {
        setForm((prev) => {
            const current = prev.contextMenus[menuId];
            const isDeselect = current?.option === optionValue;

            const newMenus: MenuSelectionsMap = { ...prev.contextMenus };
            if (isDeselect) {
                delete newMenus[menuId];
            } else {
                newMenus[menuId] = { option: optionValue, subOptions: [] };
            }
            return { ...prev, contextMenus: newMenus };
        });
    };

    const toggleSubOption = (menuId: string, subValue: string) => {
        setForm((prev) => {
            const current = prev.contextMenus[menuId];
            if (!current) return prev;

            const subs = current.subOptions.includes(subValue)
                ? current.subOptions.filter((s) => s !== subValue)
                : [...current.subOptions, subValue];

            return {
                ...prev,
                contextMenus: {
                    ...prev.contextMenus,
                    [menuId]: { ...current, subOptions: subs },
                },
            };
        });
    };

    const toggleMenuExpanded = (menuId: string) => {
        setExpandedMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
    };

    /* --- Menu picker: add/remove menus per prompt --- */
    const enabledMenus = contextMenus.filter((m) => form.enabledMenuIds.includes(m.menuId));
    const availableMenus = contextMenus.filter((m) => !form.enabledMenuIds.includes(m.menuId));

    const addMenuToPrompt = (menuId: string) => {
        setForm((prev) => ({
            ...prev,
            enabledMenuIds: [...prev.enabledMenuIds, menuId],
        }));
        setShowMenuPicker(false);
    };

    const removeMenuFromPrompt = (menuId: string) => {
        setForm((prev) => {
            const newContextMenus = { ...prev.contextMenus };
            delete newContextMenus[menuId];
            return {
                ...prev,
                enabledMenuIds: prev.enabledMenuIds.filter((id) => id !== menuId),
                contextMenus: newContextMenus,
            };
        });
    };

    /* --- Outros handlers --- */
    const updateConstraint = (index: number, value: string) => {
        const newList = [...form.constraints];
        newList[index] = value;
        updateField('constraints', newList);
    };

    const addConstraint = () => updateField('constraints', [...form.constraints, '']);

    const removeConstraint = (index: number) => {
        const newList = form.constraints.filter((_, i) => i !== index);
        updateField('constraints', newList.length > 0 ? newList : ['']);
    };

    const updateNegative = (index: number, value: string) => {
        const newList = [...form.negativePrompt];
        newList[index] = value;
        updateField('negativePrompt', newList);
    };

    const addNegative = () => updateField('negativePrompt', [...form.negativePrompt, '']);

    const removeNegative = (index: number) => {
        const newList = form.negativePrompt.filter((_, i) => i !== index);
        updateField('negativePrompt', newList.length > 0 ? newList : ['']);
    };

    const updateExample = (index: number, field: keyof FewShotExample, value: string) => {
        const newList = [...form.fewShotExamples];
        newList[index] = { ...newList[index], [field]: value };
        updateField('fewShotExamples', newList);
    };

    const addExample = () =>
        updateField('fewShotExamples', [...form.fewShotExamples, { input: '', output: '' }]);

    const removeExample = (index: number) => {
        const newList = form.fewShotExamples.filter((_, i) => i !== index);
        updateField('fewShotExamples', newList.length > 0 ? newList : [{ input: '', output: '' }]);
    };

    const updateOutputSchema = (field: keyof OutputSchema, value: string) => {
        setForm((prev) => ({
            ...prev,
            outputSchema: { ...prev.outputSchema, [field]: value } as OutputSchema,
        }));
    };

    /* --- Ações --- */
    const handleSave = async () => {
        if (!form.title.trim()) {
            showToast('Título é obrigatório', 'error');
            return;
        }
        if (!form.categoryId) {
            showToast('Selecione uma categoria', 'error');
            return;
        }

        const data = {
            ...form,
            constraints: form.constraints.filter(Boolean),
            negativePrompt: form.negativePrompt.filter(Boolean),
            fewShotExamples: form.fewShotExamples.filter((e) => e.input || e.output),
            updatedAt: new Date(),
        };

        if (isNew) {
            data.createdAt = new Date();
            const newId = await db.prompts.add(data as Prompt);
            clearDraft();
            await saveLocalBackup();
            showToast('Prompt criado com sucesso!');
            navigate(`/editor/${newId}`, { replace: true });
        } else {
            await db.prompts.update(Number(id), data);
            clearDraft();
            await saveLocalBackup();
            showToast('Prompt salvo!');
        }
    };

    const handleCopy = async () => {
        const exported = toExportFormat(form as Prompt);
        const json = JSON.stringify(exported, null, 2);
        const ok = await copyToClipboard(json);
        showToast(ok ? 'JSON copiado!' : 'Erro ao copiar', ok ? 'success' : 'error');
    };

    const handleDownload = () => {
        downloadPrompt(form as Prompt);
        showToast('Download iniciado!');
    };

    if (!loaded) return null;

    const previewJson = JSON.stringify(toExportFormat(form as Prompt), null, 2);

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
                    <h2 className="app-header__title">
                        {isNew ? 'Novo Prompt' : 'Editar Prompt'}
                    </h2>
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
                    {/* --- Informações Básicas --- */}
                    <div className="form-section">
                        <h3 className="form-section__title">
                            <FileText size={18} /> Informações Básicas
                        </h3>

                        <div className="form-group">
                            <label className="form-label">Título do Prompt</label>
                            <input
                                value={form.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                placeholder="Ex: Gerar artigo de blog otimizado para SEO"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="editor-category">Categoria</label>
                            <select
                                id="editor-category"
                                aria-label="Selecione a categoria"
                                value={form.categoryId}
                                onChange={(e) => updateField('categoryId', Number(e.target.value))}
                            >
                                <option value={0}>Selecione uma categoria</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* --- System Role --- */}
                    <div className="form-section">
                        <h3 className="form-section__title">
                            <Zap size={18} /> System Prompt
                            <span className="form-label__hint">(Persona do modelo)</span>
                        </h3>

                        <div className="form-group">
                            <textarea
                                value={form.systemRole}
                                onChange={(e) => updateField('systemRole', e.target.value)}
                                placeholder="Você é um especialista em copywriting com 15 anos de experiência. Seu papel é criar textos persuasivos e de alta conversão."
                                rows={4}
                            />
                        </div>
                    </div>

                    {/* --- Task --- */}
                    <div className="form-section">
                        <h3 className="form-section__title">
                            <Target size={18} /> Tarefa Principal
                        </h3>

                        <div className="form-group">
                            <textarea
                                value={form.task}
                                onChange={(e) => updateField('task', e.target.value)}
                                placeholder="Gere um artigo de blog completo com título, introdução, 3 seções principais, conclusão e CTA."
                                rows={4}
                            />
                        </div>
                    </div>

                    {/* --- Contexto --- */}
                    <div className="form-section">
                        <h3 className="form-section__title">
                            <MessageSquare size={18} /> Contexto
                        </h3>

                        <div className="form-group">
                            <textarea
                                value={form.context}
                                onChange={(e) => updateField('context', e.target.value)}
                                placeholder="O artigo é para o blog de uma startup de tecnologia educacional. O público são professores e coordenadores pedagógicos."
                                rows={4}
                            />
                        </div>
                    </div>

                    {/* --- Menus de Contexto Hierárquicos (v2) --- */}
                    <div className="form-section">
                        <h3 className="form-section__title">
                            <Layers size={18} /> Menus de Contexto
                            <span className="form-label__hint">(Adicione os menus que deseja usar neste prompt)</span>
                        </h3>

                        {contextMenus.length === 0 ? (
                            <p className="ctx-empty-hint">
                                Nenhum menu de contexto configurado.
                                <button className="btn btn--ghost btn--sm" onClick={() => navigate('/menus')}>
                                    Criar menus
                                </button>
                            </p>
                        ) : (
                            <>
                                {/* Menu Picker — adicionar menus ao prompt */}
                                <div className="ctx-picker">
                                    <div className="ctx-picker__row">
                                        <div className="ctx-picker__wrapper">
                                            <button
                                                className="btn btn--secondary btn--sm ctx-picker__trigger"
                                                onClick={() => setShowMenuPicker(!showMenuPicker)}
                                                disabled={availableMenus.length === 0}
                                                type="button"
                                            >
                                                <PlusCircle size={14} />
                                                Adicionar Menu
                                                {availableMenus.length > 0 && (
                                                    <span className="ctx-picker__count">{availableMenus.length}</span>
                                                )}
                                            </button>

                                            {showMenuPicker && availableMenus.length > 0 && (
                                                <div className="ctx-picker__dropdown">
                                                    {availableMenus.map((menu) => (
                                                        <button
                                                            key={menu.id}
                                                            className="ctx-picker__option"
                                                            onClick={() => addMenuToPrompt(menu.menuId)}
                                                            type="button"
                                                        >
                                                            <span className="ctx-picker__option-name">{menu.menuName}</span>
                                                            <span className="ctx-picker__option-desc">{menu.description}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {enabledMenus.length > 0 && (
                                            <span className="ctx-picker__summary">
                                                {enabledMenus.length} menu{enabledMenus.length !== 1 ? 's' : ''} ativo{enabledMenus.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Menus habilitados — seleção de opções */}
                                {enabledMenus.length === 0 ? (
                                    <p className="ctx-empty-hint">
                                        Nenhum menu adicionado a este prompt. Use o botão acima para adicionar.
                                    </p>
                                ) : (
                                    <div className="ctx-editor-grid">
                                        {enabledMenus.map((menu) => {
                                            const sel = getMenuSelection(menu.menuId);
                                            const selectedOpt = menu.options.find((o) => o.value === sel.option);
                                            const hasSubOptions = selectedOpt && selectedOpt.subOptions.length > 0;
                                            const isExpanded = expandedMenus[menu.menuId];

                                            return (
                                                <div key={menu.id} className="ctx-editor-menu">
                                                    <div className="ctx-editor-menu__header">
                                                        <span className="ctx-editor-menu__name">{menu.menuName}</span>
                                                        {sel.option && (
                                                            <span className="ctx-editor-menu__selection">
                                                                {selectedOpt?.label}
                                                                {sel.subOptions.length > 0 && (
                                                                    <span className="ctx-editor-menu__sub-count">
                                                                        +{sel.subOptions.length}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        )}
                                                        {hasSubOptions && (
                                                            <button
                                                                className="btn btn--ghost btn--icon btn--sm"
                                                                onClick={() => toggleMenuExpanded(menu.menuId)}
                                                                aria-label={isExpanded ? 'Recolher sub-opções' : 'Expandir sub-opções'}
                                                                title={isExpanded ? 'Recolher' : 'Expandir sub-opções'}
                                                                type="button"
                                                            >
                                                                <ChevronDown
                                                                    size={14}
                                                                    className={isExpanded ? 'ctx-chevron--open' : 'ctx-chevron'}
                                                                />
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn btn--ghost btn--icon btn--sm ctx-editor-menu__remove"
                                                            onClick={() => removeMenuFromPrompt(menu.menuId)}
                                                            aria-label={`Remover menu ${menu.menuName}`}
                                                            title="Remover deste prompt"
                                                            type="button"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>

                                                    <div className="menu-selector">
                                                        {menu.options.map((opt) => (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                className={`menu-tag ${sel.option === opt.value ? 'menu-tag--selected' : ''}`}
                                                                onClick={() => selectMenuOption(menu.menuId, opt.value)}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Sub-opções — expandível */}
                                                    {hasSubOptions && isExpanded && (
                                                        <div className="ctx-editor-suboptions">
                                                            <span className="ctx-editor-suboptions__label">
                                                                Sub-opções de "{selectedOpt.label}":
                                                            </span>
                                                            <div className="menu-selector menu-selector--sub">
                                                                {selectedOpt.subOptions.map((sub) => (
                                                                    <button
                                                                        key={sub.value}
                                                                        type="button"
                                                                        className={`menu-tag menu-tag--sub ${sel.subOptions.includes(sub.value) ? 'menu-tag--selected' : ''}`}
                                                                        onClick={() => toggleSubOption(menu.menuId, sub.value)}
                                                                    >
                                                                        {sub.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* --- Constraints --- */}
                    <div className="form-section">
                        <h3 className="form-section__title">
                            <ListChecks size={18} /> Restrições
                            <span className="form-label__hint">(O que o modelo DEVE respeitar)</span>
                        </h3>

                        <div className="dynamic-list">
                            {form.constraints.map((item, i) => (
                                <div key={i} className="dynamic-list__item">
                                    <input
                                        value={item}
                                        onChange={(e) => updateConstraint(i, e.target.value)}
                                        placeholder={`Restrição ${i + 1}...`}
                                    />
                                    <button
                                        className="btn btn--ghost btn--icon"
                                        onClick={() => removeConstraint(i)}
                                        aria-label="Remover restrição"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button className="btn btn--ghost btn--sm dynamic-list__add" onClick={addConstraint}>
                                <Plus size={14} /> Adicionar restrição
                            </button>
                        </div>
                    </div>

                    {/* --- Negative Prompt --- */}
                    <div className="form-section">
                        <h3 className="form-section__title">
                            <ShieldOff size={18} /> Negative Prompt
                            <span className="form-label__hint">(O que o modelo NÃO deve fazer)</span>
                        </h3>

                        <div className="dynamic-list">
                            {form.negativePrompt.map((item, i) => (
                                <div key={i} className="dynamic-list__item">
                                    <input
                                        value={item}
                                        onChange={(e) => updateNegative(i, e.target.value)}
                                        placeholder={`Item negativo ${i + 1}...`}
                                    />
                                    <button
                                        className="btn btn--ghost btn--icon"
                                        onClick={() => removeNegative(i)}
                                        aria-label="Remover item negativo"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button className="btn btn--ghost btn--sm dynamic-list__add" onClick={addNegative}>
                                <Plus size={14} /> Adicionar item negativo
                            </button>
                        </div>
                    </div>

                    {/* --- Output Schema --- */}
                    <div className="form-section">
                        <h3 className="form-section__title">
                            <FileText size={18} /> Schema de Saída
                        </h3>

                        <div className="form-group">
                            <label className="form-label" htmlFor="editor-formato">Formato</label>
                            <select
                                id="editor-formato"
                                aria-label="Selecione o formato de saída"
                                value={form.outputSchema.formato}
                                onChange={(e) => updateOutputSchema('formato', e.target.value)}
                            >
                                <option value="texto">Texto</option>
                                <option value="json">JSON</option>
                                <option value="markdown">Markdown</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Estrutura Esperada</label>
                            <textarea
                                value={form.outputSchema.estrutura}
                                onChange={(e) => updateOutputSchema('estrutura', e.target.value)}
                                placeholder="Descreva a estrutura esperada da saída. Ex: Título, Introdução (2 parágrafos), 3 seções com subtítulos, Conclusão, CTA."
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* --- Few-Shot Examples --- */}
                    <div className="form-section">
                        <h3 className="form-section__title">
                            <BookOpen size={18} /> Exemplos (Few-Shot)
                            <span className="form-label__hint">(Pares de entrada/saída para guiar o modelo)</span>
                        </h3>

                        <div className="dynamic-list dynamic-list--spaced">
                            {form.fewShotExamples.map((ex, i) => (
                                <div key={i} className="fewshot-card">
                                    <div className="fewshot-card__header">
                                        <span className="fewshot-card__label">
                                            Exemplo {i + 1}
                                        </span>
                                        <button
                                            className="btn btn--ghost btn--icon btn--sm"
                                            onClick={() => removeExample(i)}
                                            aria-label="Remover exemplo"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="form-group form-group--tight">
                                        <label className="form-label">Input</label>
                                        <textarea
                                            value={ex.input}
                                            onChange={(e) => updateExample(i, 'input', e.target.value)}
                                            placeholder="Entrada de exemplo..."
                                            rows={2}
                                        />
                                    </div>
                                    <div className="form-group form-group--none">
                                        <label className="form-label">Output</label>
                                        <textarea
                                            value={ex.output}
                                            onChange={(e) => updateExample(i, 'output', e.target.value)}
                                            placeholder="Saída esperada..."
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            ))}
                            <button className="btn btn--ghost btn--sm dynamic-list__add" onClick={addExample}>
                                <Plus size={14} /> Adicionar exemplo
                            </button>
                        </div>
                    </div>

                    {/* --- Ações do footer --- */}
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

            {/* --- Modal de Preview JSON --- */}
            {showPreview && (
                <div className="modal-overlay" onClick={() => setShowPreview(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
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
                            <pre className="json-preview">{previewJson}</pre>
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
