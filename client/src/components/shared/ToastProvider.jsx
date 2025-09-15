import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext({ toast: () => {} });

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    const duration = typeof opts.duration === 'number' ? opts.duration : 2500;
    setToasts((t) => [...t, { id, message }]);
    if (duration > 0) {
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
    }
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="bg-gray-900 text-white text-sm px-3 py-2 rounded shadow-lg opacity-95 pointer-events-auto">
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
