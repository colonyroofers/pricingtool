import React, { useState } from 'react';
import { C, DEFAULT_FINANCIALS } from '../utils/constants';

export default function SettingsModule() {
  const [taxRate, setTaxRate] = useState(DEFAULT_FINANCIALS.taxRate * 100);
  const [margin, setMargin] = useState(DEFAULT_FINANCIALS.margin * 100);
  const [companyName, setCompanyName] = useState('Colony Roofers');
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);

  const handleSave = () => {
    localStorage.setItem('pt_settings', JSON.stringify({
      taxRate: taxRate / 100,
      margin: margin / 100,
      companyName,
    }));
    alert('Settings saved!');
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
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy }}>Settings</h2>
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px',
      }}>
        <div style={{
          maxWidth: 600,
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}>
          {/* Company Info */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 16 }}>Company Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    marginTop: 8,
                    border: `1px solid ${C.gray300}`,
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Financial Defaults */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 16 }}>Financial Defaults</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>Tax Rate (%)</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    marginTop: 8,
                    border: `1px solid ${C.gray300}`,
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
                <p style={{ fontSize: 11, color: C.gray500, marginTop: 4 }}>
                  Applied to material costs on all estimates
                </p>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>Markup Margin (%)</label>
                <input
                  type="number"
                  value={margin}
                  onChange={(e) => setMargin(parseFloat(e.target.value))}
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    marginTop: 8,
                    border: `1px solid ${C.gray300}`,
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
                <p style={{ fontSize: 11, color: C.gray500, marginTop: 4 }}>
                  Profit margin applied to all project estimates
                </p>
              </div>
            </div>
          </div>

          {/* Firebase Configuration */}
          <div style={{
            backgroundColor: firebaseConfigured ? C.greenBg : C.yellowBg,
            border: `1px solid ${firebaseConfigured ? C.green : C.yellow}`,
            borderRadius: 8,
            padding: 16,
          }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              color: firebaseConfigured ? C.green : C.yellow,
              marginBottom: 8,
            }}>
              Firebase Configuration
            </h3>
            <p style={{
              fontSize: 12,
              color: firebaseConfigured ? C.green : C.yellow,
              marginBottom: 12,
            }}>
              {firebaseConfigured
                ? 'Firebase is configured and data will sync to the cloud.'
                : 'Firebase is not configured. Data is stored locally. To enable cloud sync, update your Firebase config in src/utils/firebase.js'}
            </p>
            {!firebaseConfigured && (
              <code style={{
                display: 'block',
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: 12,
                borderRadius: 4,
                fontSize: 11,
                color: C.gray700,
                fontFamily: 'monospace',
                overflow: 'auto',
                marginBottom: 12,
              }}>
                {`const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};`}
              </code>
            )}
          </div>
        </div>
      </div>

      <div style={{
        padding: '16px 24px',
        borderTop: `1px solid ${C.gray200}`,
        backgroundColor: C.gray50,
        display: 'flex',
        gap: 12,
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 20px',
            backgroundColor: C.red,
            color: C.white,
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
