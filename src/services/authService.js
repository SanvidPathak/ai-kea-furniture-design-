import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser as firebaseDeleteUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
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

/**
 * Update user display name
 * @param {string} newName - New display name
 * @returns {Promise<void>}
 */
export async function updateDisplayName(newName) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    // Update Firebase Auth profile
    await updateProfile(user, {
      displayName: newName,
    });

    // Update Firestore user profile
    const db = getFirestoreInstance();
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      name: newName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(`Failed to update display name: ${error.message}`);
  }
}

/**
 * Update user password
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export async function updatePassword(currentPassword, newPassword) {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No user is currently signed in');
    }

    // Reauthenticate user with current password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await firebaseUpdatePassword(user, newPassword);

    // Update timestamp in Firestore
    const db = getFirestoreInstance();
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error.code === 'auth/wrong-password') {
      throw new Error('Current password is incorrect');
    }
    throw new Error(`Failed to update password: ${error.message}`);
  }
}

/**
 * Delete user account and all associated data
 * @param {string} password - User password for verification
 * @returns {Promise<void>}
 */
export async function deleteUserAccount(password) {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No user is currently signed in');
    }

    const db = getFirestoreInstance();
    const userId = user.uid;

    // Reauthenticate user before deletion
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // Delete all user designs
    const designsQuery = query(
      collection(db, 'mydb'),
      where('userId', '==', userId),
      where('type', '==', 'design')
    );
    const designsSnapshot = await getDocs(designsQuery);
    const designDeletions = designsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(designDeletions);

    // Delete all user orders
    const ordersQuery = query(
      collection(db, 'mydb'),
      where('userId', '==', userId),
      where('type', '==', 'order')
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const orderDeletions = ordersSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(orderDeletions);

    // Delete user profile
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);

    // Delete Firebase Auth user
    await firebaseDeleteUser(user);
  } catch (error) {
    if (error.code === 'auth/wrong-password') {
      throw new Error('Password is incorrect');
    }
    throw new Error(`Failed to delete account: ${error.message}`);
  }
}

/**
 * Get user profile from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile(userId) {
  try {
    const db = getFirestoreInstance();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create profile if it doesn't exist (for legacy users)
      const user = auth.currentUser;
      const now = new Date();
      const newProfile = {
        email: user.email,
        name: user.displayName || 'User',
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userRef, newProfile);
      return { id: userId, ...newProfile };
    }

    return {
      id: userDoc.id,
      ...userDoc.data(),
    };
  } catch (error) {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
}
