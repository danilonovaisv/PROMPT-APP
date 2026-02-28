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
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import PrivacyPage from '@/pages/PrivacyPage';
import { useEffect } from 'react';
import { saveLocalBackup } from '@/utils/backupManager';
import { seedDatabase } from '@/db/database';
import { setupAutoSync } from '@/services/autoSync';
import { setupRealtimeListeners, cleanupRealtimeListeners } from '@/services/realtimeService';
import { syncToCloud } from '@/services/syncService';
import { supabase } from '@/lib/supabase';

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

            // 4. Inicializar Realtime Listeners
            try {
                await setupRealtimeListeners();
            } catch (error) {
                console.error('❌ Erro ao iniciar realtime:', error);
            }
        };

        init();

        // Cleanup ao desmontar
        return () => {
            cleanupRealtimeListeners();
        };
    }, []);

    // Listener para mudanças de autenticação
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 Auth state changed:', event);
            
            if (session) {
                // Usuário logado - ativar realtime
                try {
                    await setupRealtimeListeners();
                    await syncToCloud();
                } catch (error) {
                    console.error('❌ Erro ao reiniciar realtime após login:', error);
                }
            } else {
                // Usuário deslogado - limpar listeners
                cleanupRealtimeListeners();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <BrowserRouter>
            <ToastProvider>
                <Layout onOpenImportExport={() => setShowImportExport(true)}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/sobre" element={<AboutPage />} />
                        <Route path="/contato" element={<ContactPage />} />
                        <Route path="/privacidade" element={<PrivacyPage />} />
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
