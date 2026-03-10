import React from 'react';
import type { Category } from '@/models/types';

interface CategoryCardProps {
    category: Category;
    count: number;
    onClick: (id: number) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, count, onClick }) => {
    const colorClass = `util-cat-color-${category.color.replace('#', '')}`;

    return (
        <div
            className={`card card--clickable category-card ${colorClass}`}
            onClick={() => onClick(category.id!)}
            role="button"
            tabIndex={0}
            aria-label={`Categoria ${category.name}, ${count} ${count === 1 ? 'prompt' : 'prompts'}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(category.id!);
                }
            }}
        >
            <div className="category-card__stripe" />
            <div className="category-card__icon" aria-hidden="true">{category.icon}</div>
            <div className="category-card__name">{category.name}</div>
            <div className="category-card__count">
                {count} {count === 1 ? 'prompt' : 'prompts'}
            </div>
        </div>
    );
};

export default React.memo(CategoryCard);
