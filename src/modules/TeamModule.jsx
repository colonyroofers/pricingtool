import React from 'react';
import { C, ROLE_PRESETS, generateId } from '../utils/constants';
import DataTable from '../components/DataTable';

export default function TeamModule({ team, setTeam }) {
  const columns = [
    { key: 'name', label: 'Name', editable: true },
    { key: 'email', label: 'Email', editable: true },
    { key: 'role', label: 'Role', editable: true },
    { key: 'active', label: 'Active', editable: true },
  ];

  const handleAddTeamMember = () => {
    setTeam([...team, {
      id: generateId(),
      name: 'New Member',
      email: '',
      role: 'estimator',
      active: true,
    }]);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: C.white }}>
      <div style={{
        padding: '16px 24px', borderBottom: `1px solid ${C.gray200}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy }}>Team</h2>
        <button onClick={handleAddTeamMember}
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

        <DataTable columns={columns} data={team} onDataChange={setTeam} searchable />
      </div>

      <div style={{ padding: '12px 24px', borderTop: `1px solid ${C.gray200}`, backgroundColor: C.gray50 }}>
        <p style={{ fontSize: 12, color: C.gray600 }}>
          {team.length} team member{team.length !== 1 ? 's' : ''} &bull; {team.filter(t => t.active).length} active
        </p>
      </div>
    </div>
  );
}
