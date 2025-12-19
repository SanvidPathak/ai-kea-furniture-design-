/**
 * Gemini AI Service - Modern 2025 Implementation
 * Using @google/genai (v1.30.0+) - Official Google Gen AI SDK
 *
 * Features:
 * - Dual environment support (Browser + Node.js)
 * - Structured JSON output with native JSON Schema
 * - Automatic Model Fallback for Rate Limits
 * - Gemini 2.5 Flash family support
 */

import { GoogleGenAI } from '@google/genai';

// Check if running in browser (Vite) or Node.js environment
const isBrowser = typeof window !== 'undefined';

// Get environment variables from appropriate source
const getEnvVar = (key) => {
  if (isBrowser) {
    // Browser environment - use import.meta.env
    return import.meta.env[key];
  } else {
    // Node.js environment - use process.env
    return process.env[key];
  }
};

// Initialize Gemini AI client
const apiKey = getEnvVar('VITE_GEMINI_API_KEY');

/* 
// Client-side key check disabled - using Cloud Functions
if (!apiKey || apiKey === 'your-gemini-api-key-here') {
  console.warn(
    'WARNING: Gemini API key not configured. AI features will be disabled.\n' +
    'Get your API key from: https://aistudio.google.com/app/apikey\n' +
    'Add it to .env as: VITE_GEMINI_API_KEY=your-key'
  );
}
*/

const ai = apiKey && apiKey !== 'your-gemini-api-key-here'
  ? new GoogleGenAI({ apiKey })
  : null;

// Model Fallback List (Priority Order)
// Model Fallback List (Priority Order)
const MODELS = [
  'gemini-1.5-flash',      // Latest alias
  'gemini-1.5-flash-001',  // Specific version
  'gemini-1.5-pro',        // Latest alias
  'gemma-3-27b-it',        // High capacity Gemma (Instruction Tuned)
  'gemma-3-12b-it',        // Mid capacity Gemma (Instruction Tuned)
  'gemma-3-8b-it',         // Common 8b variant if available
  'gemma-3-4b-it',         // Efficient Gemma (Instruction Tuned)
  'gemma-3-2b-it',         // Fast text tasks (Instruction Tuned)
  'gemma-3-1b-it',         // Lightweight Gemma (Instruction Tuned)
  'gemini-1.5-pro-001',    // Specific version
  'gemini-pro',            // Legacy 1.0 Pro (most widely available)
];

// ... inside generateStructuredContent ...



/**
 * Generate content using Gemini AI with structured JSON output
 *
 * @param {string} prompt - The prompt to send to Gemini
 * @param {object} schema - JSON schema for structured output
 * @param {object} options - Generation options (temperature, topP, topK)
 * @returns {Promise<object>} - Parsed JSON response
 */
// Cache for discovered models
let cachedDiscoveredModels = null;

async function discoverLocalModels() {
  if (cachedDiscoveredModels) return cachedDiscoveredModels;
  try {
    console.log('[Gemini] Discovering available models via API...');
    const found = [];
    const response = await ai.models.list();

    // Handle async iterable which is standard for @google/genai list()
    for await (const model of response) {
      // Filter for generative models (gemini/gemma) and remove 'models/' prefix
      if (model.name && (model.name.includes('gemini') || model.name.includes('gemma'))) {
        // Only include models that support generateContent
        if (model.supportedGenerationMethods?.includes('generateContent')) {
          found.push(model.name.replace('models/', ''));
        }
      }
    }

    // Sort specific priority: Flash > Pro > others
    found.sort((a, b) => {
      const aScore = a.includes('flash') ? 2 : a.includes('pro') ? 1 : 0;
      const bScore = b.includes('flash') ? 2 : b.includes('pro') ? 1 : 0;
      return bScore - aScore;
    });

    if (found.length > 0) {
      console.log('[Gemini] Discovered models:', found);
      cachedDiscoveredModels = found;
    }
    return found;
  } catch (e) {
    console.error('[Gemini] Model discovery failed:', e.message);
    return [];
  }
}

