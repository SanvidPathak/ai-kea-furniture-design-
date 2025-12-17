/**
 * AI Design Parser - Natural Language to Structured Design Parameters
 * Using PTCF Framework (Persona · Task · Context · Format) - 2025 Best Practice
 *
 * Converts user's natural language furniture requests into structured design parameters
 * for the design generator.
 */

import { generateStructuredContent, isGeminiConfigured } from './geminiService.js';

// JSON Schema for furniture design parameters
// This ensures Gemini returns exactly the format we need
const FURNITURE_DESIGN_SCHEMA = {
  type: 'object',
  properties: {
    furnitureType: {
      type: 'string',
      enum: ['table', 'chair', 'bookshelf', 'desk', 'bed frame'],
      description: 'Type of furniture to design - must be one of the supported types'
    },
    material: {
      type: 'string',
      enum: ['wood', 'metal', 'plastic'],
      description: 'Primary construction material - must be one of the supported materials'
    },
    dimensions: {
      type: 'object',
      properties: {
        length: {
          type: 'integer',
          description: 'Length/width in centimeters (front-to-back or side-to-side)'
        },
        width: {
          type: 'integer',
          description: 'Width/depth in centimeters (perpendicular to length)'
        },
        height: {
          type: 'integer',
          description: 'Height in centimeters (floor to top)'
        }
      },
      required: ['length', 'width', 'height'],
      description: 'Physical dimensions in centimeters - use practical, standard sizes'
    },
    materialColor: {
      type: 'string',
      description: 'Hex color code for the material (e.g., #8B4513 for wood brown)',
      pattern: '^#[0-9A-Fa-f]{6}$'
    },
    projectedLoad: {
      type: 'integer',
      description: 'Maximum expected load/weight capacity in kg (default 100 for chairs, 50 for tables)',
      minimum: 10,
      maximum: 2000
    },
    hasArmrests: {
      type: 'boolean',
      description: 'Whether the furniture (specifically chairs) should have arm rests'
    },
    styleNotes: {
      type: 'string',
      description: 'Brief description of design style, intended use, and special features'
    },
    confidence: {
      type: 'string',
      enum: ['high', 'medium', 'low'],
      description: 'Confidence level in interpretation: high (clear request), medium (some assumptions), low (very ambiguous)'
    },
    partitionStrategy: {
      type: 'string',
      enum: ['none', 'all-shelves', 'random-shelves'],
      description: 'Strategy for vertical partitions. Default to "none" unless explicitly requested. Use "all-shelves" or "random-shelves" only if user asks for partitions.'
    },
    partitionRatio: {
      type: 'string',
      description: 'Split ratio for partitions (e.g., "50-50", "30-70", "33-33-33"). Default is "50-50" (center).'
    },
    partitionCount: {
      type: 'integer',
      description: 'Number of vertical partitions per shelf. Default is 1.'
    },
    shelfModifiers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'Target shelf: "top", "bottom", "rest", or "0", "1", "2" (index)' },
          count: { type: 'integer' },
          ratio: { type: 'string' }
        }
      },
      description: 'Specific rules for individual shelves. Overrides global settings.'
    }
  },
  required: ['furnitureType', 'material', 'dimensions', 'materialColor', 'styleNotes', 'confidence', 'projectedLoad', 'partitionStrategy']
};

// PTCF Framework System Prompt (Optimized v2)
const SYSTEM_PROMPT = `
**Role**: Expert furniture designer.
**Task**: JSON Parse user intent into design specs. Inferences allowed.

**Context**:
Types: table, chair, bookshelf, desk, bed frame.
Materials: wood (#8B4513), metal (#2C2C2C), plastic (#FFFFFF).

**Guidelines**:
- Dining Table: 120-200Lx80-100W | Coffee: 90-120Lx50-70W
- Desk: length 120-180, width 60-80.
- Bookshelf: length 60-120, width 25-35, height 150-220.
- Bed: Single 190x90, Double 190x140, Queen 200x150
- "small" -> -20% size. "kids" -> -30% height.
- Extract load/weight capacity if mentioned (e.g. "for 200kg" -> projectedLoad: 200)

**Instructions**:
- Return ONLY valid JSON matching this exact structure.
- **CRITICAL: Bookshelf Partitions**:
  - If user implies partitions, set "partitionStrategy": "all-shelves" or "random-shelves".
  - "partitionCount": Number of partitions per shelf (default 1).
  - "partitionRatio": Global ratio (e.g. "50-50", "60-40").
  - **"shelfModifiers"**: Use this for ANY specific shelf rules (top, bottom, middle, rest).
    - Example: "Top shelf 2 partitions, rest 60-40" -> 
      shelfModifiers: [{ "target": "top", "count": 2 }, { "target": "rest", "ratio": "60-40" }]
    - "target": "top", "bottom", "rest", or index "0", "1"...

JSON Example:
{
  "furnitureType": "table",
  "material": "wood",
  "materialColor": "#8B4513",
  "dimensions": { "length": 120, "width": 60, "height": 75 },
  "styleNotes": "Modern style",
  "confidence": "high",
  "projectedLoad": 50,
  "hasArmrests": false,
  "partitionStrategy": "all-shelves",
  "partitionRatio": "60-40",
  "partitionCount": 1,
  "shelfModifiers": [
     { "target": "top", "count": 2, "ratio": "33-33-33" },
     { "target": "bottom", "count": 0 },
     { "target": "rest", "ratio": "60-40" }
  ]
}
`;

