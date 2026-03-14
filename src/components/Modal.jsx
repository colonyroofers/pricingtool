import React, { useEffect } from 'react';
import { C } from '../utils/constants';

export default function Modal({ isOpen, title, children, onClose, width = 600 }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(17, 29, 53, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: C.white,
        borderRadius: 16,
        maxWidth: width,
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: `1px solid ${C.gray200}`,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: C.gray400,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
