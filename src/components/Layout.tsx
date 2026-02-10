/* ======================================================
   Layout — Shell com sidebar e área principal
   ====================================================== */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import {
    Home,
    FolderPlus,
    Download,
    Upload,
    Menu,
    X,
    Sparkles,
} from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    onOpenImportExport: () => void;
}

export default function Layout({ children, onOpenImportExport }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const categories = useLiveQuery(() => db.categories.toArray()) ?? [];

    const isActive = (path: string) => location.pathname === path;

    const navTo = (path: string) => {
        navigate(path);
        setSidebarOpen(false);
    };

    return (
        <div className="app-layout">
            {/* Mobile toggle */}
            <button
                className="mobile-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Abrir menu"
            >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar */}
            <aside className={`app-sidebar ${sidebarOpen ? 'app-sidebar--open' : ''}`}>
                <div className="app-sidebar__logo">
                    <Sparkles size={24} color="#0048ff" />
                    <h1>Prompt App</h1>
                </div>

                <nav className="app-sidebar__nav">
                    {/* Navegação principal */}
                    <button
                        className={`app-sidebar__nav-item ${isActive('/') ? 'app-sidebar__nav-item--active' : ''}`}
                        onClick={() => navTo('/')}
                    >
                        <Home size={18} />
                        Início
                    </button>

                    <button
                        className={`app-sidebar__nav-item ${isActive('/categorias') ? 'app-sidebar__nav-item--active' : ''}`}
                        onClick={() => navTo('/categorias')}
                    >
                        <FolderPlus size={18} />
                        Gerenciar Categorias
                    </button>

                    {/* Categorias */}
                    <div className="app-sidebar__section-title">Categorias</div>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            className={`app-sidebar__nav-item ${isActive(`/categoria/${cat.id}`) ? 'app-sidebar__nav-item--active' : ''}`}
                            onClick={() => navTo(`/categoria/${cat.id}`)}
                        >
                            <span>{cat.icon}</span>
                            {cat.name}
                        </button>
                    ))}

                    {/* Ações */}
                    <div className="app-sidebar__section-title">Ações</div>
                    <button className="app-sidebar__nav-item" onClick={onOpenImportExport}>
                        <Upload size={18} />
                        Importar Prompts
                    </button>
                    <button
                        className="app-sidebar__nav-item"
                        onClick={async () => {
                            const { downloadAllPrompts } = await import('@/utils/exportJson');
                            downloadAllPrompts();
                        }}
                    >
                        <Download size={18} />
                        Exportar Todos
                    </button>
                </nav>

                <div className="app-sidebar__footer">
                    <div className="sidebar-version">
                        Prompt App v1.0
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="app-main">
                {children}
            </main>

            {/* Overlay para mobile */}
            {sidebarOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
