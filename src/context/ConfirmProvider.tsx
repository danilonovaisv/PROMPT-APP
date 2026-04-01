/* ======================================================
   ConfirmProvider — componente de contexto (Audit Fix #12)
   Modal de confirmação acessível para substituir confirm() nativo
   ====================================================== */

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { AlertTriangle } from 'lucide-react';
import { ConfirmContext, type ConfirmOptions } from './ConfirmContext';

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      triggerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setState({ ...opts, resolve });
    });
  }, []);

  const handleResponse = useCallback(
    (value: boolean) => {
      state?.resolve(value);
      setState(null);
      setTimeout(() => triggerRef.current?.focus(), 0);
    },
    [state],
  );

  // Focus trap + Escape key
  useEffect(() => {
    if (!state) return;
    setTimeout(() => confirmBtnRef.current?.focus(), 0);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleResponse(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [state, handleResponse]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div
          className="modal-overlay confirm-overlay"
          onClick={() => handleResponse(false)}
          aria-hidden="false"
        >
          <div
            className="modal confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__header">
              <div className="confirm-modal__icon-title">
                <AlertTriangle
                  size={20}
                  className={`confirm-modal__icon confirm-modal__icon--${state.variant ?? 'danger'}`}
                  aria-hidden="true"
                />
                <h2 id="confirm-title" className="modal__title">
                  {state.title ?? 'Confirmar ação'}
                </h2>
              </div>
            </div>

            <div className="modal__body">
              <p id="confirm-message" className="confirm-modal__message">
                {state.message}
              </p>
            </div>

            <div className="modal__footer">
              <button
                className="btn btn--secondary"
                onClick={() => handleResponse(false)}
              >
                {state.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                ref={confirmBtnRef}
                className={`btn btn--${state.variant === 'danger' ? 'danger' : 'primary'}`}
                onClick={() => handleResponse(true)}
              >
                {state.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
