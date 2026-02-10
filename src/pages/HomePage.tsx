/* ======================================================
   Página Inicial — Grid de categorias
   ====================================================== */

import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { Plus, Sparkles, FolderPlus } from 'lucide-react';

export default function HomePage() {
    const navigate = useNavigate();

    const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
    const prompts = useLiveQuery(() => db.prompts.toArray()) ?? [];

    const countByCategory = (catId: number) =>
        prompts.filter((p) => p.categoryId === catId).length;

    return (
        <>
            <header className="app-header">
                <h2 className="app-header__title">Início</h2>
                <div className="app-header__actions">
                    <button className="btn btn--primary" onClick={() => navigate('/editor/novo')}>
                        <Plus size={16} />
                        Novo Prompt
                    </button>
                </div>
            </header>

            <div className="app-content">
                {/* Hero */}
                <div className="hero">
                    <div className="hero__icon-wrapper">
                        <Sparkles size={48} color="#0048ff" />
                    </div>
                    <h1 className="hero__title">
                        Engenharia de Prompts
                    </h1>
                    <p className="hero__subtitle">
                        Crie, organize e exporte prompts estruturados para LLMs com contexto cognitivo profissional.
                    </p>
                </div>

                {/* Estatísticas rápidas */}
                <div className="stats-row">
                    {[
                        { label: 'Categorias', value: categories.length, color: '#0048ff' },
                        { label: 'Prompts', value: prompts.length, color: '#7b2ff7' },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="card stat-card"
                            style={{ borderTop: `3px solid ${stat.color}` } as React.CSSProperties}
                        >
                            <div className="stat-card__value" style={{ color: stat.color } as React.CSSProperties}>
                                {stat.value}
                            </div>
                            <div className="stat-card__label">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Grid de Categorias */}
                <div className="page-header">
                    <div>
                        <h2 className="page-header__title">Categorias</h2>
                        <p className="page-header__subtitle">
                            Clique em uma categoria para ver seus prompts
                        </p>
                    </div>
                    <button className="btn btn--secondary" onClick={() => navigate('/categorias')}>
                        <FolderPlus size={16} />
                        Gerenciar
                    </button>
                </div>

                {categories.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">📂</div>
                        <h3 className="empty-state__title">Nenhuma categoria</h3>
                        <p className="empty-state__description">
                            Crie sua primeira categoria para começar a organizar seus prompts.
                        </p>
                        <button className="btn btn--primary" onClick={() => navigate('/categorias')}>
                            Criar Categoria
                        </button>
                    </div>
                ) : (
                    <div className="category-grid">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className="card card--clickable category-card"
                                onClick={() => navigate(`/categoria/${cat.id}`)}
                                style={{ '--category-color': cat.color, '--category-color-glow': `${cat.color}20` } as React.CSSProperties}
                            >
                                <div className="category-card__stripe" />
                                <div className="category-card__icon">{cat.icon}</div>
                                <div className="category-card__name">{cat.name}</div>
                                <div className="category-card__count">
                                    {countByCategory(cat.id!)} {countByCategory(cat.id!) === 1 ? 'prompt' : 'prompts'}
                                </div>
                            </div>
                        ))}

                        {/* Card de adicionar */}
                        <div
                            className="card card--clickable category-card category-card--add"
                            onClick={() => navigate('/categorias')}
                        >
                            <div className="category-card--add__content">
                                <Plus size={32} className="category-card--add__icon" />
                                <div className="category-card--add__label">Nova Categoria</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
