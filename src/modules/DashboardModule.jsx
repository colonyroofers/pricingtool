import React, { useState } from 'react';
import { C, ESTIMATE_TYPES, ESTIMATE_STATUSES, generateId } from '../utils/constants';
import KanbanBoard from '../components/KanbanBoard';
import Modal from '../components/Modal';

// Estimators are passed in via team prop

const inputStyle = {
  padding: '10px 12px',
  border: `1px solid ${C.gray300}`,
  borderRadius: 8,
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
};

export default function DashboardModule({ estimates, onAddEstimate, onStatusChange, onOpenEstimate, onDeleteEstimate, onUpdateEstimate, team = [], currentUser = {} }) {
  const ESTIMATORS = (team || []).filter(t => t.role === 'estimator' && t.active).map(t => ({ name: t.name, value: t.name }));
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [formData, setFormData] = useState({
    propertyName: '',
    address: '',
    city: '',
    state: 'FL',
    zip: '',
    contact: '',
    phone: '',
    type: 'shingle',
    estimator: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      propertyName: '', address: '', city: '', state: 'FL', zip: '',
      contact: '', phone: '', type: 'shingle', estimator: '', notes: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.propertyName || !formData.address) {
      alert('Please fill in property name and address');
      return;
    }
    const status = formData.estimator ? 'assigned' : 'unassigned';
    onAddEstimate({
      id: generateId(),
      ...formData,
      status,
      buildings: [],
      createdAt: new Date().toISOString(),
    });
    resetForm();
    setShowNewModal(false);
  };

  const handleEdit = (estimate) => {
    setEditingEstimate(estimate);
    setFormData({
      propertyName: estimate.propertyName || '',
      address: estimate.address || '',
      city: estimate.city || '',
      state: estimate.state || 'FL',
      zip: estimate.zip || '',
      contact: estimate.contact || '',
      phone: estimate.phone || '',
      type: estimate.type || 'shingle',
      estimator: estimate.estimator || '',
      notes: estimate.notes || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    if (!formData.propertyName || !formData.address) {
      alert('Please fill in property name and address');
      return;
    }
    const status = formData.estimator && editingEstimate.status === 'unassigned' ? 'assigned' : editingEstimate.status;
    onUpdateEstimate({ ...editingEstimate, ...formData, status });
    setShowEditModal(false);
    setEditingEstimate(null);
    resetForm();
  };

  const handleDelete = (estimateId) => {
    if (window.confirm('Delete this estimate? This cannot be undone.')) {
      onDeleteEstimate(estimateId);
    }
  };

  const renderForm = (submitFn, submitLabel) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <input type="text" placeholder="Property Name *" value={formData.propertyName}
        onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })} style={inputStyle} />
      <input type="text" placeholder="Address *" value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={inputStyle} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <input type="text" placeholder="City" value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })} style={inputStyle} />
        <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} style={inputStyle}>
          <option value="FL">Florida</option>
          <option value="GA">Georgia</option>
          <option value="TX">Texas</option>
          <option value="TN">Tennessee</option>
        </select>
        <input type="text" placeholder="Zip" value={formData.zip}
          onChange={(e) => setFormData({ ...formData, zip: e.target.value })} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input type="text" placeholder="Contact Name" value={formData.contact}
          onChange={(e) => setFormData({ ...formData, contact: e.target.value })} style={inputStyle} />
        <input type="text" placeholder="Phone" value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={inputStyle}>
          {ESTIMATE_TYPES.map(t => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
        <select value={formData.estimator} onChange={(e) => setFormData({ ...formData, estimator: e.target.value })} style={inputStyle}>
          <option value="">Assign Estimator...</option>
          {ESTIMATORS.map(e => (
            <option key={e.value} value={e.value}>{e.name}</option>
          ))}
        </select>
      </div>
      <textarea placeholder="Notes" value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        style={{ ...inputStyle, minHeight: 80, fontFamily: 'inherit' }} />
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={() => { setShowNewModal(false); setShowEditModal(false); resetForm(); }}
          style={{ padding: '10px 16px', backgroundColor: C.gray200, color: C.navy, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Cancel
        </button>
        <button onClick={submitFn}
          style={{ padding: '10px 16px', backgroundColor: C.red, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {submitLabel}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${C.gray200}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: C.white,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy }}>Dashboard</h2>
        <button
          onClick={() => { resetForm(); setShowNewModal(true); }}
          style={{
            padding: '8px 16px',
            backgroundColor: C.red,
            color: C.white,
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + New Estimate
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <KanbanBoard
          estimates={estimates}
          onStatusChange={onStatusChange}
          onCardClick={onOpenEstimate}
          onEditClick={handleEdit}
          onDeleteClick={handleDelete}
        />
      </div>

      <Modal isOpen={showNewModal} title="New Estimate" onClose={() => { setShowNewModal(false); resetForm(); }} width={560}>
        {renderForm(handleSubmit, 'Create')}
      </Modal>

      <Modal isOpen={showEditModal} title="Edit Estimate" onClose={() => { setShowEditModal(false); resetForm(); }} width={560}>
        {renderForm(handleEditSubmit, 'Save Changes')}
      </Modal>
    </div>
  );
}
