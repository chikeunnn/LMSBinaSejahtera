'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const icons = { success: CheckCircle, error: AlertCircle, warning: AlertCircle, info: Info };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => {
          const Icon = icons[t.type] || Info;
          const colors = { success: 'var(--success)', error: 'var(--error)', warning: 'var(--warning)', info: 'var(--primary)' };
          return (
            <div key={t.id} className={`toast ${t.type}`}>
              <Icon size={18} color={colors[t.type]} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                {t.title && <div className="toast-title">{t.title}</div>}
                <div className="toast-message">{t.message}</div>
              </div>
              <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
