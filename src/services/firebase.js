/**
 * firebase.js
 * Firebase initialization with dynamic config support and offline fallback.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const DEFAULT_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

export const getSavedFirebaseConfig = () => {
  try {
    const custom = localStorage.getItem('quickcart_firebase_config');
    if (custom) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(custom) };
    }
  } catch (e) {
    console.error('Error reading custom firebase config', e);
  }
  return DEFAULT_CONFIG;
};

export const isFirebaseConfigured = () => {
  const config = getSavedFirebaseConfig();
  return Boolean(config.apiKey && config.projectId);
};

let dbInstance = null;

export const getFirestoreDb = () => {
  const config = getSavedFirebaseConfig();

  if (!config.apiKey || !config.projectId) {
    return null;
  }

  try {
    const app = !getApps().length ? initializeApp(config) : getApp();
    if (!dbInstance) {
      dbInstance = getFirestore(app);
    }
    return dbInstance;
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return null;
  }
};
