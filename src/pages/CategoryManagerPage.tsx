/* ======================================================
   Gerenciador de Categorias
   ====================================================== */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useToast } from '@/context/ToastContext';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/utils/constants';
import { saveLocalBackup } from '@/utils/backupManager';
import { saveCategoryToSupabase, deleteCategoryFromSupabase } from '@/services/supabaseCategories';
import { deletePromptFromSupabase } from '@/services/supabasePrompts';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Edit3,
    Check,
    X,
} from 'lucide-react';

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
    const categories = useLiveQuery(() => db.categories.toArray()) ?? [];

    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState<CategoryFormData>(DEFAULT_FORM);

    const startCreate = () => {
        setIsEditing(null);
        setForm(DEFAULT_FORM);
        setIsCreating(true);
    };

    const startEdit = (cat: { id?: number; remoteId?: number; name: string; icon: string; color: string }) => {
        setIsCreating(false);
        setIsEditing(cat.id!);
        setForm({ name: cat.name, icon: cat.icon, color: cat.color, remoteId: cat.remoteId });
    };

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

    const handleDelete = async (id: number, remoteId?: number) => {
        const promptCount = await db.prompts.where('categoryId').equals(id).count();
        if (promptCount > 0) {
            if (!confirm(`Esta categoria tem ${promptCount} prompt(s). Excluir tudo?`)) return;
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
            await db.categories.delete(id);
            await saveLocalBackup();
            showToast('Categoria excluída do servidor!');
        } catch (e: unknown) {
        const error = e as Error;
            console.error('Erro ao excluir no Supabase:', error);
            showToast(error.message || 'Erro ao deletar categoria no servidor.', 'error');
        }
    };

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
                            <label className="form-label">Nome</label>
                            <input
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
                            <div key={cat.id} className="prompt-item">
                                <div
                                    className="cat-list-item"
                                    onClick={() => navigate(`/categoria/${cat.id}`)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            navigate(`/categoria/${cat.id}`);
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <span
                                        className={`cat-list-item__icon util-cat-color-${cat.color.replace('#', '')}`}
                                    >
                                        {cat.icon}
                                    </span>
                                    <div>
                                        <div className={`prompt-item__title cat-list-item__title util-cat-color-${cat.color.replace('#', '')}`}>
                                            {cat.name}
                                        </div>
                                    </div>
                                </div>
                                <div className="prompt-item__actions prompt-item__actions--visible">
                                    <button
                                        className="btn btn--ghost btn--icon"
                                        onClick={() => startEdit(cat)}
                                        aria-label="Editar categoria"
                                        title="Editar"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button
                                        className="btn btn--ghost btn--icon"
                                        onClick={() => handleDelete(cat.id!, cat.remoteId)}
                                        aria-label="Excluir categoria"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
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
