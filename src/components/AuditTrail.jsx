import { useState } from 'react';

const ACTION_LABELS = {
  field_edit: 'Edited', status_change: 'Status changed', doc_upload: 'Uploaded document',
  assignment_change: 'Reassigned', approval: 'Approved', rejection: 'Rejected',
  comment: 'Commented', created: 'Created', duplicated: 'Duplicated from',
};

const ACTION_COLORS = {
  field_edit: '#3B82F6', status_change: '#8B5CF6', doc_upload: '#0EA5E9',
  assignment_change: '#F59E0B', approval: '#10B981', rejection: '#DC2626',
  comment: '#6366F1', created: '#10B981', duplicated: '#6B7280',
};

export default function AuditTrail({ entries = [] }) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) {
    return <div style={{ padding: 16, color: '#9CA3AF', fontSize: 14, textAlign: 'center' }}>No activity recorded yet.</div>;
  }

  const displayEntries = expanded ? entries : entries.slice(0, 3);

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)} type="button" className="pressable" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', fontSize: 14, fontWeight: 600, color: '#252842', width: '100%' }}>
        <span style={{ pointerEvents: 'none' }}>{expanded ? '▾' : '▸'}</span>
        <span style={{ pointerEvents: 'none' }}>Activity Log ({entries.length})</span>
      </button>
      <div style={{ display: expanded || entries.length <= 3 ? 'block' : 'none' }}>
        {displayEntries.map((entry, i) => (
          <div key={entry.id || i} className="audit-entry" style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACTION_COLORS[entry.action] || '#6B7280', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#252842' }}>{entry.userName || 'System'}</span>
              <span style={{ fontSize: 13, color: '#6B7280' }}>{ACTION_LABELS[entry.action] || entry.action}</span>
            </div>
            {entry.detail && <p style={{ margin: '2px 0 0 14px', fontSize: 13, color: '#6B7280' }}>{entry.detail}</p>}
            <p style={{ margin: '2px 0 0 14px', fontSize: 11, color: '#9CA3AF' }}>{new Date(entry.timestamp).toLocaleString()}</p>
          </div>
        ))}
        {!expanded && entries.length > 3 && (
          <button onClick={() => setExpanded(true)} type="button" style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: 13, cursor: 'pointer', padding: '4px 0', marginLeft: 14 }}>Show {entries.length - 3} more...</button>
        )}
      </div>
    </div>
  );
}
