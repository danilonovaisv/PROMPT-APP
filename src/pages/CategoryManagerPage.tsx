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

    const startEdit = (cat: { id?: number; name: string; icon: string; color: string }) => {
        setIsCreating(false);
        setIsEditing(cat.id!);
        setForm({ name: cat.name, icon: cat.icon, color: cat.color });
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

        if (isEditing) {
            await db.categories.update(isEditing, {
                name: form.name.trim(),
                icon: form.icon,
                color: form.color,
            });
            showToast('Categoria atualizada!');
        } else {
            await db.categories.add({
                name: form.name.trim(),
                icon: form.icon,
                color: form.color,
                createdAt: new Date(),
            });
            showToast('Categoria criada!');
        }
        await saveLocalBackup();
        cancel();
    };

    const handleDelete = async (id: number) => {
        const promptCount = await db.prompts.where('categoryId').equals(id).count();
        if (promptCount > 0) {
            if (!confirm(`Esta categoria tem ${promptCount} prompt(s). Excluir tudo?`)) return;
            await db.prompts.where('categoryId').equals(id).delete();
        }
        await db.categories.delete(id);
        await saveLocalBackup();
        showToast('Categoria excluída!');
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
                    <h2 className="app-header__title">Gerenciar Categorias</h2>
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
                                    // eslint-disable-next-line
                                    <button
                                        key={color}
                                        type="button"
                                        className={`color-picker-grid__swatch ${form.color === color ? 'color-picker-grid__swatch--selected' : ''}`}
                                        style={{ '--swatch-color': color } as React.CSSProperties}
                                        onClick={() => setForm({ ...form, color })}
                                        aria-label={`Cor ${color}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        {/* eslint-disable-next-line */}
                        <div
                            className="cat-preview"
                            style={{ '--cat-color': form.color } as React.CSSProperties}
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
                                >
                                    {/* eslint-disable-next-line */}
                                    <span
                                        className="cat-list-item__icon"
                                        style={{ '--cat-color-glow': `${cat.color}20` } as React.CSSProperties}
                                    >
                                        {cat.icon}
                                    </span>
                                    <div>
                                        {/* eslint-disable-next-line */}
                                        <div className="prompt-item__title cat-list-item__title" style={{ '--cat-color': cat.color } as React.CSSProperties}>
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
                                        onClick={() => handleDelete(cat.id!)}
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
