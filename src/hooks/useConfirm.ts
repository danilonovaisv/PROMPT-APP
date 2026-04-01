/* useConfirm — Audit Fix #12 */
import { useContext } from 'react';
import { ConfirmContext } from '@/context/ConfirmContext';

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm deve ser usado dentro de ConfirmProvider');
  return ctx.confirm;
}
