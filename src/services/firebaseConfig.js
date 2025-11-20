import { initializeApp } from 'firebase/app';

// Check if running in browser (Vite) or Node.js environment
const isBrowser = typeof window !== 'undefined';

// Get environment variables from appropriate source
const getEnvVar = (key) => {
  if (isBrowser) {
    // Browser environment - use import.meta.env
    return import.meta.env[key];
  } else {
    // Node.js environment - use process.env
    return process.env[key];
  }
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: getEnvVar('VITE_FIREBASE_DATABASE_URL'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID'),
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
