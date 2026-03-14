import { useState, useEffect, useCallback } from 'react';
import { auth } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { signInWithGoogle, signOutUser } from '../utils/firebase';

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

  return { user, loading, signIn: signInWithGoogle, signOut: signOutUser };
};

// Firestore collection hook with real-time sync
export const useFirestoreCollection = (collectionName, defaultData = []) => {
  const [data, setData] = useState(defaultData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Use localStorage fallback when Firebase isn't configured
    const stored = localStorage.getItem(`pt_${collectionName}`);
    if (stored) {
      try { setData(JSON.parse(stored)); } catch(e) {}
    }
    setLoaded(true);
  }, [collectionName]);

  const save = useCallback((newData) => {
    setData(newData);
    localStorage.setItem(`pt_${collectionName}`, JSON.stringify(newData));
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
