import { useState, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import Layout from '@/components/Layout';
import ImportExportModal from '@/components/ImportExportModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { saveLocalBackup } from '@/utils/backupManager';
import { seedDatabase } from '@/db/database';
import { setupAutoSync } from '@/services/autoSync';
import { setupRealtimeListeners, cleanupRealtimeListeners } from '@/services/realtimeService';
import { syncToCloud } from '@/services/syncService';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

// Lazy-loaded pages for code splitting
const HomePage = lazy(() => import('@/pages/HomePage'));
const CategoryPage = lazy(() => import('@/pages/CategoryPage'));
const CategoryManagerPage = lazy(() => import('@/pages/CategoryManagerPage'));
const EditorPage = lazy(() => import('@/pages/EditorPage'));
const MenuManagerPage = lazy(() => import('@/pages/MenuManagerPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));

function LoadingFallback() {
  return (
    <div className="loading-fallback">
      <div className="loading-spinner" />
      <p>Carregando...</p>
    </div>
  );
}

export default function App() {
  const [showImportExport, setShowImportExport] = useState(false);

  useEffect(() => {
    const init = async () => {
      await seedDatabase();
      setTimeout(() => {
        saveLocalBackup();
      }, 2000);
      setupAutoSync();
      if (isSupabaseConfigured) {
        try {
          await setupRealtimeListeners();
        } catch (error) {
          console.error('❌ Erro ao iniciar realtime:', error);
        }
      }
    };

    init();

    return () => {
      cleanupRealtimeListeners();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);
      
      if (session) {
        try {
          await setupRealtimeListeners();
          await syncToCloud();
        } catch (error) {
          console.error('❌ Erro ao reiniciar realtime após login:', error);
        }
      } else {
        cleanupRealtimeListeners();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <ErrorBoundary>
          <Layout onOpenImportExport={() => setShowImportExport(true)}>
            <Suspense fallback={<LoadingFallback />}>
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
            </Suspense>
          </Layout>
          <ImportExportModal
            isOpen={showImportExport}
            onClose={() => setShowImportExport(false)}
          />
        </ErrorBoundary>
      </ToastProvider>
    </BrowserRouter>
  );
}
