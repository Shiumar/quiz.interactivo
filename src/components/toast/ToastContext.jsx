"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

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
      <div style={{ position: 'fixed', right: 16, top: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ background: t.type === 'error' ? '#fee2e2' : t.type === 'success' ? '#d1fae5' : '#eef2ff', color: t.type === 'error' ? '#991b1b' : '#063f17', padding: '0.6rem 0.9rem', borderRadius: 8, boxShadow: '0 4px 14px rgba(2,6,23,0.08)' }}>
            {t.msg}
          </div>
        ))}
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
