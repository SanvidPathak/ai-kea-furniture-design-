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
    bedSize: {
      type: 'string',
      enum: ['Single', 'Twin', 'Twin XL', 'Double', 'Full', 'Queen', 'King', 'Super King', 'California King'],
      description: 'Standard bed size name if specified (e.g., "Queen", "King").'
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
      enum: ['none', 'equal', 'ratio', 'random', 'all-shelves', 'random-shelves'],
      description: 'Strategy for vertical partitions. Default to "none" (no partitions) unless explicitly requested.'
    },
    partitionRatio: {
      type: 'string',
      description: 'Split ratio string defining the relative or absolute size of compartments. Examples: "3:2:5", "1:2", "50-50", "30-70".'
    },
    'partitionCount': {
      type: 'integer',
      description: 'Number of vertical partitions per shelf. Default is 1.'
    },
    shelfCount: {
      type: 'integer',
      description: 'Number of horizontal shelves requested. Optional. If unspecified, auto-calculated.'
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
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of alerts/warnings about ambiguity or physical constraints to show the user.'
    },
    storageType: {
      type: 'string',
      enum: ['open-compartment'],
      description: 'Type of storage. Note: Drawers are NOT supported. Default to "open-compartment".'
    },
    storageLocation: {
      type: 'string',
      enum: ['under-top', 'side-left', 'side-right'],
      description: 'Location of the storage unit.'
    },
    sideStorage: {
      type: 'string',
      enum: ['none', 'left', 'right', 'both'],
      description: 'Vertical storage compartments replacing legs on either side. Can be used IN ADDITION to storageLocation (under-top).'
    },
    sideShelves: {
      type: 'object',
      properties: {
        left: { type: 'integer', description: 'Number of shelves for left side storage. Default 2.' },
        right: { type: 'integer', description: 'Number of shelves for right side storage. Default 2.' }
      },
      description: 'Specific shelf counts for side storage units.'
    },
    sideStorageWidth: {
      type: 'integer',
      description: 'Width/Length of the side storage unit (tower) in cm. Default is 40.'
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
- Desk: length 120-180, width 60-80.
- Bookshelf: length 60-120, width 25-35, height 150-220.
- Bed Sizes (Mattress): Single/Twin (90x190), Double/Full (137x190), Queen (160x200 EU / 152x203 US), King (180x200 EU / 193x203 US).
- **Bed Logic**: 
  - If user says "Queen Bed", set bedSize: "Queen". 
  - If user says "Bed for 200x200 mattress", set dimensions: { "length": 200, "width": 200, "height": 40 }.
  - **Mattress Matches**: If user gives dims, they are MATTRESS dims. Frame will be larger.
- "small" -> -20% size. "kids" -> -30% height.
- Extract load/weight capacity if mentioned (e.g. "for 200kg" -> projectedLoad: 200)
- Extract SHELF COUNT if mentioned (e.g. "7 shelves" -> shelfCount: 7).
- Extract SIDE STORAGE WIDTH if mentioned (e.g. "50cm wide shelves" -> sideStorageWidth: 50).

**Instructions**:
- Return ONLY valid JSON matching this exact structure.
- **CRITICAL: Bookshelf Partitions**:
  - **Terminology**: "Partitions" = "Dividers" (Physical Boards). "2 partitions" = 2 boards.
  - **Strategy**: Default "none". Only use "all-shelves" if explicitly asked.
  - **Indexing**: 1-based, Top-down. "Top" = Shelf 1. "Bottom" = Last Shelf.
  - **Indexing Patterns**: Support "odd", "even", "every 2nd", "range 2-4".
  - **Specific vs Global**: Specific rules (\`shelfModifiers\`) OVERRIDE global settings.
  
  - **"shelfModifiers"**: Use this for specific shelf rules.
    - If user specifies rules for SOME shelves, set "partitionStrategy": "none".
    - Example: "Top shelf 2 sections" -> 
      partitionStrategy: "none",
      shelfModifiers: [{ "target": "top", "count": 2 }]
    - Target: "top", "bottom", "rest", "odd", "even", or index "1", "2"...
    - **Resolution Rule**: If a specific shelf matches multiple rules (e.g. "Range 1-3" and "Shelf 2"), you MUST output BOTH rules in the list. Do not try to merge or optimize them. The engine prioritizes specific targets (e.g. '2') over patterns (e.g. 'range').
  - **Desk Storage**:
    - "Partitions" refer to vertical dividers in the open storage.
    - Default: 0 partitions (Open space).
    - If user asks for "partitions" without number: Set \`partitionCount: 1\`, \`partitionStrategy: 'equal'\`.
    - If user asks for specific number (e.g. "1 partition"): Set \`partitionCount: 1\`, \`partitionStrategy: 'equal'\`.
    - CRITICAL: If partitionCount > 0, you MUST set partitionStrategy to 'equal' (or 'ratio'). Never leave it as 'none'.
    - **Ratios**: If user specifies a ratio (e.g. "3:2:5" or "1 to 2"), set \`partitionRatio: "3:2:5"\` and \`partitionStrategy: 'ratio'\`. The \`partitionCount\` will be auto-calculated from the ratio.
    - Support \`partitionStrategy: 'random'\`.
  - **Desk Side Storage (Vertical Towers)**:
    - Keywords: "vertical compartments", "tower", "shelf on left", "storage on right", "side shelves", "bookcase desk".
    - Action: Set \`sideStorage\` to 'left', 'right', or 'both'.
    - **Shelf Count**: If user says "3 shelves on left", set \`sideShelves: { left: 3 }\`. Default is 2.
    - **CRITICAL SEMANTIC RULE**: For Desks:
      - "Shelves" always implies **Side Storage**.
      - "Partitions" always implies **Under-Desk Storage**.
      - Example: "Desk with 3 shelves" -> Side Storage with 3 shelves. (NOT partitions).
      - Example: "Desk with 3 partitions" -> Under-Desk Storage with 3 dividers. (NOT towers).
    - If side storage is present, \`partitionCount\` (under-desk) usually defaults to 0 unless explicitly asked for (e.g. "side tower AND drawers under desk").
  - **No Drawers Policy**:
    - Drawers are **NOT** available.
    - If user asks for "drawers", you must:
      1. Set \`storageType\` to "open-compartment".
      2. **Crucial**: Add a warning to \`warnings\`: "Drawers are not available. Replaced with open compartments."
  - **Ambiguity & Warnings**:
    - If the design seems suspended/floating, default to standard legs.
    - If the design seems physically impossible (e.g. "100 shelves"), add a warning.

JSON Examples:

Example 1 (Simple / No Partitions):
{
  "furnitureType": "table",
  "material": "wood",
  "materialColor": "#8B4513",
  "dimensions": { "length": 120, "width": 60, "height": 75 },
  "partitionStrategy": "none",
  "partitionCount": 0,
  "shelfModifiers": [],
  "warnings": []
}

Example 2 (Complex Bookshelf):
{
  "furnitureType": "bookshelf",
  "material": "wood",
  "materialColor": "#5C4033",
  "dimensions": { "length": 90, "width": 30, "height": 180 },
  "partitionStrategy": "none",
  "partitionCount": 1,
  "shelfModifiers": [
     { "target": "1", "count": 3 },
     { "target": "bottom", "count": 2, "ratio": "60-40" }
  ],
  "shelfCount": 5,
  "warnings": []
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
      'Gemini AI not configured. Please add your API key to .env as VITE_GEMINI_API_KEY.\\n' +
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
    const fullPrompt = `${SYSTEM_PROMPT}\\n\\n**User Request**: "${userInput.trim()}"\\n\\nParse this request and return the structured JSON.`;

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
      bedSize: result.bedSize, // Pass through bed size
      material: result.material,
      dimensions: {
        length: result.dimensions.length,
        width: result.dimensions.width,
        height: result.dimensions.height,
      },
      materialColor: result.materialColor,
      projectedLoad: result.projectedLoad,
      hasArmrests: result.hasArmrests,
      // Rule: If specific shelf modifiers exist, we MUST enforce 'none' strategy globally
      // to prevents the default behavior (all-shelves) from polluting the non-modified shelves.
      partitionStrategy: (result.shelfModifiers && result.shelfModifiers.length > 0) ? 'none' : result.partitionStrategy,
      partitionRatio: result.partitionRatio,
      partitionCount: result.partitionCount,
      shelfCount: result.shelfCount,
      shelfModifiers: result.shelfModifiers,
      sideStorage: result.sideStorage,
      sideShelves: result.sideShelves,
      sideStorageWidth: result.sideStorageWidth,
      warnings: (() => {
        const warnings = result.warnings || [];
        // ambiguity validation logic
        if (result.shelfModifiers) {
          result.shelfModifiers.forEach(mod => {
            if (mod.ratio && mod.count) {
              // Check consistency
              // If ratio has '-' check segments
              const segments = mod.ratio.split(/[-:]/).length;
              // Count = Sections (Spaces). Segments = Sections.
              // They should match.
              if (segments > 1 && segments !== mod.count) {
                warnings.push(`Ambiguity detected on ${mod.target} shelf: 'Count ${mod.count}' contradicts 'Ratio ${mod.ratio}' (${segments} parts). System prioritized Ratio.`);
              }
            }
          });
        }
        return warnings;
      })(),
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
