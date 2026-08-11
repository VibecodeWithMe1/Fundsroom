import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          const typeStyles = {
            success: 'bg-slate-900/95 border-emerald-500/30 text-slate-100 shadow-emerald-950/20',
            error: 'bg-slate-900/95 border-red-500/30 text-slate-100 shadow-red-950/20',
            info: 'bg-slate-900/95 border-sky-500/30 text-slate-100 shadow-sky-950/20',
          }[toast.type];

          const iconColor = {
            success: 'text-emerald-400',
            error: 'text-red-400',
            info: 'text-sky-400',
          }[toast.type];

          const Icon = {
            success: CheckCircle,
            error: AlertCircle,
            info: Info,
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md pointer-events-auto transition-all duration-300 animate-in slide-in-from-right-10 ${typeStyles}`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
              <div className="flex-1 text-sm font-medium">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
