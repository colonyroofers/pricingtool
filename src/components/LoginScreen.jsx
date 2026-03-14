import React from 'react';
import { C } from '../utils/constants';

export default function LoginScreen({ onSignIn }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        backgroundColor: C.white,
        borderRadius: 16,
        padding: 40,
        maxWidth: 400,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          width: 48,
          height: 48,
          backgroundColor: C.red,
          borderRadius: 8,
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 700,
          color: C.white,
        }}>
          CR
        </div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: C.navy,
          marginBottom: 8,
        }}>
          Colony Roofers
        </h1>
        <p style={{
          fontSize: 14,
          color: C.gray500,
          marginBottom: 32,
        }}>
          Pricing Tool
        </p>

        <button
          onClick={onSignIn}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: C.navy,
            color: C.white,
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 12,
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = C.navyDark}
          onMouseOut={(e) => e.target.style.backgroundColor = C.navy}
        >
          Sign in with Google
        </button>

        <p style={{
          fontSize: 12,
          color: C.gray400,
          marginTop: 20,
        }}>
          Or use demo mode
        </p>
      </div>
    </div>
  );
}
