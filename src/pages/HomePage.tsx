/* ======================================================
   Página Inicial — Grid de categorias
   ====================================================== */

import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { Plus, Sparkles, FolderPlus } from 'lucide-react';
import SEO from '@/components/SEO';
import CategoryCard from '@/components/CategoryCard';
import { useMemo, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { SkeletonCategoryGrid } from '@/components/SkeletonLoader';

export default function HomePage() {
    const navigate = useNavigate();

    // ⚡ Bolt Optimization:
    // Avoid fetching all full prompt objects into memory just to count them.
    // Instead of multiple sequential DB calls per category (O(N)), we perform a single
    // cursor-based pass (O(1) database passes) to calculate both total and per-category
    // counts, preventing memory bottlenecks.
    const homeData = useLiveQuery(async () => {
        const allCategories = await db.categories.filter(c => !c.isDeleted).toArray();
        const map: Record<number, number> = {};
        allCategories.forEach(cat => { if (cat.id) map[cat.id] = 0; });

        let total = 0;
        await db.prompts
            .filter(p => !p.isDeleted)
            .each(p => {
                total++;
                if (p.categoryId && map[p.categoryId] !== undefined) {
                    map[p.categoryId]++;
                }
            });

        return { categories: allCategories, countsMap: map, totalPrompts: total };
    }, []);

    const { categories, countsMap, totalPrompts } = homeData ?? { categories: [], countsMap: {}, totalPrompts: 0 };
    const isLoading = homeData === undefined;

    const stats = useMemo(() => [
        { label: 'Categorias', value: categories.length, color: '#0048ff' },
        { label: 'Templates', value: totalPrompts, color: '#7b2ff7' },
    ], [categories.length, totalPrompts]);

    const handleCategoryClick = useCallback((id: number) => navigate(`/categoria/${id}`), [navigate]);

    return (
        <>
            <SEO
                title="Início"
                description="Organize seus templates de prompt com menus independentes e exportação estruturada."
            />
<Header
                title="Início"
                actions={
                    <button className="btn btn--primary stagger-1" onClick={() => navigate('/editor/novo')}>
                        <Plus size={16} />
                        Novo Template
                    </button>
                }
            />

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
                        Crie, organize e exporte templates estruturados para LLMs com menus e payload compilado.
                    </p>
                </div>

                {/* Estatísticas rápidas */}
                <div className="stats-row">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className={`card stat-card util-cat-color-${stat.color.replace('#', '')}`}
                        >
                            <div className="stat-card__value">
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
                            Clique em uma categoria para ver seus templates
                        </p>
                    </div>
                    <button className="btn btn--secondary" onClick={() => navigate('/categorias')}>
                        <FolderPlus size={16} />
                        Gerenciar
                    </button>
                </div>

                {isLoading ? (
                    <SkeletonCategoryGrid />
                ) : categories.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">📂</div>
                        <h3 className="empty-state__title">Nenhuma categoria</h3>
                        <p className="empty-state__description">
                            Crie sua primeira categoria para começar a organizar seus templates.
                        </p>
                        <button className="btn btn--primary" onClick={() => navigate('/categorias')}>
                            Criar Categoria
                        </button>
                    </div>
                ) : (
                    <div className="category-grid">
                        {categories.map((cat) => (
                            <CategoryCard
                                key={cat.id}
                                category={cat}
                                count={countsMap[cat.id!] || 0}
                                onClick={handleCategoryClick}
                            />
                        ))}

                        {/* Card de adicionar */}
                        <div
                            className="card card--clickable category-card category-card--add"
                            onClick={() => navigate('/categorias')}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    navigate('/categorias');
                                }
                            }}
                            role="button"
                            tabIndex={0}
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
