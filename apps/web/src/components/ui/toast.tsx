'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback(
    (title: string, description?: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, title, description, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            aria-live="polite"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border p-3.5 shadow-lg bg-card text-card-foreground transition-all duration-200 animate-in slide-in-from-bottom-5',
              item.type === 'success' && 'border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/40',
              item.type === 'error' && 'border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/40',
              item.type === 'info' && 'border-sky-500/30 bg-sky-50/90 dark:bg-sky-950/40',
            )}
          >
            <div className="shrink-0 mt-0.5">
              {item.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              {item.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
              {item.type === 'info' && <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />}
            </div>
            <div className="flex-1 space-y-0.5 min-w-0">
              <p className="text-xs font-semibold text-foreground leading-snug">{item.title}</p>
              {item.description && (
                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
              aria-label="Close notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    return {
      toast: () => {},
    };
  }
  return context;
}
