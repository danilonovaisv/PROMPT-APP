/* ======================================================
   Componente de Sincronização em Nuvem (Supabase)
   ====================================================== */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { syncToCloud, downloadFromCloud } from '@/services/syncService';
import { useToast } from '@/context/ToastContext';
import { Cloud, CloudOff, RefreshCw, LogIn, LogOut, User } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

export default function CloudSyncItem() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        // 1. Check session on mount
        supabase.auth.getSession().then(({ data: { session: currentSession } }: any) => {
            setSession(currentSession);
            if (currentSession) {
                triggerAutoSync();
            }
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, newSession: Session | null) => {
            setSession(newSession);
            // Se acabou de logar (newSession exists), trigger sync
            if (newSession && !session) {
                triggerAutoSync();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

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

    const handleSync = async () => {
        if (!session) return;
        setLoading(true);
        try {
            await syncToCloud();
            showToast('Backup na nuvem realizado com sucesso!', 'success');
        } catch (err: any) {
            showToast('Erro ao sincronizar: ' + err.message, 'error');
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

            <div className="cloud-sync-box__actions">
                <button
                    className="btn btn--secondary btn--sm flex-1"
                    onClick={handleSync}
                    disabled={loading}
                >
                    {loading ? <RefreshCw size={12} className="animate-spin" /> : <Cloud size={12} />}
                    Backup
                </button>
                <button
                    className="btn btn--ghost btn--sm flex-1"
                    onClick={handleRestore}
                    disabled={loading}
                >
                    Baixar
                </button>
            </div>
        </div>
    );
}
