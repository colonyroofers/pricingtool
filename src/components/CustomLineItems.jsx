import { useState } from 'react';

const COMMON_ITEMS = ['Crane rental','Scaffolding','Dumpster fee','Permit fee','Overtime labor','Special access','Unusual materials','Additional flashing','Gutter replacement','Fascia/soffit repair'];

export default function CustomLineItems({ items = [], onChange, readOnly = false }) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addItem = (description = '') => {
    onChange([...items, { id: crypto.randomUUID(), description, quantity: 1, unitCost: 0, total: 0 }]);
  };

  const updateItem = (id, field, value) => {
    const updated = items.map(item => {
      if (item.id !== id) return item;
      const patched = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitCost') {
        patched.total = (parseFloat(patched.quantity) || 0) * (parseFloat(patched.unitCost) || 0);
      }
      return patched;
    });
    onChange(updated);
  };

  const removeItem = (id) => { onChange(items.filter(item => item.id !== id)); };
  const totalCustom = items.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#252842', margin: 0 }}>Custom Line Items ({items.length})</h4>
        {!readOnly && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowSuggestions(!showSuggestions)} type="button" className="pressable" style={{ padding: '6px 12px', background: '#F5F5F7', border: 'none', borderRadius: 8, fontSize: 13, color: '#252842', cursor: 'pointer' }}>Common Items</button>
            <button onClick={() => addItem()} type="button" className="pressable" style={{ padding: '6px 12px', background: '#252842', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Item</button>
          </div>
        )}
      </div>
      {showSuggestions && !readOnly && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, padding: 12, background: '#F9FAFB', borderRadius: 10 }}>
          {COMMON_ITEMS.map(name => (
            <button key={name} onClick={() => { addItem(name); setShowSuggestions(false); }} type="button" className="pressable" style={{ padding: '4px 10px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#374151' }}>{name}</button>
          ))}
        </div>
      )}
      {items.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', border: '2px dashed #E2E8F0', borderRadius: 12, color: '#9CA3AF', fontSize: 14 }}>No custom line items. Add items like crane rental, scaffolding, or permit fees.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: readOnly ? '1fr auto auto auto' : '1fr auto auto auto auto', gap: 8, alignItems: 'center', padding: 10, background: '#F9FAFB', borderRadius: 8, fontSize: 13 }}>
              {readOnly ? <span style={{ color: '#252842' }}>{item.description || '—'}</span> : <input type="text" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="Description" style={{ padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, outline: 'none', minWidth: 0 }} />}
              {readOnly ? <span style={{ color: '#6B7280', textAlign: 'right' }}>×{item.quantity}</span> : <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} placeholder="Qty" style={{ width: 60, padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, textAlign: 'right', outline: 'none' }} />}
              {readOnly ? <span style={{ color: '#6B7280', textAlign: 'right' }}>${(item.unitCost || 0).toFixed(2)}</span> : <input type="number" value={item.unitCost} onChange={(e) => updateItem(item.id, 'unitCost', e.target.value)} placeholder="Unit $" step="0.01" style={{ width: 80, padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, textAlign: 'right', outline: 'none' }} />}
              <span style={{ fontWeight: 600, color: '#252842', textAlign: 'right', minWidth: 70 }}>${(item.total || 0).toFixed(2)}</span>
              {!readOnly && <button onClick={() => removeItem(item.id)} type="button" className="pressable-icon" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>×</button>}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 10px', fontSize: 14, fontWeight: 700, color: '#252842' }}>Custom Total: ${totalCustom.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}
