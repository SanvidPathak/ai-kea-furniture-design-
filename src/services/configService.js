import {
    doc,
    getDoc,
    setDoc,
    onSnapshot
} from 'firebase/firestore';
import { getFirestoreInstance } from './firestoreConfig.js';

const COLLECTION = 'settings';
const PRICING_DOC = 'pricing';

// Default values as fallback
export const DEFAULT_PRICING = {
    wood: { density: 0.6, cost: 0.051, label: 'Plywood (Standard)' }, // ₹85/sq ft
    metal: { density: 7.8, cost: 0.429, label: 'Steel (Structural)' },  // ₹55/kg
    plastic: { density: 0.9, cost: 0.108, label: 'PVC (Rigid)' },      // ₹120/kg
    laborRate: 15, // Cost multiplier or base labor per complex part
};

/**
 * Fetch site configuration once
 */
export async function getPricingConfig() {
    try {
        const db = getFirestoreInstance();
        const docRef = doc(db, COLLECTION, PRICING_DOC);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { ...DEFAULT_PRICING, ...docSnap.data() };
        }

        // If not exists, initialize with defaults
        await setDoc(docRef, DEFAULT_PRICING);
        return DEFAULT_PRICING;
    } catch (error) {
        console.error('Error fetching pricing config:', error);
        return DEFAULT_PRICING;
    }
}

/**
 * Subscribe to real-time pricing updates
 */
export function subscribeToPricing(callback) {
    const db = getFirestoreInstance();
    const docRef = doc(db, COLLECTION, PRICING_DOC);

    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ ...DEFAULT_PRICING, ...docSnap.data() });
        } else {
            callback(DEFAULT_PRICING);
        }
    });
}

/**
 * Update site pricing configuration
 */
export async function updatePricingConfig(newPricing) {
    try {
        const db = getFirestoreInstance();
        const docRef = doc(db, COLLECTION, PRICING_DOC);
        await setDoc(docRef, newPricing, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating pricing config:', error);
        throw error;
    }
}
