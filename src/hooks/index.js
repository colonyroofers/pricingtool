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
 * - Subscribes to Firestore real-time updates (source of truth)
 * - Falls back to localStorage-only if Firestore is unreachable
 * - Saves write to both Firestore AND localStorage
 * - Deletes are EXPLICIT only — never inferred from array diffs
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
  const firestoreLoadedRef = useRef(false);
  const dataRef = useRef(data);
  const unsubRef = useRef(null);

  // Keep dataRef in sync so subscription callback has current data
  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    // Try to subscribe to Firestore real-time updates
    try {
      unsubRef.current = subscribeCollection(collectionName, (docs) => {
        firestoreLoadedRef.current = true;
        // Firestore is the source of truth when it has data.
        // Only ignore empty Firestore results if we already have local data
        // (protects against brief empty snapshots during connection init)
        if (docs.length > 0 || dataRef.current.length === 0) {
          setData(docs);
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

  // Save: upserts items to Firestore. Does NOT delete anything.
  const save = useCallback((newData) => {
    setData(newData);
    localStorage.setItem(`pt_${collectionName}`, JSON.stringify(newData));

    // Sync each item to Firestore
    newData.forEach(item => {
      if (item.id) {
        const clean = JSON.parse(JSON.stringify(item));
        saveDocument(collectionName, item.id, clean).catch(err => {
          console.warn(`Firestore write failed for ${collectionName}/${item.id}`, err);
        });
      }
    });
  }, [collectionName]);

  // Explicit delete: removes a single item by ID from Firestore + local state
  const remove = useCallback((itemId) => {
    setData(prev => {
      const updated = prev.filter(d => d.id !== itemId);
      localStorage.setItem(`pt_${collectionName}`, JSON.stringify(updated));
      return updated;
    });
    deleteDocument(collectionName, itemId).catch(err => {
      console.warn(`Firestore delete failed for ${collectionName}/${itemId}`, err);
    });
  }, [collectionName]);

  return [data, save, loaded, remove];
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
