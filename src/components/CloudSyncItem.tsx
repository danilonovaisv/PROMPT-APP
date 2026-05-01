/* ======================================================
   Componente de Sincronização em Nuvem (Supabase)
   ====================================================== */

import { useState, useEffect, useRef, useCallback } from 'react';
import { isSupabaseConfigured, supabase, supabaseConfigErrorMessage } from '@/lib/supabase';
import { downloadFromCloud } from '@/services/syncService';
import { smartSync, checkForUpdates } from '@/services/assetManager';
import { useToast } from '@/context/ToastContext';
import { Cloud, CloudOff, RefreshCw, LogIn, LogOut, User, KeyRound } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import AuthModal from './AuthModal';

export default function CloudSyncItem() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasUpdates, setHasUpdates] = useState(false);
    const [realtimeActive, setRealtimeActive] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'update-password'>('login');
    const [isOffline, setIsOffline] = useState(() =>
        typeof navigator !== 'undefined' ? !navigator.onLine : false
    );
    const [sessionNotice, setSessionNotice] = useState<string | null>(null);
    const { showToast } = useToast();
    const configHintId = 'cloud-sync-config-hint';
    const manualLogoutRef = useRef(false);

    // Declarações ANTES dos useEffects para evitar TDZ nos closures
    // (const não são hoisted; devem aparecer antes do primeiro uso no código-fonte)
    const triggerAutoSync = useCallback(async () => {
        console.log("🔄 Auto-Sync: Iniciando sincronização inteligente...");
        setLoading(true);
        try {
            await downloadFromCloud();
            showToast('Sincronizado com a nuvem', 'success');
        } catch (err) {
            console.error('Auto-sync failed:', err);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const checkForUpdatesStatus = useCallback(async () => {
        try {
            const updatesAvailable = await checkForUpdates();
            setHasUpdates(updatesAvailable);
        } catch (error) {
            console.error('Erro ao verificar atualizações:', error);
        }
    }, []);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            return;
        }

        // 1. Check session on mount
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setSession(currentSession);
            if (currentSession) {
                triggerAutoSync();
                checkForUpdatesStatus();
            }
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, newSession: Session | null) => {
            setSession((currentSession) => {
                if (!newSession && currentSession && !manualLogoutRef.current && event !== 'INITIAL_SESSION') {
                    setSessionNotice('Sua sessão expirou. Faça login novamente para continuar sincronizando.');
                }
                if (newSession) {
                    setSessionNotice(null);
                }
                if (!newSession && manualLogoutRef.current) {
                    manualLogoutRef.current = false;
                }
                return newSession;
            });
            // Se acabou de logar (newSession exists), trigger sync
            if (newSession && !session) {
                triggerAutoSync();
                checkForUpdatesStatus();
            }
            setRealtimeActive(!!newSession);
        });

        return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    // Verificar periodicamente se há atualizações
    useEffect(() => {
        if (!session) return;

        const interval = setInterval(() => {
            checkForUpdatesStatus();
        }, 30000); // Checar a cada 30 segundos

        return () => clearInterval(interval);
    }, [session, checkForUpdatesStatus]);

    if (!isSupabaseConfigured) {
        return (
            <div className="cloud-sync-unavailable" aria-live="polite">
                <button
                    type="button"
                    className="app-sidebar__nav-item app-sidebar__nav-item--disabled"
                    disabled
                    aria-describedby={configHintId}
                >
                    <CloudOff size={18} />
                    <span>Nuvem indisponível</span>
                </button>
                <p id={configHintId} className="app-sidebar__helper-text">
                    {supabaseConfigErrorMessage}
                </p>
            </div>
        );
    }

    const handleLogin = () => {
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
    };

    const handleLogout = async () => {
        manualLogoutRef.current = true;
        setSessionNotice(null);
        await supabase.auth.signOut();
        showToast('Logout realizado');
    };

    const handleChangePassword = () => {
        setAuthModalMode('update-password');
        setIsAuthModalOpen(true);
    };

    const handleSmartSync = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const result = await smartSync();
            const message = `Sync inteligente concluído! Recebidos: ${result.pulled}, Enviados: ${result.pushed}, Conflitos: ${result.conflicts}`;
            showToast(message, 'success');
            setHasUpdates(false);
        } catch (e: unknown) {
        const err = e as Error;
            showToast('Erro no sync inteligente: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!session) return;
        if (!confirm('Isso irá substituir todos os dados locais pelos dados da nuvem. Continuar?')) return;

        setLoading(true);
        try {
            await downloadFromCloud();
            showToast('Dados restaurados da nuvem!', 'success');
            window.location.reload();
        } catch (e: unknown) {
        const err = e as Error;
            showToast('Erro ao restaurar: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const statusBanner = isOffline
        ? {
            tone: 'warning',
            message: 'Você está offline. Suas alterações continuam locais e serão sincronizadas ao reconectar.',
        }
        : sessionNotice
            ? {
                tone: 'danger',
                message: sessionNotice,
            }
            : null;

    if (!session) {
        return (
            <>
                {statusBanner && (
                    <div
                        className={`cloud-sync-box__banner cloud-sync-box__banner--${statusBanner.tone}`}
                        role="alert"
                        aria-live="assertive"
                    >
                        {statusBanner.message}
                    </div>
                )}
                <button className="app-sidebar__nav-item" onClick={handleLogin}>
                    <CloudOff size={18} />
                    <span>Nuvem Desconectada</span>
                    <LogIn size={14} className="app-sidebar__nav-item-icon--suffix" />
                </button>
                {isAuthModalOpen && (
                    <AuthModal
                        isOpen={isAuthModalOpen}
                        onClose={() => setIsAuthModalOpen(false)}
                        initialMode={authModalMode}
                    />
                )}
            </>
        );
    }

    return (
        <>
        <div className="cloud-sync-box">
            {statusBanner && (
                <div
                    className={`cloud-sync-box__banner cloud-sync-box__banner--${statusBanner.tone}`}
                    role="alert"
                    aria-live="assertive"
                >
                    {statusBanner.message}
                </div>
            )}
            {isAuthModalOpen && (
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    initialMode={authModalMode}
                />
            )}
            <div className="cloud-sync-box__user">
                <User size={14} />
                <span className="truncate">{session.user.email}</span>
                <button onClick={handleChangePassword} title="Mudar Senha" className="btn-logout ml-auto mr-1">
                    <KeyRound size={12} />
                </button>
                <button onClick={handleLogout} title="Sair" className="btn-logout">
                    <LogOut size={12} />
                </button>
            </div>

            <div className="cloud-sync-box__status">
                <div className="cloud-sync-box__status-indicator">
                    <div className={`status-dot ${realtimeActive ? 'status-dot--active' : 'status-dot--inactive'}`}></div>
                    <span className="status-text">
                        {realtimeActive ? 'Realtime Ativo' : 'Realtime Inativo'}
                    </span>
                </div>
                {hasUpdates && (
                    <div className="updates-badge">
                        Atualizações disponíveis
                    </div>
                )}
            </div>

            <div className="cloud-sync-box__actions">
                <button
                    className="btn btn--secondary btn--sm flex-1"
                    onClick={handleSmartSync}
                    disabled={loading}
                    title="Sincronização inteligente bidirecional"
                >
                    {loading ? <RefreshCw size={12} className="animate-spin" /> : <Cloud size={12} />}
                    {hasUpdates ? 'Atualizar' : 'Sync'}
                </button>
                <button
                    className="btn btn--ghost btn--sm flex-1"
                    onClick={handleRestore}
                    disabled={loading}
                    title="Baixar todos os dados da nuvem"
                >
                    Baixar
                </button>
            </div>
        </div>
        {isAuthModalOpen && (
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authModalMode}
            />
        )}
        </>
    );
}
