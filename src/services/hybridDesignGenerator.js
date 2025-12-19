/**
 * Hybrid Design Generator - Unified Interface for AI and Manual Design Generation
 *
 * Supports two modes:
 * 1. Natural Language Input - AI-powered parsing + design generation
 * 2. Manual Input - Direct structured parameters (existing functionality)
 *
 * This module provides a unified interface while preserving backward compatibility
 * with the existing designGenerator.js
 */

import { generateDesign } from './designGenerator.js';
import { isNaturalLanguageInput } from './aiDesignParser.js';
import { parseNaturalLanguage } from './apiClient.js';
import { isGeminiConfigured } from './geminiService.js';

/**
 * Generate furniture design from natural language description
 * AI-powered mode
 *
 * @param {string} userInput - Natural language description
 * @returns {Promise<object>} - Complete furniture design with AI metadata
 */
export async function generateFromNaturalLanguage(userInput) {
  try {
    // Step 1: Parse natural language with Gemini AI
    const aiParams = await parseNaturalLanguage(userInput);

    // Heuristic Override: If used "partition" keyword but AI missed it, force 'random-shelves'.
    if (userInput.toLowerCase().includes('partition') || userInput.toLowerCase().includes('divider')) {
      if (!aiParams.partitionStrategy || aiParams.partitionStrategy === 'none') {
        // If keywords like "middle", "center", "all", or "every" are present, implied intent is structured.
        if (['middle', 'center', 'all', 'every'].some(k => userInput.toLowerCase().includes(k))) {
          aiParams.partitionStrategy = 'all-shelves';
        } else {
          // Default to random for generic "partitions" request
          aiParams.partitionStrategy = 'random-shelves';
        }
      }
    }

    // Step 2: Generate design using existing deterministic algorithm
    const design = await generateDesign({
      furnitureType: aiParams.furnitureType,
      material: aiParams.material,
      dimensions: aiParams.dimensions,
      materialColor: aiParams.materialColor,
      projectedLoad: aiParams.projectedLoad, // Pass the load requirement
      hasArmrests: aiParams.hasArmrests,
      partitionStrategy: aiParams.partitionStrategy,
      partitionRatio: aiParams.partitionRatio, // 60-40, 50-50, etc.
      partitionCount: aiParams.partitionCount, // Number of partitions per shelf
      shelves: aiParams.shelfCount, // Pass horizontal shelf count
      shelfModifiers: aiParams.shelfModifiers || [], // Per-shelf overrides
    });

    // Step 3: Enhance with AI metadata
    return {
      ...design,
      // AI enhancement flags
      aiEnhanced: true,
      userQuery: userInput,
      aiConfidence: aiParams._aiMetadata?.confidence || 'medium',
      aiSuggestions: aiParams._aiMetadata?.styleNotes || '',
      generationMode: 'natural-language',
    };
  } catch (error) {
    // Provide user-friendly error messages
    if (error.message?.includes('not configured')) {
      throw new Error(
        'AI features not available: Gemini API key not configured.\n' +
        'Please use manual input mode or add your API key to .env'
      );
    } else if (error.message?.includes('Rate limit')) {
      throw new Error(
        error.message + '\n' +
        'Please use manual input mode while waiting.'
      );
    } else {
      // DEBUG: Include stack trace to identify location of "reading length" error
      console.error('Natural Language Generation Error:', error);
      throw new Error(`parsing failed: ${error.message} \nPlease try rephrasing or use manual input mode.`);
    }
  }
}

/**
 * Generate furniture design from structured parameters
 * Direct mode (existing functionality, no AI)
 *
 * @param {object} params - Structured design parameters
 * @param {string} params.furnitureType - Type of furniture
 * @param {string} params.material - Material type
 * @param {object} [params.dimensions] - Custom dimensions (optional)
 * @param {string} [params.materialColor] - Custom color (optional)
 * @returns {Promise<object>} - Complete furniture design
 */
export async function generateFromManualInput(params) {
  try {
    // Validate params
    if (!params || typeof params !== 'object') {
      throw new Error('Invalid parameters: expected object with furnitureType and material');
    }

    if (!params.furnitureType) {
      throw new Error('Missing required parameter: furnitureType');
    }

    if (!params.material) {
      throw new Error('Missing required parameter: material');
    }

    // Generate design using existing algorithm
    const design = await generateDesign(params);

    // Add metadata
    return {
      ...design,
      aiEnhanced: false,
      generationMode: 'manual',
    };
  } catch (error) {
    throw new Error(`Manual design generation failed: ${error.message}`);
  }
}

/**
 * Smart generate - automatically detects input type and uses appropriate mode
 *
 * @param {string|object} input - Natural language string or structured params object
 * @returns {Promise<object>} - Complete furniture design
 */
export async function generateDesignSmart(input) {
  // Detect input type
  if (isNaturalLanguageInput(input)) {
    // Natural language mode
    return await generateFromNaturalLanguage(input);
  } else {
    // Manual mode
    return await generateFromManualInput(input);
  }
}

/**
 * Check if AI mode is available
 *
 * @returns {boolean} - True if AI features are available
 */
export function isAIModeAvailable() {
  return isGeminiConfigured();
}

/**
 * Get available generation modes
 *
 * @returns {object} - Available modes and their status
 */
export function getAvailableModes() {
  const aiAvailable = isAIModeAvailable();

  return {
    manual: {
      available: true,
      description: 'Direct input with dropdowns/forms',
      speed: 'instant',
      accuracy: '100%',
    },
    naturalLanguage: {
      available: aiAvailable,
      description: 'Describe your furniture in plain English',
      speed: '2-4 seconds',
      accuracy: '90%+',
      requiresSetup: !aiAvailable,
      setupInstructions: aiAvailable ? null : 'Add VITE_GEMINI_API_KEY to .env',
    }
  };
}

/**
 * Get example usage for both modes
 *
 * @returns {object} - Example usage
 */
export function getUsageExamples() {
  return {
    naturalLanguage: [
      'I need a modern wooden desk for my home office, around 140cm wide',
      'Create a metal bookshelf with 5 shelves',
      'Small glass coffee table for apartment',
    ],
    manual: {
      furnitureType: 'table',
      material: 'wood',
      dimensions: { length: 120, width: 80, height: 75 },
      materialColor: '#8B4513',
    },
  };
}

// Re-export for convenience
export { generateDesign } from './designGenerator.js';
export { parseNaturalLanguage, getExamplePrompts } from './aiDesignParser.js';
export { getRateLimitStats } from './geminiService.js';
