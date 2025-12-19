
// Usage: node test-functions.js
// This script assumes you have deployed the functions or are running the emulator.

import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import 'dotenv/config'; // Load .env for Firebase config

// Mock environment for testing if .env not loaded by Vite
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    // ... other config not strictly needed for functions calls usually, 
    // but projectId is critical for region discovery.
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("❌ Error: Missing Firebase configuration in .env");
    console.log("Please ensure VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID are in your .env file.");
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Uncomment if testing against Emulator
// import { connectFunctionsEmulator } from 'firebase/functions';
// connectFunctionsEmulator(functions, '127.0.0.1', 5001);

async function testBackend() {
    console.log("🚀 Testing 'generateFurnitureDesign' Cloud Function...");
    console.log("Input: 'A red wooden chair'");

    try {
        const generateFurnitureDesign = httpsCallable(functions, 'generateFurnitureDesign');
        const result = await generateFurnitureDesign({ userInput: 'A red wooden chair' });

        console.log("\n✅ Success! Received response from backend:");
        console.log(JSON.stringify(result.data, null, 2));

        // Simple validation
        if (result.data.furnitureType === 'chair' && result.data.material === 'wood') {
            console.log("\n✨ Verification Passed: Output matches expected structure.");
        } else {
            console.warn("\n⚠️ Output structure looks unexpected. Please review JSON above.");
        }

    } catch (error) {
        console.error("\n❌ Function Call Failed:");
        console.error(error.message);
        console.log("\nTroubleshooting:");
        console.log("1. Did you run 'firebase deploy --only functions'?");
        console.log("2. Is the 'GEMINI_API_KEY' secret set in Firebase? (firebase functions:secrets:set GEMINI_API_KEY)");
    }
}

testBackend();
