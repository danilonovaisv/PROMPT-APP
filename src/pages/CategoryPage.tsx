import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useToast } from '@/context/ToastContext';
import { downloadPrompt, copyToClipboard } from '@/utils/exportJson';
import { renderPromptTextFromPrompt } from '@/utils/promptArtifacts';
import { deletePromptFromSupabase } from '@/services/supabasePrompts';
import {
    Plus,
    ArrowLeft,
    Search,
    X,
} from 'lucide-react';
import SEO from '@/components/SEO';
import PromptCard from '@/components/PromptCard';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useCallback, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchFilter } from '@/hooks/useSearchFilter';

export default function CategoryPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const categoryId = Number(id);

    const [rawSearch, setRawSearch] = useState('');
    const searchTerm = useDebounce(rawSearch, 300);

    const category = useLiveQuery(
        () => db.categories.get(categoryId),
        [categoryId]
    );

    const prompts = useLiveQuery(
        () => db.prompts.where('categoryId').equals(categoryId).toArray(),
        [categoryId]
    ) ?? [];

    const filteredPrompts = useSearchFilter(prompts, searchTerm);

    const handleCopy = useCallback(async (promptId: number) => {
        const prompt = await db.prompts.get(promptId);
        if (!prompt) return;
        const renderedPrompt = renderPromptTextFromPrompt(prompt);
        const ok = await copyToClipboard(renderedPrompt);
        showToast(ok ? 'Prompt final copiado!' : 'Erro ao copiar', ok ? 'success' : 'error');
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
            } catch (e: unknown) {
        const error = e as Error;
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
                    {/* A11y Audit Fix #09: Breadcrumbs */}
                    <Breadcrumb
                        items={[
                            { label: 'Início', href: '/' },
                            { label: 'Categoria não encontrada' },
                        ]}
                    />
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
                description={`Explore ${prompts.length} templates na categoria ${category.name}.`}
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
                        Novo Template
                    </button>
                </div>
            </header>

            <div className="app-content">
                {/* A11y Audit Fix #09: Breadcrumbs */}
                <Breadcrumb
                    items={[
                        { label: 'Início', href: '/' },
                        { label: category.name },
                    ]}
                />

                {/* A11y Audit Fix #10: Search filter */}
                {prompts.length > 0 && (
                    <div className="category-search">
                        <label htmlFor="category-search-input" className="sr-only">
                            Buscar templates
                        </label>
                        <div className="category-search__input-wrapper">
                            <Search
                                size={16}
                                className="category-search__icon"
                                aria-hidden="true"
                            />
                            <input
                                id="category-search-input"
                                type="search"
                                className="category-search__input"
                                placeholder="Buscar por título ou descrição..."
                                value={rawSearch}
                                onChange={(e) => setRawSearch(e.target.value)}
                                aria-label="Buscar templates nesta categoria"
                            />
                            {rawSearch && (
                                <button
                                    className="category-search__clear"
                                    onClick={() => setRawSearch('')}
                                    aria-label="Limpar busca"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        {searchTerm && (
                            <p className="category-search__count" aria-live="polite">
                                {filteredPrompts.length} de {prompts.length}{' '}
                                {prompts.length === 1 ? 'resultado' : 'resultados'}
                            </p>
                        )}
                    </div>
                )}

                {filteredPrompts.length === 0 && prompts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">{category.icon}</div>
                        <h3 className="empty-state__title">Nenhum template nesta categoria</h3>
                        <p className="empty-state__description">
                            Crie seu primeiro template para a categoria "{category.name}".
                        </p>
                        <button
                            className="btn btn--primary"
                            onClick={() => navigate(`/editor/novo?categoria=${categoryId}`)}
                        >
                            <Plus size={16} />
                            Criar Template
                        </button>
                    </div>
                ) : filteredPrompts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">🔍</div>
                        <h3 className="empty-state__title">Nenhum resultado encontrado</h3>
                        <p className="empty-state__description">
                            Nenhum template corresponde a "{searchTerm}". Tente outro termo.
                        </p>
                        <button
                            className="btn btn--secondary"
                            onClick={() => setRawSearch('')}
                        >
                            Limpar busca
                        </button>
                    </div>
                ) : (
                    <div className="prompt-list">
                        {filteredPrompts.map((prompt) => (
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
