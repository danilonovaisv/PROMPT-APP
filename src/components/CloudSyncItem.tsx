/* ======================================================
   Componente de Sincronização em Nuvem (Supabase)
   ====================================================== */

import { useState, useCallback } from 'react';
import { isSupabaseConfigured, supabase, supabaseConfigErrorMessage } from '@/lib/supabase';
import { smartSync } from '@/services/assetManager';
import { useToast } from '@/context/ToastContext';
import { Cloud, CloudOff, RefreshCw, LogIn, LogOut, User, KeyRound } from 'lucide-react';
import AuthModal from './AuthModal';
import { useConfirm } from '@/hooks/useConfirm';
import { useCloudSync } from '@/hooks/useCloudSync';

export default function CloudSyncItem() {
    const [loading, setLoading] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'update-password'>('login');
    const { showToast } = useToast();
    const confirm = useConfirm();
    const {
        session,
        hasUpdates,
        isOffline,
        realtimeActive,
        sessionNotice,
        refreshUpdates,
        clearUpdates,
        registerManualLogout,
    } = useCloudSync();
    const configHintId = 'cloud-sync-config-hint';

    const checkForUpdatesStatus = useCallback(async () => {
        try {
            await refreshUpdates();
        } catch (error) {
            console.error('Erro ao verificar atualizações:', error);
        }
    }, [refreshUpdates]);

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
        registerManualLogout();
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
            clearUpdates();
            await checkForUpdatesStatus();
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Erro desconhecido';
            showToast('Erro no sync inteligente: ' + errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!session) return;
        const shouldRestore = await confirm({
            title: 'Substituir dados locais',
            message: 'Isso irá substituir todos os dados locais pelos dados da nuvem. Continuar?',
            confirmLabel: 'Substituir',
            cancelLabel: 'Cancelar',
            variant: 'danger',
        });
        if (!shouldRestore) return;

        setLoading(true);
        try {
            const { downloadFromCloud } = await import('@/services/syncService');
            await downloadFromCloud();
            showToast('Dados restaurados da nuvem!', 'success');
            await checkForUpdatesStatus();
            window.location.reload();
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Erro desconhecido';
            showToast('Erro ao restaurar: ' + errorMessage, 'error');
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
                key={authModalMode}
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authModalMode}
            />
        )}
        </>
    );
}
