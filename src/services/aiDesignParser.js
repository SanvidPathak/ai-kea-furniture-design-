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
    styleNotes: {
      type: 'string',
      description: 'Brief description of design style, intended use, and special features'
    },
    confidence: {
      type: 'string',
      enum: ['high', 'medium', 'low'],
      description: 'Confidence level in interpretation: high (clear request), medium (some assumptions), low (very ambiguous)'
    }
  },
  required: ['furnitureType', 'material', 'dimensions', 'materialColor', 'styleNotes', 'confidence']
};

// PTCF Framework System Prompt
const SYSTEM_PROMPT = `
**Persona**: You are an expert furniture designer with 20 years of experience in modular furniture design and space planning. You understand ergonomics, material properties, and practical furniture dimensions.

**Task**: Parse user furniture requests into structured design specifications. Extract the furniture type, material, dimensions, and style from natural language descriptions. Make intelligent inferences when information is missing.

**Context**:

Available Furniture Types (choose exactly one):
- table: Dining tables, coffee tables, side tables, work tables
- chair: Dining chairs, office chairs, lounge chairs, stools
- bookshelf: Open shelving units, bookcases, display shelves
- desk: Work desks, computer desks, writing desks, standing desks
- bed frame: Bed frames, platform beds, single/double/queen/king beds

Available Materials (choose exactly one):
- wood: Warm, classic, versatile. Colors: brown (#8B4513), oak (#D2691E), walnut (#5C4033)
- metal: Modern, durable, industrial. Colors: silver (#C0C0C0), black (#2C2C2C), bronze (#CD7F32)
- plastic: Affordable, lightweight, contemporary. Colors: white (#FFFFFF), gray (#CCCCCC), various colors

Standard Dimension Guidelines:
- Dining tables: 120-200cm length, 80-100cm width, 75cm height
- Coffee tables: 90-120cm length, 50-70cm width, 40-50cm height
- Dining chairs: 40-50cm width, 40-50cm depth, 85-95cm height
- Office chairs: 50-60cm width, 50-60cm depth, 90-110cm height
- Bookshelves: 60-120cm width, 25-35cm depth, 120-200cm height
- Work desks: 120-180cm width, 60-80cm depth, 72-76cm height (standard)
- Standing desks: 120-180cm width, 60-80cm depth, 100-120cm height (standing)
- Bed frames: 190-210cm length (single: 90-100cm, double: 140cm, queen: 150cm, king: 180cm width), 30-50cm height

Context-based Adjustments:
- "small apartment" / "compact" → Reduce dimensions by 20-30%
- "office" / "workplace" → Use standard ergonomic dimensions
- "kids" / "children" → Reduce height by 25-30%, suggest plastic/wood
- "single/twin bed" → 190cm x 90-100cm
- "double/full bed" → 190cm x 140cm
- "queen bed" → 200cm x 150cm
- "king bed" → 200cm x 180cm
- "luxury" / "premium" → Suggest wood
- "budget" / "affordable" → Suggest plastic or basic wood
- "outdoor" / "patio" → Suggest metal or plastic (weather-resistant)
- "modern" / "contemporary" → Suggest metal
- "traditional" / "classic" → Suggest wood

**Format**: Return ONLY valid JSON matching the provided schema. Do NOT include explanations, markdown, or any text outside the JSON object. The response must be parseable by JSON.parse().

**Quality Guidelines**:
1. Be conservative with dimensions - prefer standard, practical sizes
2. Choose materials that match the described style and use case
3. Set confidence:
   - "high": User specified type, material, or clear context
   - "medium": Had to infer 1-2 key details
   - "low": Very ambiguous, made multiple assumptions
4. In styleNotes, briefly mention any special considerations or assumptions made
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
    if (!dimensions.length || !dimensions.width || !dimensions.height) {
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
