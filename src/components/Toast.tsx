import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { CheckIcon, XIcon, AlertIcon, InfoIcon } from './icons';
import { ToastContext, type Toast, type ToastType } from '../hooks/useToast';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const warning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm w-full px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const styles = {
    success: 'bg-success/10 border-success text-success',
    error: 'bg-error/10 border-error text-error',
    warning: 'bg-warning/10 border-warning text-warning',
    info: 'bg-navy-500/10 border-navy-500 text-navy-800',
  };

  const icons = {
    success: CheckIcon,
    error: XIcon,
    warning: AlertIcon,
    info: InfoIcon,
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg
        bg-white backdrop-blur-sm
        animate-slide-in-right
        ${styles[toast.type]}
      `}
    >
      <Icon className="shrink-0 mt-0.5" size={20} />
      <p className="flex-1 text-sm font-medium text-slate-900">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 shrink-0"
        aria-label="Dismiss"
      >
        <XIcon size={16} />
      </button>
    </div>
  );
}
