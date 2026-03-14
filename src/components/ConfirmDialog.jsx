import { useEffect, useCallback } from 'react';

export default function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', cancelLabel = 'Cancel', confirmColor = '#DC2626', onConfirm, onCancel }) {
  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && open) onCancel?.();
  }, [open, onCancel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div className="dialog-panel" onClick={(e) => e.stopPropagation()}>
        {title && <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#252842' }}>{title}</h3>}
        <p style={{ margin: '0 0 24px', fontSize: 15, color: '#6B7280', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={onConfirm} className="pressable" style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: confirmColor, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>{confirmLabel}</button>
          <button onClick={onCancel} className="pressable" style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#F3F4F6', color: '#374151', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>{cancelLabel}</button>
        </div>
      </div>
    </div>
  );
}
