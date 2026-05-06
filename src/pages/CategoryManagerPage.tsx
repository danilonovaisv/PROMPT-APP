/* ======================================================
   Gerenciador de Categorias
   ====================================================== */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/hooks/useConfirm';
import SEO from '@/components/SEO';
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
    const confirm = useConfirm();
    // Filtrar categorias soft-deleted localmente — nunca exibir itens com isDeleted: true
    const categories = useLiveQuery(
        async () => {
            return await db.categories.filter((c) => !c.isDeleted).toArray();
        }
    ) ?? [];

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
            console.error('Erro ao salvar localmente:', e);
            const errorMessage = e instanceof Error ? e.message : 'Erro ao salvar a categoria localmente.';
            showToast(errorMessage, 'error');
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
            console.error('Erro ao salvar categoria no Supabase:', e);
            showToast('Categoria salva localmente. Sincronize ao fazer login.', 'info');
            cancel();
        }
    };

    const handleDelete = async (id: number, remoteId?: number) => {
        // ⚡ Bolt Optimization:
        // Use Dexie's optimized .count() to determine the number of prompts before showing
        // the confirmation dialog. This prevents loading potentially large JSON payloads into
        // an array (.toArray()) memory before the user has even confirmed the deletion.
        const promptQuery = db.prompts
            .where('categoryId')
            .equals(id)
            .filter(p => !p.isDeleted);

        const promptCount = await promptQuery.count();

        if (promptCount > 0) {
            // Fix A11y: useConfirm em vez de confirm() nativo (bloqueia thread, sem acessibilidade)
            const ok = await confirm({
                message: `Esta categoria tem ${promptCount} prompt(s). Excluir tudo?`,
                title: 'Excluir categoria',
                variant: 'danger',
            });
            if (!ok) return;

            // Now that user has confirmed, fetch the actual records
            const promptsByCategory = await promptQuery.toArray();
            for (const p of promptsByCategory) {
                if (!p.id) continue;

                if (!p.remoteId) {
                    await db.prompts.delete(p.id);
                    continue;
                }

                if (p.remoteId) {
                    try {
                        await deletePromptFromSupabase(p.remoteId);
                        await db.prompts.delete(p.id);
                    } catch (e) {
                        console.error('Falha ao soft-delete prompt:', p.title, e);
                        await db.prompts.update(p.id, {
                            isDeleted: true,
                            syncStatus: 'pending',
                            updatedAt: new Date(),
                        });
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
            await db.categories.update(id, {
                isDeleted: true,
                syncStatus: 'synced',
                updatedAt: new Date(),
            });
            await saveLocalBackup();
            showToast('Categoria excluída!');
        } catch (e: unknown) {
            console.error('Erro ao excluir no Supabase:', e);
            await db.categories.update(id, {
                isDeleted: true,
                syncStatus: 'pending',
                updatedAt: new Date(),
            });
            await saveLocalBackup();
            showToast('Categoria removida localmente. A exclusão será sincronizada ao reconectar.', 'info');
        }
    };

    return (
        <>
            <SEO
                title="Gerenciar Categorias"
                description="Crie, edite e organize categorias para agrupar templates de prompt."
            />
            <header className="app-header glass">
                <div className="flex-row-center gap-4">
                    <button
                        className="btn btn--ghost btn--icon"
                        onClick={() => navigate('/')}
                        aria-label="Voltar ao início"
                        title="Voltar"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-column">
                        <h1 className="app-header__title">Gerenciar Categorias</h1>
                        <p className="util-text-muted util-text-xs">Organize seus templates por tópicos</p>
                    </div>
                </div>
                <div className="app-header__actions">
                    <button className="btn btn--primary" onClick={startCreate}>
                        <Plus size={18} />
                        Nova Categoria
                    </button>
                </div>
            </header>

            <div className="app-content motion-entry">
                {/* Formulário de criação/edição */}
                {(isCreating || isEditing !== null) && (
                    <div className="card card--active glass motion-entry">
                        <div className="flex-column gap-1 mb-6">
                            <h3 className="card__title">
                                {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
                            </h3>
                            <p className="util-text-muted util-text-xs">
                                Defina o nome, ícone e cor visual para esta categoria.
                            </p>
                        </div>

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
                            <div className="icon-picker-grid glass">
                                {CATEGORY_ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        className={`icon-picker-grid__item ${form.icon === icon ? 'icon-picker-grid__item--selected' : ''}`}
                                        onClick={() => setForm({ ...form, icon })}
                                        aria-label={`Selecionar ícone ${icon}`}
                                    >
                                        <span className="icon-picker-grid__emoji">{icon}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Cor</label>
                            <div className="color-picker-grid glass">
                                {CATEGORY_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`color-picker-grid__swatch ${form.color === color ? 'color-picker-grid__swatch--selected' : ''}`}
                                        onClick={() => setForm({ ...form, color })}
                                        style={{ backgroundColor: color }}
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
                    <div className="category-grid">
                        {categories.map((cat) => (
                            <div 
                                key={cat.id} 
                                className="category-item"
                                onClick={() => navigate(`/categoria/${cat.id}`)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        navigate(`/categoria/${cat.id}`);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={`Categoria ${cat.name}`}
                                style={{ '--cat-color': cat.color, '--cat-color-glow': `${cat.color}20` } as React.CSSProperties}
                            >
                                <div className="category-item__content">
                                    <span className="category-item__icon">
                                        {cat.icon}
                                    </span>
                                    <div className="category-item__title">
                                        {cat.name}
                                    </div>
                                </div>
                                
                                <div className="category-item__actions">
                                    <button
                                        className="btn btn--ghost btn--icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startEdit(cat);
                                        }}
                                        aria-label="Editar categoria"
                                        title="Editar"
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button
                                        className="btn btn--ghost btn--icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(cat.id!, cat.remoteId);
                                        }}
                                        aria-label="Excluir categoria"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
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
