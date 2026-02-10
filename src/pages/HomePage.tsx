/* ======================================================
   Página Inicial — Grid de categorias
   ====================================================== */

import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { Plus, Sparkles } from 'lucide-react';

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
                <div style={{ marginBottom: 'var(--space-10)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                        <Sparkles size={48} color="#0048ff" />
                    </div>
                    <h1
                        style={{
                            fontSize: 'var(--font-size-3xl)',
                            fontWeight: 'var(--font-weight-extrabold)',
                            background: 'linear-gradient(135deg, #0048ff, #7b2ff7)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: 'var(--space-3)',
                        }}
                    >
                        Engenharia de Prompts
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                        Crie, organize e exporte prompts estruturados para LLMs com contexto cognitivo profissional.
                    </p>
                </div>

                {/* Estatísticas rápidas */}
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--space-4)',
                        marginBottom: 'var(--space-8)',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    {[
                        { label: 'Categorias', value: categories.length, color: '#0048ff' },
                        { label: 'Prompts', value: prompts.length, color: '#7b2ff7' },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="card"
                            style={{
                                textAlign: 'center',
                                minWidth: '140px',
                                borderTop: `3px solid ${stat.color}`,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 'var(--font-size-2xl)',
                                    fontWeight: 'var(--font-weight-bold)',
                                    color: stat.color,
                                }}
                            >
                                {stat.value}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
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
                            className="card card--clickable category-card"
                            onClick={() => navigate('/categorias')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '160px',
                                borderStyle: 'dashed',
                            }}
                        >
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <Plus size={32} style={{ marginBottom: 'var(--space-2)' }} />
                                <div style={{ fontSize: 'var(--font-size-sm)' }}>Nova Categoria</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

/* Importação para uso no JSX acima */
import { FolderPlus } from 'lucide-react';
