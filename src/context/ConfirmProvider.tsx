/* ======================================================
   ConfirmProvider — componente de contexto (Audit Fix #12)
   Modal de confirmação acessível para substituir confirm() nativo
   ====================================================== */

import {
  useState,
  useCallback,
  useRef,
  useId,
  type ReactNode,
} from 'react';
import { AlertTriangle } from 'lucide-react';
import { ConfirmContext, type ConfirmOptions } from './ConfirmContext';
import { useAccessibleModal } from '@/hooks/useAccessibleModal';

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const messageId = useId();

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

  useAccessibleModal({
    isOpen: state !== null,
    onClose: () => handleResponse(false),
    containerRef: dialogRef,
    initialFocusRef: confirmBtnRef,
  });

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
            ref={dialogRef}
            className="modal confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={messageId}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__header">
              <div className="confirm-modal__icon-title">
                <AlertTriangle
                  size={20}
                  className={`confirm-modal__icon confirm-modal__icon--${state.variant ?? 'danger'}`}
                  aria-hidden="true"
                />
                <h2 id={titleId} className="modal__title">
                  {state.title ?? 'Confirmar ação'}
                </h2>
              </div>
            </div>

            <div className="modal__body">
              <p id={messageId} className="confirm-modal__message">
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
