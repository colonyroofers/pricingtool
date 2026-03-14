import { useState } from 'react';

export default function CommentThread({ comments = [], currentUser, onAddComment, placeholder = 'Add a note or comment...' }) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddComment({ text: text.trim(), userName: currentUser?.name || 'Unknown', userRole: currentUser?.role || 'staff_estimator', timestamp: new Date().toISOString(), id: crypto.randomUUID() });
      setText('');
    } finally { setIsSubmitting(false); }
  };

  return (
    <div>
      <h4 style={{ fontSize: 14, fontWeight: 600, color: '#252842', margin: '0 0 12px' }}>Review Notes ({comments.length})</h4>
      {comments.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', border: '2px dashed #E2E8F0', borderRadius: 12, color: '#9CA3AF', fontSize: 14, marginBottom: 12 }}>No comments yet. Use this thread for review feedback.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {comments.map((c, i) => (
            <div key={c.id || i} style={{ padding: 12, background: c.userRole === 'lead_estimator' || c.userRole === 'admin' ? '#F0F4FF' : '#F5F5F7', borderRadius: 10, borderLeft: `3px solid ${c.userRole === 'lead_estimator' || c.userRole === 'admin' ? '#6366F1' : '#CBD5E1'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#252842' }}>{c.userName}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(c.timestamp).toLocaleString()}</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{c.text}</p>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }}} placeholder={placeholder} style={{ flex: 1, padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#F9FAFB' }} />
        <button onClick={handleSubmit} disabled={!text.trim() || isSubmitting} className="pressable" type="button" style={{ padding: '10px 20px', background: text.trim() ? '#252842' : '#E2E8F0', color: text.trim() ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: text.trim() ? 'pointer' : 'not-allowed', opacity: isSubmitting ? 0.6 : 1 }}>
          {isSubmitting ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
