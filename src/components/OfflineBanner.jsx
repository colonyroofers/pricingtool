import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const goOnline = () => { setIsOnline(true); setShowReconnected(true); setTimeout(() => setShowReconnected(false), 3000); };
    const goOffline = () => { setIsOnline(false); setShowReconnected(false); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div className="offline-banner" style={{ background: isOnline ? '#059669' : '#F59E0B' }}>
      {isOnline ? '✓ Back online — syncing data...' : "You're offline — changes will be saved and synced when you reconnect"}
    </div>
  );
}
