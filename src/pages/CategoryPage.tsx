import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useToast } from '@/context/ToastContext';
import { downloadPrompt, toExportFormat, copyToClipboard } from '@/utils/exportJson';
import { deletePromptFromSupabase } from '@/services/supabasePrompts';
import {
    Plus,
    ArrowLeft,
} from 'lucide-react';
import SEO from '@/components/SEO';
import PromptCard from '@/components/PromptCard';
import { useCallback } from 'react';

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

    const handleCopy = useCallback(async (promptId: number) => {
        const prompt = await db.prompts.get(promptId);
        if (!prompt) return;
        const exported = toExportFormat(prompt);
        const json = JSON.stringify(exported, null, 2);
        const ok = await copyToClipboard(json);
        showToast(ok ? 'Prompt copiado!' : 'Erro ao copiar', ok ? 'success' : 'error');
    }, [showToast]);

    const handleDownload = useCallback(async (promptId: number) => {
        const prompt = await db.prompts.get(promptId);
        if (!prompt) return;
        downloadPrompt(prompt);
        showToast('Download iniciado!');
    }, [showToast]);

    const handleDelete = useCallback(async (promptId: number) => {
        if (!confirm('Deseja realmente excluir este prompt?')) return;
        const prompt = await db.prompts.get(promptId);
        if (prompt?.remoteId) {
            try {
                await deletePromptFromSupabase(prompt.remoteId);
            } catch (error: any) {
                console.error("Erro ao deletar no Supabase:", error);
                showToast(error.message || 'Erro ao deletar o prompt no servidor.', 'error');
                return;
            }
        }
        await db.prompts.delete(promptId);
        showToast('Prompt excluído!');
    }, [showToast]);

    const handleEdit = useCallback((id: number) => {
        navigate(`/editor/${id}`);
    }, [navigate]);

    const formatDate = useCallback((date: Date) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }, []);

    if (!category) {
        return (
            <>
                <SEO title="Categoria não encontrada" />
                <header className="app-header">
                    <button className="btn btn--ghost" onClick={() => navigate('/')}>
                        <ArrowLeft size={16} /> Voltar
                    </button>
                </header>
                <div className="app-content">
                    <div className="empty-state">
                        <div className="empty-state__icon">🔍</div>
                        <h1 className="empty-state__title">Categoria não encontrada</h1>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SEO
                title={category.name}
                description={`Explore ${prompts.length} prompts na categoria ${category.name}.`}
            />
            <header className="app-header">
                <div className="flex-row-center">
                    <button
                        className="btn btn--ghost btn--icon"
                        onClick={() => navigate('/')}
                        aria-label="Voltar ao início"
                        title="Voltar"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <span className="cat-header-icon">{category.icon}</span>
                    <h1
                        className={`app-header__title cat-header__title util-cat-color-${category.color.replace('#', '')}`}
                    >
                        {category.name}
                    </h1>
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
                            <PromptCard
                                key={prompt.id}
                                prompt={prompt}
                                onEdit={handleEdit}
                                onCopy={handleCopy}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                formatDate={formatDate}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
