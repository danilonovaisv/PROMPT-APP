/* ======================================================
   Componente de Sincronização em Nuvem (Supabase)
   ====================================================== */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { syncToCloud, downloadFromCloud } from '@/services/syncService';
import { smartSync, checkForUpdates } from '@/services/assetManager';
import { useToast } from '@/context/ToastContext';
import { Cloud, CloudOff, RefreshCw, LogIn, LogOut, User } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

export default function CloudSyncItem() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasUpdates, setHasUpdates] = useState(false);
    const [realtimeActive, setRealtimeActive] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        // 1. Check session on mount
        supabase.auth.getSession().then(({ data: { session: currentSession } }: any) => {
            setSession(currentSession);
            if (currentSession) {
                triggerAutoSync();
                checkForUpdatesStatus();
            }
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, newSession: Session | null) => {
            setSession(newSession);
            // Se acabou de logar (newSession exists), trigger sync
            if (newSession && !session) {
                triggerAutoSync();
                checkForUpdatesStatus();
            }
            setRealtimeActive(!!newSession);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Verificar periodicamente se há atualizações
    useEffect(() => {
        if (!session) return;
        
        const interval = setInterval(() => {
            checkForUpdatesStatus();
        }, 30000); // Checar a cada 30 segundos
        
        return () => clearInterval(interval);
    }, [session]);

    // Função de Auto-Sync separada para não causar loops ou re-renders desnecessários
    const triggerAutoSync = async () => {
        console.log("🔄 Auto-Sync: Iniciando sincronização inteligente...");
        setLoading(true);
        try {
            // Primeiro puxamos da nuvem (Smart Merge) para garantir que temos tudo
            await downloadFromCloud();
            // Opcional: Poderíamos fazer upload logo sem seguida para garantir consistência total
            // await syncToCloud(); 
            showToast('Sincronizado com a nuvem', 'success');
        } catch (err) {
            console.error("Auto-sync failed:", err);
            // Não mostramos toast de erro no auto-sync para não atrapalhar a UX inicial, apenas log
        } finally {
            setLoading(false);
        }
    };

    // Verifica se há atualizações disponíveis
    const checkForUpdatesStatus = async () => {
        try {
            const updatesAvailable = await checkForUpdates();
            setHasUpdates(updatesAvailable);
        } catch (error) {
            console.error('Erro ao verificar atualizações:', error);
        }
    };

    const handleLogin = async () => {
        // Para simplificar, usamos o login via Email (o usuário precisará configurar no Supabase)
        // Se quiser Google/Github, adicione o parâmetro provider
        const email = window.prompt('Digite seu email para login:');
        if (!email) return;

        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
            showToast('Erro ao enviar link de login: ' + error.message, 'error');
        } else {
            showToast('Link de login enviado para o seu email!');
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        showToast('Logout realizado');
    };

    const handleSmartSync = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const result = await smartSync();
            const message = `Sync inteligente concluído! Recebidos: ${result.pulled}, Enviados: ${result.pushed}, Conflitos: ${result.conflicts}`;
            showToast(message, 'success');
            setHasUpdates(false);
        } catch (err: any) {
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
        } catch (err: any) {
            showToast('Erro ao restaurar: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return (
            <button className="app-sidebar__nav-item" onClick={handleLogin}>
                <CloudOff size={18} />
                <span>Nuvem Desconectada</span>
                <LogIn size={14} className="app-sidebar__nav-item-icon--suffix" />
            </button>
        );
    }

    return (
        <div className="cloud-sync-box">
            <div className="cloud-sync-box__user">
                <User size={14} />
                <span className="truncate">{session.user.email}</span>
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
    );
}
