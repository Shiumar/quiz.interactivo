"use client";
import { createContext, useContext, useState, useCallback } from 'react';

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
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[9999] backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100 border border-[var(--border)]">
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-4">Confirmación</h3>
            <p className="mb-8 text-base text-[var(--text-muted)] font-medium leading-relaxed">
              {modal.message}
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => handle(false)} 
                className="px-5 py-2.5 rounded-xl font-bold text-[var(--text-muted)] hover:bg-[var(--secondary)] transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handle(true)} 
                className="px-5 py-2.5 bg-[var(--primary)] text-white font-bold rounded-xl hover:bg-[var(--primary-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm"
              >
                Confirmar
              </button>
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