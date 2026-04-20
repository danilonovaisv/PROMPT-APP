/* ======================================================
   Layout — Shell com sidebar e área principal
   ====================================================== */

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
    Layers,
} from 'lucide-react';
import { downloadAllPrompts } from '@/utils/exportJson';
import CloudSyncItem from './CloudSyncItem';
import { isSupabaseConfigured, supabaseConfigErrorMessage } from '@/lib/supabase';

interface LayoutProps {
    children: React.ReactNode;
    onOpenImportExport: () => void;
}

export default function Layout({ children, onOpenImportExport }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // ⚡ Bolt Optimization: Delegate filtering to Dexie to avoid loading deleted categories into memory
    const categories = useLiveQuery(() => db.categories.filter(c => !c.isDeleted).toArray()) ?? [];

    const navItemClass = ({ isActive }: { isActive: boolean }) =>
        `app-sidebar__nav-item ${isActive ? 'app-sidebar__nav-item--active' : ''}`;

    return (
        <div className="app-layout">
            <a className="skip-link" href="#main-content">
                Pular para o conteúdo
            </a>
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
                    <Sparkles size={24} color="#0048ff" aria-hidden="true" />
                    <div className="app-sidebar__logo-text">Prompt App</div>
                </div>

                <nav className="app-sidebar__nav">
                    {/* Navegação principal */}
                    <NavLink
                        to="/"
                        className={navItemClass}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <Home size={18} />
                        Início
                    </NavLink>

                    <NavLink
                        to="/categorias"
                        className={navItemClass}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <FolderPlus size={18} />
                        Categorias
                    </NavLink>

                    <NavLink
                        to="/menus"
                        className={navItemClass}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <Layers size={18} />
                        Menus do Template
                    </NavLink>

                    {/* Categorias */}
                    <div className="app-sidebar__section-title">Categorias</div>
                    {categories.map((cat) => (
                        <NavLink
                            key={cat.id}
                            to={`/categoria/${cat.id}`}
                            className={navItemClass}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span>{cat.icon}</span>
                            {cat.name}
                        </NavLink>
                    ))}

                    {/* Ações */}
                    <div className="app-sidebar__section-title">Ações</div>

                    <CloudSyncItem />

                    <button className="app-sidebar__nav-item" onClick={onOpenImportExport}>
                        <Upload size={18} />
                        Importar Templates
                    </button>
                    <button
                        className="app-sidebar__nav-item"
                        onClick={() => downloadAllPrompts()}
                    >
                        <Download size={18} />
                        Exportar Todos
                    </button>
                </nav>

                <div className="app-sidebar__footer">
                    <div className="sidebar-version">
                        Prompt App v3.0
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="app-main" id="main-content" tabIndex={-1}>
                <div className="app-content-wrapper app-shell-container">
                    {!isSupabaseConfigured && (
                        <div className="app-shell-notice" role="status" aria-live="polite">
                            <strong>Supabase não configurado.</strong>
                            <span>
                                {' '}
                                {supabaseConfigErrorMessage} Recursos em nuvem permanecem desativados.
                            </span>
                        </div>
                    )}
                    {children}
                </div>
                <footer className="app-footer app-shell-container">
                    <span>Prompt App • Engenharia de Prompts</span>
                    <nav className="app-footer__links" aria-label="Links informativos">
                        <a href="/sobre">Sobre</a>
                        <a href="/contato">Contato</a>
                        <a href="/privacidade">Privacidade</a>
                        <a href="https://github.com/danilonovaisv/PROMPT-APP" target="_blank" rel="noopener noreferrer">GitHub</a>
                    </nav>
                </footer>
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
