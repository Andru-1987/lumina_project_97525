import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const styles = {
    success: {
      container: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      icon: <CheckCircle size={18} className="text-emerald-500 shrink-0" />,
    },
    error: {
      container: 'bg-red-50 text-red-800 border border-red-200',
      icon: <AlertCircle size={18} className="text-red-500 shrink-0" />,
    },
    info: {
      container: 'bg-sky-50 text-sky-800 border border-sky-200',
      icon: <Info size={18} className="text-sky-500 shrink-0" />,
    },
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[1080] flex flex-col gap-2.5 pointer-events-none" role="region" aria-label="Notifications">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-elevated animate-slide-down ${styles[toast.type].container}`}
            style={{ minWidth: '300px', maxWidth: '440px' }}
          >
            {styles[toast.type].icon}
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="ml-auto shrink-0 w-6 h-6 rounded-md flex items-center justify-center hover:bg-black/5 transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};