/**
 * Order Service - CRUD operations for orders in Firestore
 * All orders stored in 'mydb' collection with type: 'order'
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

// Collection name - same as designs (single collection architecture)
const COLLECTION_NAME = 'mydb';
const DOCUMENT_TYPE = 'order';

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
 * Save a new order to Firestore
 * @param {string} userId - User ID who owns this order
 * @param {Object} orderData - Order data (designId, totalAmount, shippingAddress)
 * @returns {Promise<Object>} Saved order with ID
 */
export async function saveOrder(userId, orderData) {
  try {
    const db = getFirestoreInstance();
    const ordersRef = collection(db, COLLECTION_NAME);

    // Add userId, type, status, and timestamps to the order
    const orderDoc = {
      ...orderData,
      userId,
      type: DOCUMENT_TYPE,
      status: 'processing', // Default status
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(ordersRef, orderDoc);

    return {
      id: docRef.id,
      ...orderData,
      userId,
      type: DOCUMENT_TYPE,
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to save order: ${error.message}`);
  }
}

/**
 * Get all orders for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of user's orders
 */
export async function getUserOrders(userId) {
  try {
    const db = getFirestoreInstance();
    const ordersRef = collection(db, COLLECTION_NAME);

    // Query by userId AND type === 'order', ordered by createdAt descending
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      where('type', '==', DOCUMENT_TYPE),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const orders = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...convertTimestamps(data),
      });
    });

    return orders;
  } catch (error) {
    throw new Error(`Failed to get user orders: ${error.message}`);
  }
}

/**
 * Get a specific order by ID
 * @param {string} orderId - Order document ID
 * @returns {Promise<Object>} Order data
 */
export async function getOrder(orderId) {
  try {
    const db = getFirestoreInstance();
    const orderRef = doc(db, COLLECTION_NAME, orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const data = orderDoc.data();

    // Verify this is an order document
    if (data.type !== DOCUMENT_TYPE) {
      throw new Error('Document is not an order');
    }

    return {
      id: orderDoc.id,
      ...convertTimestamps(data),
    };
  } catch (error) {
    throw new Error(`Failed to get order: ${error.message}`);
  }
}

/**
 * Update an existing order
 * @param {string} orderId - Order document ID
 * @param {string} userId - User ID (for ownership verification)
 * @param {Object} updates - Fields to update (e.g., status, shippingAddress)
 * @returns {Promise<Object>} Updated order
 */
export async function updateOrder(orderId, userId, updates) {
  try {
    const db = getFirestoreInstance();
    const orderRef = doc(db, COLLECTION_NAME, orderId);

    // First, verify the order exists and user owns it
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const data = orderDoc.data();

    if (data.type !== DOCUMENT_TYPE) {
      throw new Error('Document is not an order');
    }

    if (data.userId !== userId) {
      throw new Error('Unauthorized: You do not own this order');
    }

    // Update the order
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(orderRef, updateData);

    // Return updated order
    return getOrder(orderId);
  } catch (error) {
    throw new Error(`Failed to update order: ${error.message}`);
  }
}

/**
 * Delete an order
 * @param {string} orderId - Order document ID
 * @param {string} userId - User ID (for ownership verification)
 * @returns {Promise<void>}
 */
export async function deleteOrder(orderId, userId) {
  try {
    const db = getFirestoreInstance();
    const orderRef = doc(db, COLLECTION_NAME, orderId);

    // First, verify the order exists and user owns it
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const data = orderDoc.data();

    if (data.type !== DOCUMENT_TYPE) {
      throw new Error('Document is not an order');
    }

    if (data.userId !== userId) {
      throw new Error('Unauthorized: You do not own this order');
    }

    // Delete the order
    await deleteDoc(orderRef);
  } catch (error) {
    throw new Error(`Failed to delete order: ${error.message}`);
  }
}
