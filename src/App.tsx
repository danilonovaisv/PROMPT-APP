import { useState, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmProvider } from '@/context/ConfirmProvider';
import Layout from '@/components/Layout';
import ImportExportModal from '@/components/ImportExportModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SkeletonEditor } from '@/components/SkeletonLoader';
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

// Fix #10: Suspense fallback contextual usando SkeletonEditor ao invés de spinner genérico
// Páginas individuais usam SkeletonCategoryGrid/SkeletonPromptList diretamente
function LoadingFallback() {
  return <SkeletonEditor />;
}

export default function App() {
  const [showImportExport, setShowImportExport] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Dynamic imports for services to keep main bundle light
      const { seedDatabase } = await import('@/db/database');
      const { saveLocalBackup } = await import('@/utils/backupManager');
      const { setupAutoSync } = await import('@/services/autoSync');

      await seedDatabase();
      setTimeout(() => {
        saveLocalBackup();
      }, 2000);
      setupAutoSync();

      if (isSupabaseConfigured) {
        try {
          const { setupRealtimeListeners } = await import('@/services/realtimeService');
          await setupRealtimeListeners();
        } catch (error) {
          console.error('❌ Erro ao iniciar realtime:', error);
        }
      }
    };

    init();

    return () => {
      import('@/services/realtimeService').then(m => m.cleanupRealtimeListeners());
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
          const { setupRealtimeListeners } = await import('@/services/realtimeService');
          const { syncToCloud } = await import('@/services/syncService');
          await setupRealtimeListeners();
          await syncToCloud();
        } catch (error) {
          console.error('❌ Erro ao reiniciar realtime após login:', error);
        }
      } else {
        import('@/services/realtimeService').then(m => m.cleanupRealtimeListeners());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
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
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
