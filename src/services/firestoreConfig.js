import { getFirestore, initializeFirestore } from 'firebase/firestore';
import app from './firebaseConfig.js';

let db = null;

/**
 * Get configured Firestore instance
 * Uses long polling to avoid WebSocket blocking issues
 * @returns {Firestore} Configured Firestore instance
 */
export function getFirestoreInstance() {
  if (!db) {
    // Initialize Firestore with long polling settings
    // This prevents WebSocket blocking issues
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: false,
    });
  }
  return db;
}

// Export as default for convenience
export default getFirestoreInstance;
