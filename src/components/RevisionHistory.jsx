import { useState } from 'react';

export default function RevisionHistory({ revisions = [] }) {
  const [expandedRevision, setExpandedRevision] = useState(null);

  if (revisions.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center', border: '2px dashed #E2E8F0', borderRadius: 12, color: '#9CA3AF', fontSize: 14 }}>No revisions recorded yet.</div>;
  }

  return (
    <div>
      <h4 style={{ fontSize: 14, fontWeight: 600, color: '#252842', margin: '0 0 12px' }}>Revision History ({revisions.length})</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {revisions.map((rev, i) => (
          <div key={rev.id || i} style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
            <button onClick={() => setExpandedRevision(expandedRevision === i ? null : i)} type="button" className="pressable" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F9FAFB', border: 'none', cursor: 'pointer', fontSize: 13 }}>
              <span style={{ pointerEvents: 'none', fontWeight: 600, color: '#252842' }}>Revision {revisions.length - i} — {rev.submittedBy || 'Unknown'}</span>
              <span style={{ pointerEvents: 'none', color: '#9CA3AF', fontSize: 12 }}>{new Date(rev.timestamp).toLocaleDateString()} {expandedRevision === i ? '▾' : '▸'}</span>
            </button>
            {expandedRevision === i && (
              <div style={{ padding: 14 }}>
                {rev.changes && rev.changes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {rev.changes.map((change, j) => (
                      <div key={j} style={{ fontSize: 13, color: '#374151' }}>
                        <span style={{ fontWeight: 600 }}>{change.field}: </span>
                        <span style={{ color: '#DC2626', textDecoration: 'line-through' }}>{change.oldValue}</span>
                        {' → '}
                        <span style={{ color: '#059669' }}>{change.newValue}</span>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>No detailed changes recorded.</p>}
                {rev.note && <div style={{ marginTop: 10, padding: 10, background: '#FEF3C7', borderRadius: 8, fontSize: 13, color: '#92400E' }}><strong>Review Note:</strong> {rev.note}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
