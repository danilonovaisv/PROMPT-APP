/* ======================================================
   Toast Context — notificações do sistema
   ====================================================== */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

/* eslint-disable react-refresh/only-export-components */

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

const MAX_TOASTS = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = nextId++;
        setToasts((prev) => {
            const next = [...prev, { id, message, type }];
            return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next;
        });
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const iconMap = {
        success: <CheckCircle size={16} />,
        error: <AlertCircle size={16} />,
        info: <Info size={16} />,
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* A11y Audit Fix #15: aria-live region for screen reader announcements */}
            <div
                className="toast-container"
                aria-live="polite"
                aria-atomic="false"
                role="status"
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast toast--${toast.type}`}
                        role={toast.type === 'error' ? 'alert' : undefined}
                    >
                        {iconMap[toast.type]}
                        <span>{toast.message}</span>
                        <button
                            className="btn btn--ghost btn--icon toast__close-btn"
                            onClick={() => removeToast(toast.id)}
                            aria-label="Fechar notificação"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider');
    return ctx;
}
