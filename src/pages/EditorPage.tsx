/* ======================================================
   Editor de Prompt — formulário completo
   ====================================================== */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useToast } from '@/context/ToastContext';
import { toExportFormat, copyToClipboard, downloadPrompt } from '@/utils/exportJson';
import type { Prompt, MenuSelections, FewShotExample, OutputSchema, MenuKey } from '@/models/types';
import { MENU_LABELS } from '@/models/types';
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
    Settings,
} from 'lucide-react';

const EMPTY_PROMPT: Omit<Prompt, 'id'> = {
    categoryId: 0,
    title: '',
    systemRole: '',
    task: '',
    context: '',
    menus: { tom: '', publico: '', idioma: '', estilo: '' },
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
    const menuOptions = useLiveQuery(() => db.menuOptions.toArray()) ?? [];

    const [form, setForm] = useState<Omit<Prompt, 'id'>>(EMPTY_PROMPT);
    const [showPreview, setShowPreview] = useState(false);
    const [loaded, setLoaded] = useState(false);

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
                        constraints: p.constraints.length > 0 ? p.constraints : [''],
                        negativePrompt: p.negativePrompt.length > 0 ? p.negativePrompt : [''],
                        fewShotExamples: p.fewShotExamples.length > 0 ? p.fewShotExamples : [{ input: '', output: '' }],
                    });
                }
                setLoaded(true);
            });
        }
    }, [id, isNew, searchParams, categories]);

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

    const updateMenu = (key: MenuKey, value: string) => {
        setForm((prev) => ({
            ...prev,
            menus: { ...prev.menus, [key]: value } as MenuSelections,
        }));
    };

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
            showToast('Prompt criado com sucesso!');
            navigate(`/editor/${newId}`, { replace: true });
        } else {
            await db.prompts.update(Number(id), data);
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

    /* Agrupar menu options por chave */
    const optionsByKey = (key: MenuKey) => menuOptions.filter((o) => o.menuKey === key);

    if (!loaded) return null;

    const previewJson = JSON.stringify(toExportFormat(form as Prompt), null, 2);

    return (
        <>
            <header className="app-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <button className="btn btn--ghost btn--icon" onClick={() => navigate(-1)}>
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
                <div style={{ maxWidth: '800px' }}>
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
                            <label className="form-label">Categoria</label>
                            <select
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

                    {/* --- Menus Pré-configurados --- */}
                    <div className="form-section">
                        <h3 className="form-section__title">
                            <Settings size={18} /> Contextos Pré-configurados
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                            {(['tom', 'publico', 'idioma', 'estilo'] as MenuKey[]).map((key) => (
                                <div key={key} className="form-group">
                                    <label className="form-label">{MENU_LABELS[key]}</label>
                                    <div className="menu-selector">
                                        {optionsByKey(key).map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                className={`menu-tag ${form.menus[key] === opt.value ? 'menu-tag--selected' : ''}`}
                                                onClick={() =>
                                                    updateMenu(key, form.menus[key] === opt.value ? '' : opt.value)
                                                }
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
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
                            <label className="form-label">Formato</label>
                            <select
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

                        <div className="dynamic-list" style={{ gap: 'var(--space-4)' }}>
                            {form.fewShotExamples.map((ex, i) => (
                                <div
                                    key={i}
                                    style={{
                                        background: 'var(--color-surface-2)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: 'var(--space-4)',
                                        border: '1px solid var(--color-border)',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: 'var(--space-3)',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 'var(--font-size-xs)',
                                                fontWeight: 'var(--font-weight-semibold)',
                                                color: 'var(--color-text-muted)',
                                            }}
                                        >
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
                                    <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                                        <label className="form-label">Input</label>
                                        <textarea
                                            value={ex.input}
                                            onChange={(e) => updateExample(i, 'input', e.target.value)}
                                            placeholder="Entrada de exemplo..."
                                            rows={2}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
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
                    <div
                        style={{
                            display: 'flex',
                            gap: 'var(--space-3)',
                            justifyContent: 'flex-end',
                            paddingTop: 'var(--space-6)',
                            borderTop: '1px solid var(--color-border)',
                            marginTop: 'var(--space-8)',
                        }}
                    >
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
