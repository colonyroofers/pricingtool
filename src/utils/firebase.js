import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCawWMq5X2OpWsmplOYxrR6bhyHeAzXKFw",
  authDomain: "colony-inspection-app.firebaseapp.com",
  projectId: "colony-inspection-app",
  storageBucket: "colony-inspection-app.firebasestorage.app",
  messagingSenderId: "869437682472",
  appId: "1:869437682472:web:61520f00da42339709d61d",
  measurementId: "G-EHR286MB33"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Auth helpers
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signOutUser = () => fbSignOut(auth);

// Firestore helpers
export const getCollection = async (collectionName) => {
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const saveDocument = async (collectionName, id, data) => {
  await setDoc(doc(db, collectionName, id), data, { merge: true });
};

export const updateDocument = async (collectionName, id, data) => {
  await updateDoc(doc(db, collectionName, id), data);
};

export const deleteDocument = async (collectionName, id) => {
  await deleteDoc(doc(db, collectionName, id));
};

export const subscribeCollection = (collectionName, callback) => {
  return onSnapshot(collection(db, collectionName), (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// Storage helpers
export const uploadFile = async (path, file) => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};

export const uploadFileFromBlob = async (path, blob, metadata) => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, blob, metadata);
  return getDownloadURL(snapshot.ref);
};

export const getFileURL = async (path) => {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
};

export const deleteFile = async (path) => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};
