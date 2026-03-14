export default function SuccessScreen({ title = 'Submitted Successfully', subtitle, timestamp, referenceId, onStartNew, startNewLabel = 'Start New' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: '#252842', margin: '0 0 8px' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 15, color: '#6B7280', margin: '0 0 4px' }}>{subtitle}</p>}
      {timestamp && <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 4px' }}>{new Date(timestamp).toLocaleString()}</p>}
      {referenceId && <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 32px' }}>Reference: {referenceId}</p>}
      {onStartNew && (
        <button onClick={onStartNew} className="pressable" style={{ padding: '14px 32px', background: '#252842', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>{startNewLabel}</button>
      )}
    </div>
  );
}
