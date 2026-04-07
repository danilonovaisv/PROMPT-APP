/* ======================================================
   Gerenciador de Categorias
   ====================================================== */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/hooks/useConfirm';
import { useCallback } from 'react';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/utils/constants';
import { saveLocalBackup } from '@/utils/backupManager';
import { saveCategoryToSupabase, deleteCategoryFromSupabase } from '@/services/supabaseCategories';
import { deletePromptFromSupabase } from '@/services/supabasePrompts';
import {
    ArrowLeft,
    Plus,
    Check,
    X,
} from 'lucide-react';
import { CategoryListItem } from '@/components/CategoryListItem';

interface CategoryFormData {
    name: string;
    icon: string;
    color: string;
    remoteId?: number;
}

const DEFAULT_FORM: CategoryFormData = {
    name: '',
    icon: '📝',
    color: '#0048ff',
};

export default function CategoryManagerPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const confirm = useConfirm();
    // Filtrar categorias soft-deleted localmente — nunca exibir itens com isDeleted: true
    const categories = useLiveQuery(
        () => db.categories.filter(c => !c.isDeleted).toArray()
    ) ?? [];

    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState<CategoryFormData>(DEFAULT_FORM);

    const startCreate = () => {
        setIsEditing(null);
        setForm(DEFAULT_FORM);
        setIsCreating(true);
    };

    // ⚡ Bolt Optimization: Wrap handlers passed to memoized children in useCallback
    const startEdit = useCallback((cat: { id?: number; remoteId?: number; name: string; icon: string; color: string }) => {
        setIsCreating(false);
        setIsEditing(cat.id!);
        setForm({ name: cat.name, icon: cat.icon, color: cat.color, remoteId: cat.remoteId });
    }, []);

    const cancel = () => {
        setIsEditing(null);
        setIsCreating(false);
        setForm(DEFAULT_FORM);
    };

    const save = async () => {
        if (!form.name.trim()) {
            showToast('Nome da categoria é obrigatório', 'error');
            return;
        }

        const now = new Date();
        let localId: number | null;

        try {
            if (isEditing) {
                localId = isEditing;
                await db.categories.update(isEditing, {
                    name: form.name.trim(),
                    icon: form.icon,
                    color: form.color,
                    syncStatus: 'pending',
                });
            } else {
                const newId = await db.categories.add({
                    name: form.name.trim(),
                    icon: form.icon,
                    color: form.color,
                    createdAt: now,
                    syncStatus: 'pending',
                });
                localId = newId ?? null;
            }
            await saveLocalBackup();
        } catch (e: unknown) {
        const error = e as Error;
            console.error('Erro ao salvar localmente:', error);
            showToast(error.message || 'Erro ao salvar a categoria localmente.', 'error');
            return;
        }

        try {
            const savedRemote = await saveCategoryToSupabase({
                name: form.name.trim(),
                icon: form.icon,
                color: form.color,
                remoteId: form.remoteId,
            });

            if (localId !== null) {
                await db.categories.update(localId, {
                    remoteId: savedRemote.id,
                    syncStatus: 'synced',
                });
            }

            showToast(isEditing ? 'Categoria sincronizada!' : 'Categoria criada e sincronizada!');
            cancel();
        } catch (e: unknown) {
        const error = e as Error;
            console.error('Erro ao salvar categoria no Supabase:', error);
            showToast('Categoria salva localmente. Sincronize ao fazer login.', 'info');
            cancel();
        }
    };

    // ⚡ Bolt Optimization: Wrap handlers passed to memoized children in useCallback
    const handleDelete = useCallback(async (id: number, remoteId?: number) => {
        const promptCount = await db.prompts.where('categoryId').equals(id).count();
        if (promptCount > 0) {
            // Fix A11y: useConfirm em vez de confirm() nativo (bloqueia thread, sem acessibilidade)
            const ok = await confirm({
                message: `Esta categoria tem ${promptCount} prompt(s). Excluir tudo?`,
                title: 'Excluir categoria',
                variant: 'danger',
            });
            if (!ok) return;
            const promptsToDelete = await db.prompts.where('categoryId').equals(id).toArray();
            await db.prompts.where('categoryId').equals(id).delete();
            for (const p of promptsToDelete) {
                if (p.remoteId) {
                    try {
                        await deletePromptFromSupabase(p.remoteId);
                    } catch (e) {
                        console.error('Falha ao soft-delete prompt:', p.title, e);
                    }
                }
            }
        }

        try {
            if (remoteId) {
                await deleteCategoryFromSupabase(remoteId);
            }
            // Fix P0 (V1+V2): Soft-delete local em vez de hard-delete.
            // Preserva o histórico de nomes excluídos para que seedDatabase()
            // não recrie a categoria no próximo boot, e para que syncToCloud()
            // não faça upsert dentro da janela de debounce do autoSync.
            await db.categories.update(id, { isDeleted: true, syncStatus: 'synced' });
            await saveLocalBackup();
            showToast('Categoria excluída do servidor!');
        } catch (e: unknown) {
        const error = e as Error;
            console.error('Erro ao excluir no Supabase:', error);
            showToast(error.message || 'Erro ao deletar categoria no servidor.', 'error');
        }
    }, [confirm, showToast]);

    // ⚡ Bolt Optimization: Wrap handlers passed to memoized children in useCallback
    const handleCategoryClick = useCallback((id: number) => {
        navigate(`/categoria/${id}`);
    }, [navigate]);

    return (
        <>
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
                    <h1 className="app-header__title">Gerenciar Categorias</h1>
                </div>
                <div className="app-header__actions">
                    <button className="btn btn--primary" onClick={startCreate}>
                        <Plus size={16} />
                        Nova Categoria
                    </button>
                </div>
            </header>

            <div className="app-content">
                {/* Formulário de criação/edição */}
                {(isCreating || isEditing !== null) && (
                    <div className="card card--active">
                        <h3 className="card__title">
                            {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
                        </h3>

                        <div className="form-group">
                            {/* Fix A11y: htmlFor conecta label ao input via id */}
                            <label className="form-label" htmlFor="cat-name-input">Nome</label>
                            <input
                                id="cat-name-input"
                                aria-required="true"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Ex: Copywriting, Código, Marketing..."
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Ícone</label>
                            <div className="icon-picker-grid">
                                {CATEGORY_ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        className={`icon-picker-grid__item ${form.icon === icon ? 'icon-picker-grid__item--selected' : ''}`}
                                        onClick={() => setForm({ ...form, icon })}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Cor</label>
                            <div className="color-picker-grid">
                                {CATEGORY_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`color-picker-grid__swatch util-cat-color-${color.replace('#', '')} ${form.color === color ? 'color-picker-grid__swatch--selected' : ''}`}
                                        onClick={() => setForm({ ...form, color })}
                                        aria-label={`Cor ${color}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        <div
                            className={`cat-preview util-cat-color-${form.color.replace('#', '')}`}
                        >
                            <span className="cat-preview__icon">{form.icon}</span>
                            <span className="cat-preview__name">
                                {form.name || 'Nome da categoria'}
                            </span>
                        </div>

                        <div className="flex-row-end">
                            <button className="btn btn--secondary" onClick={cancel}>
                                <X size={16} /> Cancelar
                            </button>
                            <button className="btn btn--primary" onClick={save}>
                                <Check size={16} /> Salvar
                            </button>
                        </div>
                    </div>
                )}

                {/* Lista de categorias */}
                {categories.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">📂</div>
                        <h3 className="empty-state__title">Nenhuma categoria criada</h3>
                        <p className="empty-state__description">
                            Clique em "Nova Categoria" para começar.
                        </p>
                    </div>
                ) : (
                    <div className="prompt-list">
                        {categories.map((cat) => (
                            <CategoryListItem
                                key={cat.id}
                                category={cat}
                                onEdit={startEdit}
                                onDelete={handleDelete}
                                onClick={handleCategoryClick}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
