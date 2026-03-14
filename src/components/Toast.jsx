import { useState, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 80, right: 16, left: 16,
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <div key={toast.id} className="animate-slide-up" style={{
            pointerEvents: 'auto', padding: '12px 16px', borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 14, fontWeight: 500,
            maxWidth: 320, marginLeft: 'auto',
            background: toast.type === 'success' ? '#059669' : toast.type === 'error' ? '#DC2626' : toast.type === 'warning' ? '#D97706' : '#252842',
            color: '#fff',
          }} onClick={() => removeToast(toast.id)}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
