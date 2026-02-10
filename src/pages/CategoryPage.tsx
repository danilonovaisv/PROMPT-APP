/* ======================================================
   Página de Categoria — lista de prompts
   ====================================================== */

import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useToast } from '@/context/ToastContext';
import { downloadPrompt, toExportFormat, copyToClipboard } from '@/utils/exportJson';
import {
    Plus,
    ArrowLeft,
    Copy,
    Download,
    Trash2,
    Edit3,
    Clock,
} from 'lucide-react';

export default function CategoryPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const categoryId = Number(id);

    const category = useLiveQuery(
        () => db.categories.get(categoryId),
        [categoryId]
    );

    const prompts = useLiveQuery(
        () => db.prompts.where('categoryId').equals(categoryId).toArray(),
        [categoryId]
    ) ?? [];

    const handleCopy = async (promptId: number) => {
        const prompt = await db.prompts.get(promptId);
        if (!prompt) return;
        const exported = toExportFormat(prompt);
        const json = JSON.stringify(exported, null, 2);
        const ok = await copyToClipboard(json);
        showToast(ok ? 'Prompt copiado!' : 'Erro ao copiar', ok ? 'success' : 'error');
    };

    const handleDownload = async (promptId: number) => {
        const prompt = await db.prompts.get(promptId);
        if (!prompt) return;
        downloadPrompt(prompt);
        showToast('Download iniciado!');
    };

    const handleDelete = async (promptId: number) => {
        if (!confirm('Deseja realmente excluir este prompt?')) return;
        await db.prompts.delete(promptId);
        showToast('Prompt excluído!');
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    if (!category) {
        return (
            <>
                <header className="app-header">
                    <button className="btn btn--ghost" onClick={() => navigate('/')}>
                        <ArrowLeft size={16} /> Voltar
                    </button>
                </header>
                <div className="app-content">
                    <div className="empty-state">
                        <div className="empty-state__icon">🔍</div>
                        <h3 className="empty-state__title">Categoria não encontrada</h3>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <header className="app-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <button className="btn btn--ghost btn--icon" onClick={() => navigate('/')}>
                        <ArrowLeft size={18} />
                    </button>
                    <span style={{ fontSize: '1.4rem' }}>{category.icon}</span>
                    <h2 className="app-header__title" style={{ color: category.color }}>
                        {category.name}
                    </h2>
                </div>
                <div className="app-header__actions">
                    <button
                        className="btn btn--primary"
                        onClick={() => navigate(`/editor/novo?categoria=${categoryId}`)}
                    >
                        <Plus size={16} />
                        Novo Prompt
                    </button>
                </div>
            </header>

            <div className="app-content">
                {prompts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">{category.icon}</div>
                        <h3 className="empty-state__title">Nenhum prompt nesta categoria</h3>
                        <p className="empty-state__description">
                            Crie seu primeiro prompt para a categoria "{category.name}".
                        </p>
                        <button
                            className="btn btn--primary"
                            onClick={() => navigate(`/editor/novo?categoria=${categoryId}`)}
                        >
                            <Plus size={16} />
                            Criar Prompt
                        </button>
                    </div>
                ) : (
                    <div className="prompt-list">
                        {prompts.map((prompt) => (
                            <div key={prompt.id} className="prompt-item">
                                <div
                                    style={{ flex: 1, cursor: 'pointer' }}
                                    onClick={() => navigate(`/editor/${prompt.id}`)}
                                >
                                    <div className="prompt-item__title">{prompt.title}</div>
                                    <div className="prompt-item__meta">
                                        <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                                        {formatDate(prompt.updatedAt)}
                                        {prompt.systemRole && (
                                            <span style={{ marginLeft: 'var(--space-3)', opacity: 0.6 }}>
                                                • {prompt.systemRole.substring(0, 50)}
                                                {prompt.systemRole.length > 50 ? '...' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="prompt-item__actions">
                                    <button
                                        className="btn btn--ghost btn--icon"
                                        onClick={() => navigate(`/editor/${prompt.id}`)}
                                        aria-label="Editar prompt"
                                        title="Editar"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button
                                        className="btn btn--ghost btn--icon"
                                        onClick={() => handleCopy(prompt.id!)}
                                        aria-label="Copiar prompt"
                                        title="Copiar JSON"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        className="btn btn--ghost btn--icon"
                                        onClick={() => handleDownload(prompt.id!)}
                                        aria-label="Baixar prompt"
                                        title="Baixar .json"
                                    >
                                        <Download size={16} />
                                    </button>
                                    <button
                                        className="btn btn--ghost btn--icon"
                                        onClick={() => handleDelete(prompt.id!)}
                                        aria-label="Excluir prompt"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} color="var(--color-error)" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
