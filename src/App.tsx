/* ======================================================
   App.tsx — Roteamento principal
   ====================================================== */

import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import Layout from '@/components/Layout';
import ImportExportModal from '@/components/ImportExportModal';
import HomePage from '@/pages/HomePage';
import CategoryPage from '@/pages/CategoryPage';
import CategoryManagerPage from '@/pages/CategoryManagerPage';
import EditorPage from '@/pages/EditorPage';
import MenuManagerPage from '@/pages/MenuManagerPage';
import { useEffect } from 'react';
import { saveLocalBackup } from '@/utils/backupManager';
import { seedDatabase } from '@/db/database';
import { setupAutoSync } from '@/services/autoSync';

export default function App() {
    const [showImportExport, setShowImportExport] = useState(false);

    useEffect(() => {
        const init = async () => {
            // 1. Garantir que o banco está seedado
            await seedDatabase();

            // 2. Realizar backup inicial apenas se houver algo para salvar
            // Isso evita que um erro de carregamento sobrescreva o backup do localStorage com vazio
            setTimeout(() => {
                saveLocalBackup();
            }, 2000); // Delay para garantir hidratação completa

            // 3. Inicializar Auto-Sync (Push)
            setupAutoSync();
        };

        init();
    }, []);

    return (
        <BrowserRouter>
            <ToastProvider>
                <Layout onOpenImportExport={() => setShowImportExport(true)}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/categoria/:id" element={<CategoryPage />} />
                        <Route path="/categorias" element={<CategoryManagerPage />} />
                        <Route path="/editor/:id" element={<EditorPage />} />
                        <Route path="/menus" element={<MenuManagerPage />} />
                    </Routes>
                </Layout>
                <ImportExportModal
                    isOpen={showImportExport}
                    onClose={() => setShowImportExport(false)}
                />
            </ToastProvider>
        </BrowserRouter>
    );
}
