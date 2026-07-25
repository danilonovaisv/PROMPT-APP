/* ======================================================
   Layout — Shell com sidebar e área principal
   ====================================================== */

import { useState, useEffect, useMemo } from 'react';
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
    WifiOff,
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
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const categories = useLiveQuery(() => db.categories.filter(c => !c.isDeleted).toArray()) ?? [];
    const rawPrompts = useLiveQuery(() => db.prompts.filter(p => !p.isDeleted).toArray());
    const prompts = useMemo(() => rawPrompts ?? [], [rawPrompts]);

    const promptCountByCategory = useMemo(() => {
        const map = new Map<number, number>();
        for (const p of prompts) {
            map.set(p.categoryId, (map.get(p.categoryId) || 0) + 1);
        }
        return map;
    }, [prompts]);

    const naVITEmClass = ({ isActive }: { isActive: boolean }) =>
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
                aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={sidebarOpen}
                aria-controls="app-sidebar"
            >
                {sidebarOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>

            {/* Sidebar */}
            <aside
                id="app-sidebar"
                className={`app-sidebar ${sidebarOpen ? 'app-sidebar--open' : ''}`}
            >
                <div className="app-sidebar__logo">
                    <Sparkles size={24} color="#0048ff" aria-hidden="true" />
                    <div className="app-sidebar__logo-text">Prompt App</div>
                </div>

                <nav className="app-sidebar__nav">
                    {/* Navegação principal */}
                    <NavLink
                        to="/"
                        className={naVITEmClass}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <Home size={18} aria-hidden="true" />
                        Início
                    </NavLink>

                    <NavLink
                        to="/categorias"
                        className={naVITEmClass}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <FolderPlus size={18} aria-hidden="true" />
                        Categorias
                    </NavLink>

                    <NavLink
                        to="/menus"
                        className={naVITEmClass}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <Layers size={18} aria-hidden="true" />
                        Menus do Template
                    </NavLink>

                    {/* Categorias */}
                    <div className="app-sidebar__section-title">Categorias</div>
                    {categories.map((cat) => {
                        const count = promptCountByCategory.get(cat.id!) || 0;
                        return (
                            <NavLink
                                key={cat.id}
                                to={`/categoria/${cat.id}`}
                                className={naVITEmClass}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span>{cat.icon}</span>
                                {cat.name}
                                {count > 0 && (
                                    <span className="app-sidebar__count-badge">{count}</span>
                                )}
                            </NavLink>
                        );
                    })}

                    {/* Ações */}
                    <div className="app-sidebar__section-title">Ações</div>

                    <CloudSyncItem />

                    <button className="app-sidebar__nav-item" onClick={onOpenImportExport}>
                        <Upload size={18} aria-hidden="true" />
                        Importar Templates
                    </button>
                    <button
                        className="app-sidebar__nav-item"
                        onClick={() => downloadAllPrompts()}
                    >
                        <Download size={18} aria-hidden="true" />
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
                    {isOffline && (
                        <div className="app-shell-notice app-shell-notice--offline" role="alert" aria-live="assertive">
                            <WifiOff size={18} className="app-shell-notice-icon" />
                            <strong>Você está offline.</strong>
                            <span>{' '}Alterações serão salvas localmente e sincronizadas quando houver conexão.</span>
                        </div>
                    )}
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
                        <NavLink to="/sobre">Sobre</NavLink>
                        <NavLink to="/contato">Contato</NavLink>
                        <NavLink to="/privacidade">Privacidade</NavLink>
                    </nav>
                </footer>
            </main>

            {/* Overlay para mobile */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'sidebar-overlay--active' : ''}`}
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
            />
        </div>
    );
}
