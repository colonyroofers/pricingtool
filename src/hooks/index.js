import { useState, useEffect, useCallback, useRef } from 'react';
import { auth, db, subscribeCollection, saveDocument, deleteDocument } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';

// Auth hook
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ? { uid: u.uid, email: u.email, name: u.displayName, picture: u.photoURL } : null);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, loading, signIn: () => {}, signOut: () => {} };
};

/**
 * Firestore collection hook with real-time sync + localStorage offline cache.
 *
 * - Immediately loads from localStorage cache for instant UI
 * - Subscribes to Firestore real-time updates
 * - Falls back to localStorage-only if Firestore is unreachable
 * - Every save writes to both Firestore AND localStorage
 */
export const useFirestoreCollection = (collectionName, defaultData = []) => {
  const [data, setData] = useState(() => {
    // Load from localStorage cache immediately
    const stored = localStorage.getItem(`pt_${collectionName}`);
    if (stored) {
      try { return JSON.parse(stored); } catch(e) {}
    }
    return defaultData;
  });
  const [loaded, setLoaded] = useState(false);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const unsubRef = useRef(null);

  useEffect(() => {
    // Try to subscribe to Firestore real-time updates
    try {
      unsubRef.current = subscribeCollection(collectionName, (docs) => {
        setFirebaseConnected(true);
        if (docs.length > 0 || data.length === 0) {
          setData(docs);
          // Update localStorage cache
          localStorage.setItem(`pt_${collectionName}`, JSON.stringify(docs));
        }
        setLoaded(true);
      });
    } catch (err) {
      console.warn(`Firestore subscription failed for ${collectionName}, using localStorage`, err);
      setLoaded(true);
    }

    // Mark loaded after timeout if Firestore hasn't responded
    const timeout = setTimeout(() => {
      setLoaded(true);
    }, 3000);

    return () => {
      if (unsubRef.current) unsubRef.current();
      clearTimeout(timeout);
    };
  }, [collectionName]);

  const save = useCallback((newData) => {
    setData(newData);
    // Always update localStorage cache
    localStorage.setItem(`pt_${collectionName}`, JSON.stringify(newData));

    // Sync each item to Firestore
    newData.forEach(item => {
      if (item.id) {
        // Strip any undefined values (Firestore doesn't accept them)
        const clean = JSON.parse(JSON.stringify(item));
        saveDocument(collectionName, item.id, clean).catch(err => {
          console.warn(`Firestore write failed for ${collectionName}/${item.id}`, err);
        });
      }
    });

    // Delete items from Firestore that are no longer in the array
    // (Compare with previous data to find removed items)
    const newIds = new Set(newData.map(d => d.id).filter(Boolean));
    const stored = localStorage.getItem(`pt_${collectionName}_prev`);
    if (stored) {
      try {
        const prevData = JSON.parse(stored);
        prevData.forEach(prev => {
          if (prev.id && !newIds.has(prev.id)) {
            deleteDocument(collectionName, prev.id).catch(err => {
              console.warn(`Firestore delete failed for ${collectionName}/${prev.id}`, err);
            });
          }
        });
      } catch(e) {}
    }
    localStorage.setItem(`pt_${collectionName}_prev`, JSON.stringify(newData));
  }, [collectionName]);

  return [data, save, loaded];
};

// Online status hook
export const useOnlineStatus = () => {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online;
};

// Mobile detection
export const useIsMobile = () => {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handle = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return mobile;
};
