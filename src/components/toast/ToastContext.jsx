"use client";
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, opts = {}) => {
    const id = Math.random().toString(36).slice(2, 9);
    const t = { id, msg, ...opts };
    setToasts((s) => [...s, t]);
    if (!opts.persistent) {
      setTimeout(() => {
        setToasts((s) => s.filter((x) => x.id !== id));
      }, opts.duration || 3000);
    }
    return id;
  }, []);

  const remove = useCallback((id) => setToasts((s) => s.filter((x) => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      {/* Contenedor de Toasts: Fixed y sin bloquear clics en el resto de la pantalla */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full p-4">
        {toasts.map((t) => {
          const isError = t.type === 'error';
          const isSuccess = t.type === 'success';
          
          // Clases base para la tarjeta del toast
          let classes = "pointer-events-auto px-5 py-4 rounded-xl shadow-xl font-bold text-sm transition-all animate-in slide-in-from-right-12 fade-in duration-300 flex items-center gap-3 border";
          
          // Estilos dinámicos según el tipo
          if (isError) {
             classes += " bg-[var(--accent-error)] text-white border-transparent";
          } else if (isSuccess) {
             classes += " bg-[var(--accent-success)] text-white border-transparent";
          } else {
             // Default / Info: Usa los colores del tema actual (fondo tarjeta, texto principal)
             classes += " bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border)]";
          }

          return (
            <div key={t.id} className={classes} role="alert">
              <span className="text-lg">
                {isError ? '⚠️' : isSuccess ? '✅' : 'ℹ️'}
              </span>
              <span>{t.msg}</span>
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

export default ToastContext;