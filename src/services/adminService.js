/**
 * Admin Service - specialized operations for Admin Studio
 * Requires 'admin' role (secured by Firestore Rules / UI Logic)
 */

import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    doc,
    updateDoc,
    serverTimestamp,
    getDoc,
    onSnapshot
} from 'firebase/firestore';
import { getFirestoreInstance } from './firestoreConfig.js';

const COLLECTION_NAME = 'mydb';

/**
 * Fetch ALL orders across the system (One-time fetch)
 * @returns {Promise<Array>} List of all orders
 */
export async function getAllOrders() {
    try {
        const db = getFirestoreInstance();
        // REMOVED orderBy to avoid Composite Index creation requirement for now
        const q = query(
            collection(db, COLLECTION_NAME),
            where('type', '==', 'order')
        );

        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure dates are convertible
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }));

        // Sort client-side
        return docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
        console.error('Admin Fetch Error:', error);
        throw new Error('Failed to fetch system orders.');
    }
}

/**
 * Subscribe to ALL orders for Real-Time Updates
 * @param {Function} onUpdate - Callback function receiving the list of orders
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAllOrders(onUpdate) {
    const db = getFirestoreInstance();
    const q = query(
        collection(db, COLLECTION_NAME),
        where('type', '==', 'order')
    );

    return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }));

        // Sort client-side
        const sortedDocs = docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        onUpdate(sortedDocs);
    }, (error) => {
        console.error('Admin Subscription Error:', error);
    });
}


/**
 * Admin Simulation: Manually update order status
 * @param {string} orderId 
 * @param {string} newStatus 
 * @param {Array} currentHistory 
 */
export async function updateOrderStatus(orderId, newStatus, currentHistory = []) {
    console.log(`Simulating status update: ${orderId} -> ${newStatus}`);
    try {
        const db = getFirestoreInstance();
        const orderRef = doc(db, COLLECTION_NAME, orderId);

        // Ensure history is an array
        const validHistory = Array.isArray(currentHistory) ? currentHistory : [];

        // Append to history
        const updatedHistory = [
            ...validHistory,
            { status: newStatus, timestamp: new Date(), note: 'Admin Simulation Update' }
        ];

        await updateDoc(orderRef, {
            status: newStatus,
            statusHistory: updatedHistory,
            updatedAt: serverTimestamp()
        });

        console.log('Update success');
        return { id: orderId, status: newStatus, statusHistory: updatedHistory };
    } catch (error) {
        console.error('Update Failed:', error);
        throw new Error(`Failed to update status to ${newStatus}: ${error.message}`);
    }
}
