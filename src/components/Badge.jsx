import React from 'react';

export default function Badge({ label, color, bg }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '6px 10px',
      borderRadius: 12,
      backgroundColor: bg,
      color: color,
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}
