import React, { useState } from 'react';
import { C, ROLE_PRESETS, ROLES, generateId } from '../utils/constants';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';

export default function TeamModule({ team, setTeam }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'staff_estimator', active: true });

  const columns = [
    { key: 'name', label: 'Name', editable: true },
    { key: 'email', label: 'Email', editable: true },
    { key: 'role', label: 'Role', editable: true },
    { key: 'active', label: 'Active', editable: true },
  ];

  const resetForm = () => {
    setNewMember({ name: '', email: '', role: 'staff_estimator', active: true });
  };

  const handleAddTeamMember = () => {
    if (!newMember.name.trim()) return;
    setTeam([...team, {
      id: generateId(),
      name: newMember.name.trim(),
      email: newMember.email.trim(),
      role: newMember.role,
      active: newMember.active,
    }]);
    resetForm();
    setShowAddModal(false);
  };

  const handleDeleteMember = (rowIndex) => {
    const updated = team.filter((_, i) => i !== rowIndex);
    setTeam(updated);
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${C.gray300}`,
    borderRadius: 8,
    fontSize: 14,
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: C.gray700,
    marginBottom: 6,
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: C.white }}>
      <div style={{
        padding: '16px 24px', borderBottom: `1px solid ${C.gray200}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy }}>Team</h2>
        <button
          className="pressable"
          onClick={() => setShowAddModal(true)}
          style={{ padding: '8px 16px', backgroundColor: C.red, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Add Member
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* Role summary cards */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {Object.entries(ROLE_PRESETS).map(([key, preset]) => {
            const count = team.filter(t => t.role === key && t.active).length;
            return (
              <div key={key} style={{
                flex: 1, padding: 14, backgroundColor: `${preset.color}10`, border: `1px solid ${preset.color}30`,
                borderRadius: 8, textAlign: 'center',
              }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: preset.color, margin: 0 }}>{count}</p>
                <p style={{ fontSize: 12, color: preset.color, margin: '4px 0 0' }}>{preset.label}s</p>
              </div>
            );
          })}
        </div>

        <DataTable columns={columns} data={team} onDataChange={setTeam} onDeleteRow={handleDeleteMember} searchable />
      </div>

      <div style={{ padding: '12px 24px', borderTop: `1px solid ${C.gray200}`, backgroundColor: C.gray50 }}>
        <p style={{ fontSize: 12, color: C.gray600 }}>
          {team.length} team member{team.length !== 1 ? 's' : ''} &bull; {team.filter(t => t.active).length} active
        </p>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <Modal onClose={() => { setShowAddModal(false); resetForm(); }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.navy, margin: '0 0 20px' }}>Add Team Member</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Name *</label>
            <input
              type="text"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              placeholder="Full name"
              style={inputStyle}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              placeholder="email@colonyroofers.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Role</label>
            <select
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              {Object.entries(ROLES).map(([key, role]) => (
                <option key={key} value={key}>{role.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              className="pressable"
              onClick={() => { setShowAddModal(false); resetForm(); }}
              style={{
                flex: 1, padding: '10px 16px', backgroundColor: C.gray100, color: C.gray700,
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              className="pressable"
              onClick={handleAddTeamMember}
              disabled={!newMember.name.trim()}
              style={{
                flex: 1, padding: '10px 16px',
                backgroundColor: newMember.name.trim() ? C.red : C.gray300,
                color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: newMember.name.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Add Member
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
