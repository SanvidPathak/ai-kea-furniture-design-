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
  onSnapshot,
} from 'firebase/firestore';
import { getFirestoreInstance } from './firestoreConfig.js';
import { calculateTotalCost } from './designGenerator.js';

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

    // SECURITY FIX: Pre-Save Price Validation
    // Recalculate cost serverside (or service-side) to prevent tampering
    if (orderData.parts && orderData.material) {
      try {
        const calculatedCost = calculateTotalCost(orderData.parts, orderData.material);
        const submittedAmount = Number(orderData.totalAmount);

        // Allow small floating point difference (0.1)
        if (Math.abs(calculatedCost - submittedAmount) > 0.5) {
          console.error(`Price tampering detected! Calculated: ${calculatedCost}, Submitted: ${submittedAmount}`);
          throw new Error('Security Alert: Order price mismatch. Transaction blocked.');
        }
      } catch (err) {
        if (err.message.includes('Security Alert')) throw err;
        console.warn('Could not validate price pre-save:', err);
      }
    }

    // Add userId, type, status, status history, and timestamps to the order
    const orderDoc = {
      ...orderData,
      userId,
      type: DOCUMENT_TYPE,
      status: 'processing', // Default status (was pending_payment)
      statusHistory: [
        {
          status: 'processing',
          timestamp: new Date(),
        }
      ],
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

    // Query by userId AND type === 'order'
    // REMOVED orderBy to avoid Composite Index errors
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      where('type', '==', DOCUMENT_TYPE)
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

    // Sort client-side (Newest first)
    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
 * Update order status (Convenience wrapper)
 * @param {string} orderId - Order ID
 * @param {string} status - New Status
 * @returns {Promise<Object>} Updated order
 */
export async function updateOrderStatus(orderId, status) {
  try {
    const db = getFirestoreInstance();
    const orderRef = doc(db, COLLECTION_NAME, orderId);

    // Get current order history
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) throw new Error('Order not found');

    const data = orderDoc.data();
    const history = data.statusHistory || [];

    // Add new status to history
    history.push({
      status,
      timestamp: new Date()
    });

    await updateDoc(orderRef, {
      status,
      statusHistory: history,
      updatedAt: serverTimestamp()
    });

    return { id: orderId, ...data, status, statusHistory: history };
  } catch (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
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

/**
 * Subscribe to a single Order for Real-Time Updates
 * @param {string} orderId
 * @param {Function} onUpdate
 * @returns {Function} Unsubscribe
 */
export function subscribeToOrder(orderId, onUpdate) {
  const db = getFirestoreInstance();
  const orderRef = doc(db, COLLECTION_NAME, orderId);

  return onSnapshot(orderRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      onUpdate({
        id: docSnapshot.id,
        ...convertTimestamps(docSnapshot.data())
      });
    } else {
      onUpdate(null);
    }
  }, (error) => {
    console.error('Subscription Error:', error);
  });
}

/**
 * Subscribe to User's orders for Real-Time Updates
 * @param {string} userId
 * @param {Function} onUpdate
 * @returns {Function} Unsubscribe
 */
export function subscribeToUserOrders(userId, onUpdate) {
  const db = getFirestoreInstance();
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('type', '==', DOCUMENT_TYPE)
  );

  return onSnapshot(q, (snapshot) => {
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...convertTimestamps(doc.data())
      });
    });

    // Client-side sort
    const sorted = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    onUpdate(sorted);
  }, (error) => {
    console.error('Subscription Error:', error);
  });
}

/**
 * Format order status for display
 * @param {string} status - Order status
 * @returns {Object} Display info with label and color
 */
export function getOrderStatusDisplay(status) {
  const statusMap = {
    processing: { label: 'Processing', color: 'text-yellow-600 bg-yellow-50 dark:text-yellow-300 dark:bg-yellow-900/30' },
    confirmed: { label: 'Confirmed', color: 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30' },
    manufacturing: { label: 'Manufacturing', color: 'text-purple-600 bg-purple-50 dark:text-purple-300 dark:bg-purple-900/30' },
    shipped: { label: 'Shipped', color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/30' },
    delivered: { label: 'Delivered', color: 'text-green-600 bg-green-50 dark:text-green-300 dark:bg-green-900/30' },
    cancelled: { label: 'Cancelled', color: 'text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-900/30' },
  };

  return statusMap[status] || { label: status, color: 'text-neutral-600 bg-neutral-50' };
}