/**
 * Parse natural language furniture request into structured parameters
 *
 * @param {string} userInput - Natural language description of desired furniture
 * @returns {Promise<object>} - Structured design parameters
 * @throws {Error} - If AI is not configured or parsing fails
 */
export async function parseNaturalLanguage(userInput) {
  // Check if Gemini is configured
  if (!isGeminiConfigured()) {
    throw new Error(
      'Gemini AI not configured. Please add your API key to .env as VITE_GEMINI_API_KEY.\n' +
      'Get your key from: https://aistudio.google.com/app/apikey'
    );
  }

  // Validate input
  if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
    throw new Error('Please provide a description of the furniture you want');
  }

  if (userInput.trim().length < 5) {
    throw new Error('Please provide a more detailed description (at least 5 characters)');
  }

  try {
    // Construct full prompt
    const fullPrompt = `${SYSTEM_PROMPT}\n\n**User Request**: "${userInput.trim()}"\n\nParse this request and return the structured JSON.`;

    // Generate structured output using Gemini
    const result = await generateStructuredContent(
      fullPrompt,
      FURNITURE_DESIGN_SCHEMA,
      {
        temperature: 0.3, // Low temperature for consistent, predictable output
        topP: 0.8,
        topK: 40,
      }
    );

    // Validate result
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response from AI - expected structured object');
    }

    // Validate required fields
    const requiredFields = ['furnitureType', 'material', 'dimensions'];
    for (const field of requiredFields) {
      if (!result[field]) {
        throw new Error(`AI response missing required field: ${field}`);
      }
    }

    // Validate dimensions
    const { dimensions } = result;
    if (!dimensions || !dimensions.length || !dimensions.width || !dimensions.height) {
      throw new Error('AI response missing complete dimensions');
    }

    // Ensure dimensions are reasonable (sanity check)
    if (dimensions.length < 10 || dimensions.length > 500 ||
      dimensions.width < 10 || dimensions.width > 500 ||
      dimensions.height < 10 || dimensions.height > 500) {
      throw new Error('AI suggested unrealistic dimensions - please provide more specific measurements');
    }

    // Return parsed parameters (remove confidence and styleNotes for design generator)
    return {
      furnitureType: result.furnitureType,
      material: result.material,
      dimensions: {
        length: result.dimensions.length,
        width: result.dimensions.width,
        height: result.dimensions.height,
      },
      materialColor: result.materialColor,
      projectedLoad: result.projectedLoad,
      hasArmrests: result.hasArmrests,
      partitionStrategy: result.partitionStrategy,
      partitionRatio: result.partitionRatio,
      partitionCount: result.partitionCount,
      shelfModifiers: result.shelfModifiers,
      // Store AI metadata for display
      _aiMetadata: {
        styleNotes: result.styleNotes,
        confidence: result.confidence,
        originalQuery: userInput,
      }
    };
  } catch (error) {
    // Enhanced error messages
    if (error.message?.includes('Rate limit')) {
      throw error; // Pass through rate limit errors
    } else if (error.message?.includes('not configured')) {
      throw error; // Pass through configuration errors
    } else if (error.message?.includes('API key')) {
      throw error; // Pass through API key errors
    } else {
      throw new Error(`Failed to parse furniture request: ${error.message}`);
    }
  }
}

/**
 * Validate if input is likely a natural language request vs. structured params
 *
 * @param {string|object} input - User input
 * @returns {boolean} - True if likely natural language
 */
export function isNaturalLanguageInput(input) {
  // If it's an object, it's already structured
  if (typeof input === 'object') {
    return false;
  }

  // If it's a string
  if (typeof input === 'string') {
    const normalized = input.toLowerCase().trim();

    // Check for natural language indicators
    const naturalLanguageIndicators = [
      'i need', 'i want', 'create', 'design', 'make', 'build',
      'for my', 'for the', 'with', 'that has',
      'small', 'large', 'modern', 'traditional',
      'office', 'home', 'apartment', 'room',
    ];

    return naturalLanguageIndicators.some(indicator => normalized.includes(indicator));
  }

  return false;
}

/**
 * Get example prompts for users
 *
 * @returns {Array<string>} - Example prompts
 */
export function getExamplePrompts() {
  return [
    'I need a modern wooden desk for my home office, around 140cm wide',
    'Create a metal bookshelf with 5 shelves, minimalist style',
    'Design a comfortable dining table for 6 people',
    'Small glass coffee table for my apartment',
    'Standing desk for a small workspace',
    'Kids study desk with storage',
    'Outdoor patio table, weather-resistant',
    'Luxury wooden cabinet for living room',
  ];
}
