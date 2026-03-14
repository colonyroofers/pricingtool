import React, { useState } from 'react';
import { C, DEFAULT_FINANCIALS, DEFAULT_MARGIN_THRESHOLDS, NOTIFICATION_EVENTS, APP_VERSION } from '../utils/constants';
import { useToast } from '../components/Toast';

export default function SettingsModule() {
  const { addToast } = useToast();
  const [taxRate, setTaxRate] = useState(DEFAULT_FINANCIALS.taxRate * 100);
  const [margin, setMargin] = useState(DEFAULT_FINANCIALS.margin * 100);
  const [companyName, setCompanyName] = useState('Colony Roofers');
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);
  const [marginThresholds, setMarginThresholds] = useState(
    DEFAULT_MARGIN_THRESHOLDS || { FL: 25, GA: 25, TX: 25, TN: 25 }
  );
  const [termsAndConditions, setTermsAndConditions] = useState(
    { text: '', lastUpdated: null, version: 1 }
  );
  const [notificationPrefs, setNotificationPrefs] = useState({
    job_assigned: true,
    estimate_rejected: true,
    bid_due_24hr: true,
    bid_due_today: true,
    new_job_in_queue: true,
    estimate_submitted: true,
  });

  const handleSave = () => {
    localStorage.setItem('pt_settings', JSON.stringify({
      taxRate: taxRate / 100,
      margin: margin / 100,
      companyName,
      marginThresholds,
      termsAndConditions,
      notificationPrefs,
    }));
    addToast('Settings saved', 'success');
  };

  const handleMarginThresholdChange = (market, value) => {
    setMarginThresholds({
      ...marginThresholds,
      [market]: parseFloat(value) || 0,
    });
  };

  const handleTermsChange = (newText) => {
    setTermsAndConditions({
      ...termsAndConditions,
      text: newText,
      lastUpdated: new Date().toISOString(),
      version: (termsAndConditions.version || 0) + 1,
    });
  };

  const handleNotificationPrefChange = (key) => {
    setNotificationPrefs({
      ...notificationPrefs,
      [key]: !notificationPrefs[key],
    });
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
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#252842' }}>Settings</h2>
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
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#252842', marginBottom: 16 }}>Company Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#252842' }}>Company Name</label>
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
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#252842', marginBottom: 16 }}>Financial Defaults</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#252842' }}>Tax Rate (%)</label>
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
                <label style={{ fontSize: 12, fontWeight: 600, color: '#252842' }}>Markup Margin (%)</label>
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

          {/* Margin Thresholds */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#252842', marginBottom: 16 }}>Margin Thresholds</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
            }}>
              {['FL', 'GA', 'TX', 'TN'].map((market) => (
                <div key={market}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#252842' }}>
                    {market} Minimum Margin (%)
                  </label>
                  <input
                    type="number"
                    value={marginThresholds[market] || 25}
                    onChange={(e) => handleMarginThresholdChange(market, e.target.value)}
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
                </div>
              ))}
            </div>
          </div>

          {/* Proposal Terms & Conditions */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#252842', marginBottom: 16 }}>
              Proposal Terms & Conditions
            </h3>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#252842' }}>Terms & Conditions Text</label>
            <textarea
              value={termsAndConditions.text}
              onChange={(e) => handleTermsChange(e.target.value)}
              style={{
                width: '100%',
                minHeight: 200,
                padding: '12px',
                marginTop: 8,
                marginBottom: 8,
                border: `1px solid ${C.gray300}`,
                borderRadius: 8,
                fontSize: 13,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
              placeholder="Enter your standard terms and conditions here. These will apply to all future proposals."
            />
            {termsAndConditions.lastUpdated && (
              <p style={{ fontSize: 11, color: C.gray500, marginBottom: 12 }}>
                Last Updated: {new Date(termsAndConditions.lastUpdated).toLocaleString()} (Version {termsAndConditions.version})
              </p>
            )}
            <p style={{ fontSize: 11, color: C.gray500, marginBottom: 12 }}>
              Changes apply to all future proposals. Past proposals retain their original terms.
            </p>
          </div>

          {/* Notification Preferences */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#252842', marginBottom: 16 }}>
              Notification Preferences
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'job_assigned', label: 'Job Assigned' },
                { key: 'estimate_rejected', label: 'Estimate Rejected' },
                { key: 'bid_due_24hr', label: 'Bid Due in 24hrs' },
                { key: 'bid_due_today', label: 'Bid Due Today' },
                { key: 'new_job_in_queue', label: 'New Job in Queue' },
                { key: 'estimate_submitted', label: 'Estimate Submitted for Review' },
              ].map(({ key, label }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="checkbox"
                    checked={notificationPrefs[key]}
                    onChange={() => handleNotificationPrefChange(key)}
                    style={{
                      width: 18,
                      height: 18,
                      cursor: 'pointer',
                    }}
                  />
                  <label style={{ fontSize: 13, color: '#252842', cursor: 'pointer' }}>
                    {label}
                  </label>
                </div>
              ))}
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
            backgroundColor: '#E30613',
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
