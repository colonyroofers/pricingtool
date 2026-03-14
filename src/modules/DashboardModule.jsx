import React, { useState } from 'react';
import { C, ESTIMATE_TYPES, generateId } from '../utils/constants';
import KanbanBoard from '../components/KanbanBoard';
import Modal from '../components/Modal';

export default function DashboardModule({ estimates, onAddEstimate, onStatusChange }) {
  const [showNewModal, setShowNewModal] = useState(false);
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

  const handleSubmit = () => {
    if (!formData.propertyName || !formData.address) {
      alert('Please fill in property name and address');
      return;
    }

    onAddEstimate({
      id: generateId(),
      ...formData,
      status: 'unassigned',
      createdAt: new Date().toISOString(),
    });

    setFormData({
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
    setShowNewModal(false);
  };

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
          onClick={() => setShowNewModal(true)}
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
          onNewEstimate={() => setShowNewModal(true)}
        />
      </div>

      <Modal
        isOpen={showNewModal}
        title="New Estimate"
        onClose={() => setShowNewModal(false)}
        width={500}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="text"
            placeholder="Property Name"
            value={formData.propertyName}
            onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
            style={{
              padding: '10px 12px',
              border: `1px solid ${C.gray300}`,
              borderRadius: 8,
              fontSize: 14,
            }}
          />
          <input
            type="text"
            placeholder="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            style={{
              padding: '10px 12px',
              border: `1px solid ${C.gray300}`,
              borderRadius: 8,
              fontSize: 14,
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input
              type="text"
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              style={{
                padding: '10px 12px',
                border: `1px solid ${C.gray300}`,
                borderRadius: 8,
                fontSize: 14,
              }}
            />
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              style={{
                padding: '10px 12px',
                border: `1px solid ${C.gray300}`,
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              <option value="FL">Florida</option>
              <option value="GA">Georgia</option>
              <option value="TX">Texas</option>
              <option value="TN">Tennessee</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Zip Code"
            value={formData.zip}
            onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
            style={{
              padding: '10px 12px',
              border: `1px solid ${C.gray300}`,
              borderRadius: 8,
              fontSize: 14,
            }}
          />
          <input
            type="text"
            placeholder="Contact Name"
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            style={{
              padding: '10px 12px',
              border: `1px solid ${C.gray300}`,
              borderRadius: 8,
              fontSize: 14,
            }}
          />
          <input
            type="text"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            style={{
              padding: '10px 12px',
              border: `1px solid ${C.gray300}`,
              borderRadius: 8,
              fontSize: 14,
            }}
          />
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            style={{
              padding: '10px 12px',
              border: `1px solid ${C.gray300}`,
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            {ESTIMATE_TYPES.map(t => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            style={{
              padding: '10px 12px',
              border: `1px solid ${C.gray300}`,
              borderRadius: 8,
              fontSize: 14,
              minHeight: 100,
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowNewModal(false)}
              style={{
                padding: '10px 16px',
                backgroundColor: C.gray200,
                color: C.navy,
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              style={{
                padding: '10px 16px',
                backgroundColor: C.red,
                color: C.white,
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