export async function generateStructuredContent(prompt, schema, options = {}) {
  // Check if AI is configured
  if (!ai) {
    throw new Error('Gemini AI not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
  }

  const {
    temperature = 0.3,
    topP = 0.8,
    topK = 40,
    maxOutputTokens = 2048,
  } = options;

  const errors = [];
  let quotaExceeded = false;

  // Combine hardcoded models with any previously discovered ones
  // If we haven't discovered yet, we'll try hardcoded first, then discover and retry
  let candidateModels = [...MODELS];
  if (cachedDiscoveredModels) {
    // Put discovered models first as they are known to exist
    candidateModels = [...new Set([...cachedDiscoveredModels, ...MODELS])];
  }

  // Helper to run the loop
  async function tryModels(modelList) {
    for (const modelName of modelList) {
      try {
        const isGemma = modelName.toLowerCase().includes('gemma');

        // Base config
        const requestConfig = {
          temperature,
          topP,
          topK,
          maxOutputTokens,
        };

        // Configure JSON mode
        // Gemma models (as of Dec 2024) do NOT support responseMimeType: 'application/json'
        // We must disable it for them and rely on prompt engineering + manual parsing
        if (!isGemma) {
          requestConfig.responseMimeType = 'application/json';
          requestConfig.responseSchema = schema;
        }

        // Adjust prompt for Gemma to ensure JSON
        let effectivePrompt = prompt;
        if (isGemma) {
          effectivePrompt += '\n\nOutput strictly valid JSON. Do not include markdown formatting or explanations. Just the JSON object.';
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: effectivePrompt,
          config: requestConfig,
        });

        let text = typeof response.text === 'function' ? response.text() : response.text;

        // Manual JSON cleanup (Gemma often adds ```json ... ``` wrapper)
        if (typeof text === 'string') {
          // Remove markdown code blocks
          text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
          // Remove any text before/after the first/last bracket if the model chatted
          const firstBrace = text.indexOf('{');
          const lastBrace = text.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            text = text.substring(firstBrace, lastBrace + 1);
          }
        }

        return JSON.parse(text);
      } catch (error) {
        errors.push(`${modelName}: ${error.message}`);
        console.warn(`[Gemini] Model ${modelName} failed:`, error.message);

        const isQuota = error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429');
        if (isQuota) quotaExceeded = true;

        // Continue to next model
      }
    }
    return null; // All failed
  }

  // 1. Try initial list
  let result = await tryModels(candidateModels);
  if (result) return result;

  // 2. If failed and we haven't discovered yet, try discovery
  if (!cachedDiscoveredModels && !quotaExceeded) {
    const discovered = await discoverLocalModels();
    if (discovered.length > 0) {
      // Filter out ones we already tried to avoid redundant calls (though simple Set merge handles it mostly)
      const newModels = discovered.filter(m => !candidateModels.includes(m));
      if (newModels.length > 0) {
        console.log('[Gemini] Retrying with discovered models...', newModels);
        result = await tryModels(newModels);
        if (result) return result;
      }
    }
  }

  // If we exhaust all models
  if (quotaExceeded) {
    throw new Error('QUOTA_EXCEEDED: You have exhausted your free daily quota for Gemini AI. Please try again tomorrow or use Manual Design Mode.');
  }

  throw new Error(`All Gemini models exhausted. Details: ${errors.join(' | ')}`);
}

/**
 * Generate text content using Gemini AI (no structured output)
 *
 * @param {string} prompt - The prompt to send to Gemini
 * @param {object} options - Generation options
 * @returns {Promise<string>} - Text response
 */
export async function generateTextContent(prompt, options = {}) {
  // Check if AI is configured
  if (!ai) {
    throw new Error('Gemini AI not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
  }

  const {
    temperature = 0.7,
    topP = 0.9,
    topK = 40,
    maxOutputTokens = 2048,
  } = options;

  let lastError = null;

  for (const modelName of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature,
          topP,
          topK,
          maxOutputTokens,
        },
      });

      return typeof response.text === 'function' ? response.text() : response.text;

    } catch (error) {
      lastError = error;
      console.warn(`[Gemini] Model ${modelName} failed (Text Mode):`, error.message);

      const isQuotaError = error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429');
      const isOverload = error.message?.includes('503') || error.message?.includes('UNAVAILABLE');
      const isNotFound = error.message?.includes('NOT_FOUND') || error.message?.includes('404');

      if (isQuotaError || isOverload || isNotFound) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(`All Gemini models exhausted. Last error: ${lastError?.message}`);
}

/**
 * Check if Gemini AI is configured and ready
 *
 * @returns {boolean} - True if AI is configured
 */
// Backend handles AI, so we are always configured
export function isGeminiConfigured() {
  return true;
}

/**
 * Get rate limiter statistics
 * (Legacy stub to prevent breaking calls)
 * @returns {object} - Mock stats
 */
export function getRateLimitStats() {
  return {
    requestsThisMinute: 0,
    requestsToday: 0,
    minuteLimit: 'Multi-Model',
    dailyLimit: 'Multi-Model',
  };
}

/**
 * Test Gemini API connection
 *
 * @returns {Promise<boolean>} - True if connection successful
 */
export async function testConnection() {
  if (!ai) {
    return false;
  }

  try {
    // Try primary model
    const response = await ai.models.generateContent({
      model: MODELS[0],
      contents: 'Hello, respond with just "OK"',
      config: {
        temperature: 0.1,
        maxOutputTokens: 10,
      },
    });

    const text = typeof response.text === 'function' ? response.text() : response.text;
    return text && typeof text === 'string' && text.toLowerCase().includes('ok');
  } catch (error) {
    console.error('Gemini connection test failed:', error.message);
    return false;
  }
}
