/**
 * Design Service - CRUD operations for furniture designs in Firestore
 * All designs stored in 'mydb' collection with type: 'design'
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestoreInstance } from './firestoreConfig.js';

// Collection name - configurable constant
const COLLECTION_NAME = 'mydb';
const DOCUMENT_TYPE = 'design';

/**
 * Convert Firestore Timestamp to ISO string
 */
function convertTimestamps(data) {
  const converted = { ...data };
  if (converted.createdAt && converted.createdAt.toDate) {
    converted.createdAt = converted.createdAt.toDate().toISOString();
  }
  if (converted.updatedAt && converted.updatedAt.toDate) {
    converted.updatedAt = converted.updatedAt.toDate().toISOString();
  }
  return converted;
}

/**
 * Save a new design to Firestore
 * @param {string} userId - User ID who owns this design
 * @param {Object} designData - Design data from design generator
 * @returns {Promise<Object>} Saved design with ID
 */
export async function saveDesign(userId, designData) {
  try {
    const db = getFirestoreInstance();
    const designsRef = collection(db, COLLECTION_NAME);

    // Add userId, type, and timestamps to the design
    const designDoc = {
      ...designData,
      userId,
      type: DOCUMENT_TYPE,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(designsRef, designDoc);

    return {
      id: docRef.id,
      ...designData,
      userId,
      type: DOCUMENT_TYPE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to save design: ${error.message}`);
  }
}

/**
 * Get all designs for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of user's designs
 */
export async function getUserDesigns(userId) {
  try {
    const db = getFirestoreInstance();
    const designsRef = collection(db, COLLECTION_NAME);

    // Query by userId AND type === 'design', ordered by createdAt descending
    const q = query(
      designsRef,
      where('userId', '==', userId),
      where('type', '==', DOCUMENT_TYPE),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const designs = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      designs.push({
        id: doc.id,
        ...convertTimestamps(data),
      });
    });

    return designs;
  } catch (error) {
    throw new Error(`Failed to get user designs: ${error.message}`);
  }
}

/**
 * Get a specific design by ID
 * @param {string} designId - Design document ID
 * @returns {Promise<Object>} Design data
 */
export async function getDesign(designId) {
  try {
    const db = getFirestoreInstance();
    const designRef = doc(db, COLLECTION_NAME, designId);
    const designDoc = await getDoc(designRef);

    if (!designDoc.exists()) {
      throw new Error('Design not found');
    }

    const data = designDoc.data();

    // Verify this is a design document
    if (data.type !== DOCUMENT_TYPE) {
      throw new Error('Document is not a design');
    }

    return {
      id: designDoc.id,
      ...convertTimestamps(data),
    };
  } catch (error) {
    throw new Error(`Failed to get design: ${error.message}`);
  }
}

/**
 * Update an existing design
 * @param {string} designId - Design document ID
 * @param {string} userId - User ID (for ownership verification)
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated design
 */
export async function updateDesign(designId, userId, updates) {
  try {
    const db = getFirestoreInstance();
    const designRef = doc(db, COLLECTION_NAME, designId);

    // First, verify the design exists and user owns it
    const designDoc = await getDoc(designRef);

    if (!designDoc.exists()) {
      throw new Error('Design not found');
    }

    const data = designDoc.data();

    if (data.type !== DOCUMENT_TYPE) {
      throw new Error('Document is not a design');
    }

    if (data.userId !== userId) {
      throw new Error('Unauthorized: You do not own this design');
    }

    // Update the design
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(designRef, updateData);

    // Return updated design
    return getDesign(designId);
  } catch (error) {
    throw new Error(`Failed to update design: ${error.message}`);
  }
}

/**
 * Delete a design
 * @param {string} designId - Design document ID
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Promise<void>}
 */
export async function deleteDesign(designId, userId) {
  try {
    const db = getFirestoreInstance();
    const designRef = doc(db, COLLECTION_NAME, designId);

    // First, verify the design exists and user owns it
    const designDoc = await getDoc(designRef);

    if (!designDoc.exists()) {
      throw new Error('Design not found');
    }

    const data = designDoc.data();

    if (data.type !== DOCUMENT_TYPE) {
      throw new Error('Document is not a design');
    }

    if (data.userId !== userId) {
      throw new Error('Unauthorized: You do not own this design');
    }

    // Delete the design
    await deleteDoc(designRef);
  } catch (error) {
    throw new Error(`Failed to delete design: ${error.message}`);
  }
}
