import { useRef, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { useAccessibleModal } from '@/hooks/useAccessibleModal';
import { supabase } from '@/lib/supabase';
import { X, Mail, Lock, LogIn, UserPlus, KeyRound } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const { showToast } = useToast();
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useAccessibleModal({
        isOpen,
        onClose,
        containerRef: modalRef,
        initialFocusRef: closeButtonRef,
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                showToast('Login realizado com sucesso!', 'success');
                onClose();
            } else if (mode === 'register') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                showToast('Conta criada! Você já pode fazer login.', 'success');
                setMode('login');
            } else if (mode === 'forgot') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin,
                });
                if (error) throw error;
                showToast('Link de recuperação enviado para o email!', 'success');
                onClose();
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                ref={modalRef}
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '400px' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-modal-title"
                tabIndex={-1}
            >
                <div className="modal__header">
                    <h2 id="auth-modal-title">
                        {mode === 'login' ? 'Login' : mode === 'register' ? 'Criar Conta' : 'Recuperar Senha'}
                    </h2>
                    <button
                        ref={closeButtonRef}
                        className="btn btn--ghost btn--icon"
                        onClick={onClose}
                        aria-label="Fechar modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="modal__body">
                    <form onSubmit={handleSubmit} className="form-section">
                        <div className="form-group">
                            <label>Email</label>
                            <div className="input-with-icon">
                                <Mail size={16} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {mode !== 'forgot' && (
                            <div className="form-group">
                                <label>Senha</label>
                                <div className="input-with-icon">
                                    <Lock size={16} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Sua senha"
                                        required
                                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn--primary btn--lg w-full mt-4"
                            disabled={loading}
                        >
                            {loading ? (
                                'Aguarde...'
                            ) : mode === 'login' ? (
                                <><LogIn size={18} /> Entrar</>
                            ) : mode === 'register' ? (
                                <><UserPlus size={18} /> Cadastrar</>
                            ) : (
                                <><KeyRound size={18} /> Enviar link de recuperação</>
                            )}
                        </button>

                        <div className="flex gap-2 mt-4 justify-center text-sm" style={{flexDirection: 'column', alignItems: 'center'}}>
                            {mode === 'login' ? (
                                <>
                                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setMode('register')}>
                                        Ainda não tem conta? Cadastre-se
                                    </button>
                                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setMode('forgot')}>
                                        Esqueceu a senha?
                                    </button>
                                </>
                            ) : (
                                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setMode('login')}>
                                    Já tem uma conta? Faça login
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
