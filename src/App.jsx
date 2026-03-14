import React, { useState, useEffect } from 'react';
import { C, NAV_ITEMS } from './utils/constants';
import { useAuth, useFirestoreCollection, useIsMobile } from './hooks/index';
import LoginScreen from './components/LoginScreen';
import Spinner from './components/Spinner';
import DashboardModule from './modules/DashboardModule';
import EstimateWizard from './modules/EstimateWizard';
import ProductCatalogModule from './modules/ProductCatalogModule';
import VendorCatalogModule from './modules/VendorCatalogModule';
import TeamModule from './modules/TeamModule';
import SettingsModule from './modules/SettingsModule';

export default function App() {
  const { user, loading } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [estimates, setEstimates] = useFirestoreCollection('estimates', []);
  const [demoMode, setDemoMode] = useState(true);

  // Handle demo mode (bypass Firebase auth when config has placeholders)
  const isLoggedIn = demoMode || user;

  const handleAddEstimate = (estimate) => {
    setEstimates([...estimates, estimate]);
  };

  const handleStatusChange = (estimateId, newStatus) => {
    setEstimates(estimates.map(e => e.id === estimateId ? { ...e, status: newStatus } : e));
  };

  const renderModule = () => {
    switch (activeNav) {
      case 'dashboard':
        return <DashboardModule estimates={estimates} onAddEstimate={handleAddEstimate} onStatusChange={handleStatusChange} />;
      case 'estimates':
        return <EstimateWizard />;
      case 'catalog':
        return <ProductCatalogModule />;
      case 'vendors':
        return <VendorCatalogModule />;
      case 'team':
        return <TeamModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return null;
    }
  };

  if (loading) return <Spinner />;

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onSignIn={() => setDemoMode(true)}
      />
    );
  }

  const navItem = NAV_ITEMS.find(n => n.key === activeNav);

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100vh',
      backgroundColor: C.gray50,
    }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarCollapsed ? 60 : 230,
          backgroundColor: C.navy,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s',
          borderRight: `1px solid ${C.navyDark}`,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '16px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `1px solid ${C.navyDark}`,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              backgroundColor: C.red,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.white,
              fontSize: 16,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            CR
          </div>
          {!sidebarCollapsed && (
            <div style={{
              flex: 1,
              minWidth: 0,
            }}>
              <p style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.white,
                margin: 0,
              }}>
                Colony Roofers
              </p>
              <p style={{
                fontSize: 10,
                color: C.gray400,
                margin: 0,
              }}>
                ESTIMATING
              </p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 0',
        }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveNav(item.key)}
              style={{
                width: '100%',
                padding: '12px 12px',
                backgroundColor: activeNav === item.key ? C.navyLight : 'transparent',
                border: 'none',
                borderLeft: activeNav === item.key ? `3px solid ${C.red}` : '3px solid transparent',
                color: C.white,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                if (activeNav !== item.key) {
                  e.target.style.backgroundColor = C.navyLight;
                }
              }}
              onMouseOut={(e) => {
                if (activeNav !== item.key) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {!sidebarCollapsed && (
                <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Toggle */}
        <div
          style={{
            padding: '12px',
            borderTop: `1px solid ${C.navyDark}`,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              width: 32,
              height: 32,
              backgroundColor: C.navyLight,
              border: 'none',
              borderRadius: 6,
              color: C.white,
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: C.gray50,
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            height: 52,
            backgroundColor: C.white,
            borderBottom: `1px solid ${C.gray200}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingLeft: 24,
            paddingRight: 24,
            zIndex: 50,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h1
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: C.navy,
              margin: 0,
            }}
          >
            {navItem?.label}
          </h1>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <div
              style={{
                padding: '4px 10px',
                backgroundColor: C.redBg,
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                color: C.red,
              }}
            >
              Admin
            </div>

            <div
              style={{
                width: 32,
                height: 32,
                backgroundColor: C.blue,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.white,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Z
            </div>
          </div>
        </div>

        {/* Module Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: C.gray50,
          }}
        >
          {renderModule()}
        </div>
      </div>
    </div>
  );
}
