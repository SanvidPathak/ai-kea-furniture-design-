/**
 * Gemini AI Service - Modern 2025 Implementation
 * Using @google/genai (v1.30.0+) - Official Google Gen AI SDK
 *
 * Features:
 * - Dual environment support (Browser + Node.js)
 * - Structured JSON output with native JSON Schema
 * - Rate limiting and error handling
 * - Gemini 2.5 Flash model (optimized for structured outputs)
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

if (!apiKey || apiKey === 'your-gemini-api-key-here') {
  console.warn(
    'WARNING: Gemini API key not configured. AI features will be disabled.\n' +
    'Get your API key from: https://aistudio.google.com/app/apikey\n' +
    'Add it to .env as: VITE_GEMINI_API_KEY=your-key'
  );
}

const ai = apiKey && apiKey !== 'your-gemini-api-key-here'
  ? new GoogleGenAI({ apiKey })
  : null;

// Model selection
const MODEL_NAME = 'gemini-2.5-flash'; // Latest stable model (Gemini 1.x retired in 2025)

/**
 * Rate Limit Handler
 * Gemini 2.5 Flash free tier: 10 RPM, 250k TPM, 250 RPD
 */
class RateLimitHandler {
  constructor() {
    this.requestCount = 0;
    this.dailyCount = 0;
    this.lastReset = Date.now();
    this.dailyReset = new Date().setHours(0, 0, 0, 0); // Midnight Pacific
  }

  checkRateLimit() {
    const now = Date.now();
    const minutePassed = (now - this.lastReset) > 60000;

    // Reset minute counter
    if (minutePassed) {
      this.requestCount = 0;
      this.lastReset = now;
    }

    // Reset daily counter at midnight
    const currentDay = new Date().setHours(0, 0, 0, 0);
    if (currentDay > this.dailyReset) {
      this.dailyCount = 0;
      this.dailyReset = currentDay;
    }

    // Check limits (Gemini 2.5 Flash: 10 RPM, 250 RPD)
    if (this.requestCount >= 10) {
      const waitTime = Math.ceil((60000 - (now - this.lastReset)) / 1000);
      throw new Error(`Rate limit: Please wait ${waitTime} seconds (10 requests/minute limit)`);
    }

    if (this.dailyCount >= 250) {
      throw new Error('Daily limit reached (250 requests/day). Please try again tomorrow or use manual input mode.');
    }

    this.requestCount++;
    this.dailyCount++;
  }

  getStats() {
    return {
      requestsThisMinute: this.requestCount,
      requestsToday: this.dailyCount,
      minuteLimit: 10,
      dailyLimit: 250,
    };
  }
}

const rateLimiter = new RateLimitHandler();

/**
 * Generate content using Gemini AI with structured JSON output
 *
 * @param {string} prompt - The prompt to send to Gemini
 * @param {object} schema - JSON schema for structured output
 * @param {object} options - Generation options (temperature, topP, topK)
 * @returns {Promise<object>} - Parsed JSON response
 */
export async function generateStructuredContent(prompt, schema, options = {}) {
  // Check if AI is configured
  if (!ai) {
    throw new Error('Gemini AI not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
  }

  // Check rate limits
  rateLimiter.checkRateLimit();

  try {
    const {
      temperature = 0.3, // Lower = more consistent/deterministic
      topP = 0.8,
      topK = 40,
      maxOutputTokens = 2048,
    } = options;

    // Generate content with structured output
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature,
        topP,
        topK,
        maxOutputTokens,
      },
    });

    // Parse JSON response
    const text = typeof response.text === 'function' ? response.text() : response.text;
    return JSON.parse(text);
  } catch (error) {
    // Enhanced error handling
    if (error.message?.includes('PERMISSION_DENIED')) {
      throw new Error('Invalid Gemini API key. Please check your VITE_GEMINI_API_KEY in .env');
    } else if (error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Gemini API quota exceeded. Please try again later or upgrade your plan.');
    } else if (error.message?.includes('Rate limit')) {
      // Re-throw rate limit errors as-is
      throw error;
    } else {
      throw new Error(`Gemini AI error: ${error.message}`);
    }
  }
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

  // Check rate limits
  rateLimiter.checkRateLimit();

  try {
    const {
      temperature = 0.7,
      topP = 0.9,
      topK = 40,
      maxOutputTokens = 2048,
    } = options;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
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
    // Enhanced error handling
    if (error.message?.includes('PERMISSION_DENIED')) {
      throw new Error('Invalid Gemini API key. Please check your VITE_GEMINI_API_KEY in .env');
    } else if (error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Gemini API quota exceeded. Please try again later or upgrade your plan.');
    } else if (error.message?.includes('Rate limit')) {
      // Re-throw rate limit errors as-is
      throw error;
    } else {
      throw new Error(`Gemini AI error: ${error.message}`);
    }
  }
}

/**
 * Check if Gemini AI is configured and ready
 *
 * @returns {boolean} - True if AI is configured
 */
export function isGeminiConfigured() {
  return ai !== null;
}

/**
 * Get rate limiter statistics
 *
 * @returns {object} - Current rate limit stats
 */
export function getRateLimitStats() {
  return rateLimiter.getStats();
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
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
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
