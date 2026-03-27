/* ======================================================
   ConfirmContext — apenas criação do contexto e tipos
   Separado de ConfirmProvider por exigência do react-refresh
   ====================================================== */

import { createContext } from 'react';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

export const ConfirmContext = createContext<ConfirmContextValue | null>(null);
