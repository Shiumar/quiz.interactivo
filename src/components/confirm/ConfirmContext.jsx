"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [modal, setModal] = useState(null);

  const confirm = useCallback((message, opts = {}) => {
    return new Promise((resolve) => {
      setModal({ message, opts, resolve });
    });
  }, []);

  const handle = (val) => {
    if (!modal) return;
    try { modal.resolve(val); } catch (e) {}
    setModal(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modal && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', zIndex: 10000 }}>
          <div style={{ background: '#fff', padding: '1rem 1.25rem', borderRadius: 8, width: 420, maxWidth: '92%' }}>
            <div style={{ marginBottom: '1rem', color: '#111' }}>{modal.message}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => handle(false)} style={{ padding: '0.5rem 0.75rem' }}>Cancelar</button>
              <button onClick={() => handle(true)} style={{ padding: '0.5rem 0.75rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}

export default ConfirmContext;
