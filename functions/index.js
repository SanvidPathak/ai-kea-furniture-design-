const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenAI } = require("@google/genai");
const Razorpay = require("razorpay");

// Define Secret for API Key
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");

// --- LOGIC FROM aiDesignParser.js ---

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
        }
    },
    required: ['furnitureType', 'material', 'dimensions', 'materialColor', 'styleNotes', 'confidence', 'projectedLoad', 'partitionStrategy']
};

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
- "small" -> -20% size. "kids" -> -30% height.
- Extract load/weight capacity if mentioned (e.g. "for 200kg" -> projectedLoad: 200)
- Extract SHELF COUNT if mentioned (e.g. "7 shelves" -> shelfCount: 7).

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
    - If user asks for specific number (e.g. "3 partitions"): Set \`partitionCount: 3\`, \`partitionStrategy: 'equal'\`.
    - **Ratios**: If user specifies a ratio (e.g. "3:2:5" or "1 to 2"), set \`partitionRatio: "3:2:5"\` and \`partitionStrategy: 'ratio'\`. The \`partitionCount\` will be auto-calculated from the ratio.
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

// --- LOGIC FROM geminiService.js ---

const MODELS = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-001',
    'gemini-1.5-pro',
    'gemma-3-27b-it',
    'gemma-3-12b-it',
    'gemma-3-8b-it',
    'gemma-3-4b-it',
    'gemma-3-2b-it',
    'gemma-3-1b-it',
    'gemini-1.5-pro-001',
    'gemini-pro',
];

let cachedDiscoveredModels = null;

async function discoverLocalModels(ai) {
    if (cachedDiscoveredModels) return cachedDiscoveredModels;
    try {
        const found = [];
        const response = await ai.models.list();
        // Handle async iterable which is standard for @google/genai list()
        for await (const model of response) {
            if (model.name && (model.name.includes('gemini') || model.name.includes('gemma'))) {
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
            cachedDiscoveredModels = found;
        }
        return found;
    } catch (e) {
        console.error('[Gemini Backend] Model discovery failed:', e.message);
        return [];
    }
}

async function generateStructuredContent(ai, prompt, schema, options = {}) {
    const {
        temperature = 0.3,
        topP = 0.8,
        topK = 40,
        maxOutputTokens = 2048,
    } = options;

    const errors = [];
    let quotaExceeded = false;

    let candidateModels = [...MODELS];
    if (cachedDiscoveredModels) {
        candidateModels = [...new Set([...cachedDiscoveredModels, ...MODELS])];
    }

    async function tryModels(modelList) {
        for (const modelName of modelList) {
            try {
                const isGemma = modelName.toLowerCase().includes('gemma');

                const requestConfig = {
                    temperature,
                    topP,
                    topK,
                    maxOutputTokens,
                };

                if (!isGemma) {
                    requestConfig.responseMimeType = 'application/json';
                    requestConfig.responseSchema = schema;
                }

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

                if (typeof text === 'string') {
                    text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
                    const firstBrace = text.indexOf('{');
                    const lastBrace = text.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1) {
                        text = text.substring(firstBrace, lastBrace + 1);
                    }
                }

                return JSON.parse(text);
            } catch (error) {
                errors.push(`${modelName}: ${error.message}`);
                console.warn(`[Gemini Backend] Model ${modelName} failed:`, error.message);

                const isQuota = error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429');
                if (isQuota) quotaExceeded = true;
            }
        }
        return null;
    }

    // 1. Try initial list
    let result = await tryModels(candidateModels);
    if (result) return result;

    // 2. Discover and retry
    if (!cachedDiscoveredModels && !quotaExceeded) {
        const discovered = await discoverLocalModels(ai);
        if (discovered.length > 0) {
            const newModels = discovered.filter(m => !candidateModels.includes(m));
            if (newModels.length > 0) {
                result = await tryModels(newModels);
                if (result) return result;
            }
        }
    }

    if (quotaExceeded) {
        throw new HttpsError('resource-exhausted', 'You have exhausted your free daily quota for Gemini AI.');
    }

    throw new HttpsError('internal', `All Gemini models exhausted. Details: ${errors.join(' | ')}`);
}

// --- CLOUD FUNCTION ---

exports.generateFurnitureDesign = onCall({ secrets: [geminiApiKey] }, async (request) => {
    const userInput = request.data.userInput;
    const apiKey = geminiApiKey.value();

    if (!apiKey) {
        throw new HttpsError('failed-precondition', 'Gemini API key is missing.');
    }

    const ai = new GoogleGenAI({ apiKey });

    // Validate input (Logic from aiDesignParser.js)
    if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
        throw new HttpsError('invalid-argument', 'Please provide a description of the furniture you want');
    }

    if (userInput.trim().length < 5) {
        throw new HttpsError('invalid-argument', 'Please provide a more detailed description (at least 5 characters)');
    }

    try {
        const fullPrompt = `${SYSTEM_PROMPT}\n\n**User Request**: "${userInput.trim()}"\n\nParse this request and return the structured JSON.`;

        const result = await generateStructuredContent(
            ai,
            fullPrompt,
            FURNITURE_DESIGN_SCHEMA,
            {
                temperature: 0.3,
                topP: 0.8,
                topK: 40,
            }
        );

        if (!result || typeof result !== 'object') {
            throw new HttpsError('internal', 'Invalid response from AI - expected structured object');
        }

        const requiredFields = ['furnitureType', 'material', 'dimensions'];
        for (const field of requiredFields) {
            if (!result[field]) {
                throw new HttpsError('internal', `AI response missing required field: ${field}`);
            }
        }

        const { dimensions } = result;
        if (!dimensions || !dimensions.length || !dimensions.width || !dimensions.height) {
            throw new HttpsError('internal', 'AI response missing complete dimensions');
        }

        // Sanity check
        if (dimensions.length < 10 || dimensions.length > 500 ||
            dimensions.width < 10 || dimensions.width > 500 ||
            dimensions.height < 10 || dimensions.height > 500) {
            throw new HttpsError('out-of-range', 'AI suggested unrealistic dimensions - please provide more specific measurements');
        }

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
            partitionStrategy: (result.shelfModifiers && result.shelfModifiers.length > 0) ? 'none' : result.partitionStrategy,
            partitionRatio: result.partitionRatio,
            partitionCount: result.partitionCount,
            shelfCount: result.shelfCount,
            shelfModifiers: result.shelfModifiers,
            storageType: result.storageType,
            storageLocation: result.storageLocation,
            warnings: (() => {
                const warnings = result.warnings || [];
                if (result.shelfModifiers) {
                    result.shelfModifiers.forEach(mod => {
                        if (mod.ratio && mod.count) {
                            const segments = mod.ratio.split(/[-:]/).length;
                            if (segments > 1 && segments !== mod.count) {
                                warnings.push(`Ambiguity detected on ${mod.target} shelf: 'Count ${mod.count}' contradicts 'Ratio ${mod.ratio}' (${segments} parts). System prioritized Ratio.`);
                            }
                        }
                    });
                }
                return warnings;
            })(),
            _aiMetadata: {
                styleNotes: result.styleNotes,
                confidence: result.confidence,
                originalQuery: userInput,
            }
        };

    } catch (error) {
        if (error instanceof HttpsError) {
            throw error;
        }
        // Convert other errors to HttpsError
        throw new HttpsError('internal', `Failed to parse furniture request: ${error.message}`);
    }
});

// --- PAYMENT GATEWAY ---

exports.createRazorpayOrder = onCall({ secrets: [razorpayKeyId, razorpayKeySecret] }, async (request) => {
    const { amount, currency = "INR", receipt } = request.data;
    const key_id = razorpayKeyId.value();
    const key_secret = razorpayKeySecret.value();

    if (!key_id || !key_secret) {
        throw new HttpsError('failed-precondition', 'Razorpay API keys are missing in configuration');
    }

    if (!amount || isNaN(amount) || amount <= 0) {
        throw new HttpsError('invalid-argument', 'Invalid amount provided');
    }

    try {
        const instance = new Razorpay({
            key_id: key_id,
            key_secret: key_secret,
        });

        const options = {
            amount: Math.round(amount * 100), // Convert to smallest currency unit (paise)
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`,
        };

        const order = await instance.orders.create(options);

        if (!order) {
            throw new HttpsError('internal', 'Failed to create Razorpay order');
        }

        return {
            id: order.id,
            currency: order.currency,
            amount: order.amount,
        };
    } catch (error) {
        console.error("Razorpay Error Details:", error);
        // More detailed error checking if possible
        throw new HttpsError('internal', error.message || 'Payment initiation failed');
    }
});
