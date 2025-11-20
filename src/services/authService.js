import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import app from './firebaseConfig.js';
import { getFirestoreInstance } from './firestoreConfig.js';

const auth = getAuth(app);

/**
 * Sign up a new user with email and password
 * Creates user account and profile in Firestore
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User display name
 * @returns {Promise<Object>} User credential
 */
export async function signUp(email, password, name) {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore (non-blocking for better UX)
    const db = getFirestoreInstance();
    const userRef = doc(db, 'users', user.uid);

    // Don't await - let it complete in background
    setDoc(userRef, {
      email: user.email,
      name: name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch(error => {
      console.error('Error creating user profile:', error);
    });

    return userCredential;
  } catch (error) {
    throw new Error(`Sign up failed: ${error.message}`);
  }
}

/**
 * Sign in existing user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User credential
 */
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Fetch user profile from Firestore (non-blocking for better UX)
    const db = getFirestoreInstance();
    const userRef = doc(db, 'users', userCredential.user.uid);
    getDoc(userRef).catch(error => {
      console.error('Error fetching user profile:', error);
    });

    return userCredential;
  } catch (error) {
    throw new Error(`Sign in failed: ${error.message}`);
  }
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw new Error(`Sign out failed: ${error.message}`);
  }
}

/**
 * Get current authenticated user
 * @returns {Object|null} Current user or null if not authenticated
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function called when auth state changes
 * @returns {Function} Unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
