import React, { useState } from 'react';
import { C, ROLE_PRESETS, generateId } from '../utils/constants';
import DataTable from '../components/DataTable';

const DEFAULT_TEAM = [
  { id: '1', name: 'Zach Reece', email: 'zach@colonyroofers.com', role: 'admin', active: true },
  { id: '2', name: 'Joseph', email: 'joseph@colonyroofers.com', role: 'estimator', active: true },
  { id: '3', name: 'J. Garside', email: 'jgarside@colonyroofers.com', role: 'estimator', active: true },
  { id: '4', name: 'Brayleigh Gardner', email: 'brayleigh@colonyroofers.com', role: 'reviewer', active: true },
];

export default function TeamModule() {
  const [team, setTeam] = useState(DEFAULT_TEAM);

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
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: C.white,
    }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${C.gray200}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy }}>Team</h2>
        <button
          onClick={handleAddTeamMember}
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
          + Add Member
        </button>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px',
      }}>
        <DataTable
          columns={columns}
          data={team}
          onDataChange={setTeam}
          searchable
        />
      </div>

      <div style={{
        padding: '16px 24px',
        borderTop: `1px solid ${C.gray200}`,
        backgroundColor: C.gray50,
      }}>
        <p style={{ fontSize: 12, color: C.gray600 }}>
          {team.length} team member{team.length !== 1 ? 's' : ''} • {team.filter(t => t.active).length} active
        </p>
      </div>
    </div>
  );
}
