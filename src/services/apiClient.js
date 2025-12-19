
/**
 * API Client for Firebase Cloud Functions
 * Replaces client-side AI parsing with server-side generation to secure API Keys.
 */
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebaseConfig.js';
import { isGeminiConfigured } from './geminiService.js'; // Keep using this for "isAvailable" checks if needed, or replace with true if backend handles it.

// Initialize Functions
// Note: set region if your functions are not in us-central1
const functions = getFunctions(app);

// Optional: Connect to emulator if needed during local dev
// import { connectFunctionsEmulator } from 'firebase/functions';
// if (window.location.hostname === 'localhost') {
//     connectFunctionsEmulator(functions, '127.0.0.1', 5015); // Default port 5001 or 5015? 5001 is standard.
// }

/**
 * Call the remote Cloud Function to parse natural language
 * Matches the signature of aiDesignParser.js:parseNaturalLanguage
 *
 * @param {string} userInput - Natural language description
 * @returns {Promise<object>} - Structured design parameters
 */
export async function parseNaturalLanguage(userInput) {
    try {
        const generateFurnitureDesign = httpsCallable(functions, 'generateFurnitureDesign');

        // Call the function
        const result = await generateFurnitureDesign({ userInput });

        // result.data contains the return value from the cloud function
        return result.data;
    } catch (error) {
        console.error('Cloud Function Error Details:', error);
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Details:', error.details);
        // Propagate error to be handled by the UI
        throw new Error(error.message || 'Failed to generate design via backend');
    }
}

/**
 * Check if the backend AI service is available
 * Since we moved to backend, we assume it is configured via Secrets.
 * But we can still check if the frontend thinks it has a key (legacy) or just return true.
 * For smooth migration, let's just return true to bypass frontend checks,
 * because the backend manages the key now.
 */
// export function isGeminiConfigured() {
//   return true;
// }
// Update: We'll stick to the existing import for checking if we want to fallback to client-side.
// But for backend-only, this function might be irrelevant.
