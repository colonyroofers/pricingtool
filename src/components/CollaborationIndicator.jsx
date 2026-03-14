export default function CollaborationIndicator({ viewers = [], currentUserId }) {
  const otherViewers = viewers.filter(v => v.id !== currentUserId);
  if (otherViewers.length === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#ECFDF5', borderRadius: 8, fontSize: 13, color: '#065F46' }}>
      <span className="collab-dot" />
      <span>{otherViewers.length === 1 ? `${otherViewers[0].name} is also viewing` : `${otherViewers.length} others are viewing`}</span>
    </div>
  );
}
