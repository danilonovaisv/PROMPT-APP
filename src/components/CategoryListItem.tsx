import React, { memo } from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import type { Category } from '@/models/types';

interface CategoryListItemProps {
    category: Category;
    onEdit: (category: Category) => void;
    onDelete: (id: number, remoteId?: number) => void;
    onClick: (id: number) => void;
}

// ⚡ Bolt Optimization:
// What: Extracted CategoryListItem and wrapped it in React.memo()
// Why: Prevents re-rendering the entire list of category rows on every keystroke when editing a category form.
// Impact: Significantly reduces React render cycle time and CPU usage on CategoryManagerPage.
export const CategoryListItem = memo(function CategoryListItem({
    category,
    onEdit,
    onDelete,
    onClick,
}: CategoryListItemProps) {
    const colorClass = `util-cat-color-${category.color.replace('#', '')}`;

    return (
        <div className="prompt-item">
            <div
                className="cat-list-item"
                onClick={() => onClick(category.id!)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onClick(category.id!);
                    }
                }}
                role="button"
                tabIndex={0}
            >
                <span className={`cat-list-item__icon ${colorClass}`}>
                    {category.icon}
                </span>
                <div>
                    <div className={`prompt-item__title cat-list-item__title ${colorClass}`}>
                        {category.name}
                    </div>
                </div>
            </div>
            <div className="prompt-item__actions prompt-item__actions--visible">
                <button
                    className="btn btn--ghost btn--icon"
                    onClick={() => onEdit(category)}
                    aria-label="Editar categoria"
                    title="Editar"
                >
                    <Edit3 size={16} />
                </button>
                <button
                    className="btn btn--ghost btn--icon"
                    onClick={() => onDelete(category.id!, category.remoteId)}
                    aria-label="Excluir categoria"
                    title="Excluir"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
});
