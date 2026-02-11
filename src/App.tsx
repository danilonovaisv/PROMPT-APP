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

export default function App() {
    const [showImportExport, setShowImportExport] = useState(false);

    useEffect(() => {
        // Realizar backup inicial silencioso após o mount
        saveLocalBackup();
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
