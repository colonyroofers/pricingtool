import React from 'react';
import { C } from '../utils/constants';

export default function Spinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      backgroundColor: C.white,
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: `3px solid ${C.gray200}`,
        borderTop: `3px solid ${C.navy}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}
