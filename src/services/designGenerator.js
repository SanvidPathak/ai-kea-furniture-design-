/**
 * Design Generator - Pure client-side furniture design algorithm
 * Generates modular furniture designs with parts, cost, and assembly instructions
 */

// Material properties: density (g/cm³) and cost per cm³ in INR
// Updated rates based on 2025 Indian market prices
const MATERIALS = {
  wood: { density: 0.6, cost: 0.051, defaultColor: '#8B4513' }, // ₹85/sq ft plywood @ 1.8cm thickness
  metal: { density: 7.8, cost: 0.429, defaultColor: '#C0C0C0' }, // ₹55/kg steel @ 7.8g/cm³ density
  plastic: { density: 0.9, cost: 0.108, defaultColor: '#FFFFFF' }, // ₹120/kg PVC @ 0.9g/cm³ density
};

// Default dimensions for each furniture type (in cm)
const DEFAULT_DIMENSIONS = {
  table: { length: 120, width: 80, height: 75 },
  chair: { length: 45, width: 45, height: 90 },
  bookshelf: { length: 80, width: 30, height: 180 },
  desk: { length: 140, width: 70, height: 75 },
  'bed frame': { length: 200, width: 150, height: 40 },
};

/**
 * Generate parts for table
 */
function generateTableParts(dimensions, material, color) {
  const { length, width, height } = dimensions;
  const thickness = 3;

  return [
    {
      id: 'table-top',
      name: 'Table Top',
      type: 'surface',
      dimensions: { length, width, height: thickness },
      quantity: 1,
      material,
      color,
    },
    {
      id: 'table-leg',
      name: 'Table Leg',
      type: 'support',
      dimensions: { length: 5, width: 5, height: height - thickness },
      quantity: 4,
      material,
      color,
    },
  ];
}

/**
 * Generate parts for chair
 */
function generateChairParts(dimensions, material, color) {
  const { length, width, height } = dimensions;
  const thickness = 2;
  const seatHeight = height * 0.5;

  return [
    {
      id: 'chair-seat',
      name: 'Seat',
      type: 'surface',
      dimensions: { length, width, height: thickness },
      quantity: 1,
      material,
      color,
    },
    {
      id: 'chair-backrest',
      name: 'Backrest',
      type: 'surface',
      dimensions: { length, width: thickness, height: height - seatHeight },
      quantity: 1,
      material,
      color,
    },
    {
      id: 'chair-leg',
      name: 'Chair Leg',
      type: 'support',
      dimensions: { length: 4, width: 4, height: seatHeight },
      quantity: 4,
      material,
      color,
    },
  ];
}

/**
 * Generate parts for bookshelf
 */
function generateBookshelfParts(dimensions, material, color) {
  const { length, width, height } = dimensions;
  const thickness = 2;
  const shelves = 5;

  return [
    {
      id: 'bookshelf-side',
      name: 'Side Panel',
      type: 'surface',
      dimensions: { length: width, width: thickness, height },
      quantity: 2,
      material,
      color,
    },
    {
      id: 'bookshelf-shelf',
      name: 'Shelf',
      type: 'surface',
      dimensions: { length, width, height: thickness },
      quantity: shelves,
      material,
      color,
    },
    {
      id: 'bookshelf-back',
      name: 'Back Panel',
      type: 'surface',
      dimensions: { length, width: thickness, height },
      quantity: 1,
      material,
      color,
    },
  ];
}

/**
 * Generate parts for desk
 */
function generateDeskParts(dimensions, material, color) {
  const { length, width, height } = dimensions;
  const thickness = 3;

  return [
    {
      id: 'desk-top',
      name: 'Desk Top',
      type: 'surface',
      dimensions: { length, width, height: thickness },
      quantity: 1,
      material,
      color,
    },
    {
      id: 'desk-drawer',
      name: 'Drawer',
      type: 'storage',
      dimensions: { length: length * 0.3, width: width * 0.8, height: 15 },
      quantity: 2,
      material,
      color,
    },
    {
      id: 'desk-leg',
      name: 'Desk Leg',
      type: 'support',
      dimensions: { length: 5, width: 5, height: height - thickness },
      quantity: 4,
      material,
      color,
    },
  ];
}

/**
 * Generate parts for bed frame
 */
function generateBedFrameParts(dimensions, material, color) {
  const { length, width, height } = dimensions;
  const thickness = 3;

  return [
    {
      id: 'bedframe-headboard',
      name: 'Headboard',
      type: 'surface',
      dimensions: { length: width, width: thickness, height: 100 },
      quantity: 1,
      material,
      color,
    },
    {
      id: 'bedframe-footboard',
      name: 'Footboard',
      type: 'surface',
      dimensions: { length: width, width: thickness, height: 50 },
      quantity: 1,
      material,
      color,
    },
    {
      id: 'bedframe-side-rail',
      name: 'Side Rail',
      type: 'support',
      dimensions: { length, width: 10, height: thickness },
      quantity: 2,
      material,
      color,
    },
    {
      id: 'bedframe-slat',
      name: 'Support Slat',
      type: 'support',
      dimensions: { length: width - 20, width: 8, height: thickness },
      quantity: 10,
      material,
      color,
    },
    {
      id: 'bedframe-leg',
      name: 'Bed Leg',
      type: 'support',
      dimensions: { length: 8, width: 8, height: height },
      quantity: 4,
      material,
      color,
    },
  ];
}

/**
 * Calculate volume of a part
 */
function calculateVolume(dimensions) {
  return dimensions.length * dimensions.width * dimensions.height;
}

/**
 * Calculate cost of parts
 */
export function calculateTotalCost(parts, material) {
  const materialProps = MATERIALS[material];
  let totalCost = 0;

  parts.forEach(part => {
    const volume = calculateVolume(part.dimensions);
    const partCost = volume * materialProps.cost * part.quantity;
    totalCost += partCost;
  });

  return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate detailed cost breakdown for each part
 * @param {Array} parts - Array of part objects
 * @param {string} material - Material type (wood, metal, plastic)
 * @returns {Array} Array of parts with cost details
 */
export function calculateCostBreakdown(parts, material) {
  const materialProps = MATERIALS[material];
  const totalCost = calculateTotalCost(parts, material);

  return parts.map(part => {
    const volume = calculateVolume(part.dimensions);
    const unitCost = volume * materialProps.cost;
    const totalPartCost = unitCost * part.quantity;
    const percentage = totalCost > 0 ? (totalPartCost / totalCost) * 100 : 0;

    return {
      ...part,
      volume: Math.round(volume * 100) / 100, // cm³
      unitCost: Math.round(unitCost * 100) / 100, // Cost per single part
      totalPartCost: Math.round(totalPartCost * 100) / 100, // Total cost for all quantities
      percentage: Math.round(percentage * 10) / 10, // Percentage of total cost
    };
  });
}

/**
 * Generate assembly instructions
 */
function generateInstructions(furnitureType, parts) {
  const instructions = {
    table: [
      'Attach the four table legs to the corners of the table top',
      'Ensure legs are perpendicular to the surface',
      'Secure with screws and wood glue',
      'Let dry for 24 hours before use',
    ],
    chair: [
      'Attach the four legs to the seat base',
      'Mount the backrest to the rear of the seat',
      'Ensure all connections are secure',
      'Test stability before use',
    ],
    bookshelf: [
      'Attach side panels to the back panel',
      'Insert shelves at equal intervals',
      'Secure shelves with brackets',
      'Mount to wall if needed for stability',
    ],
    desk: [
      'Attach the four legs to the desk top',
      'Install drawer slides on both sides',
      'Mount drawers to the slides',
      'Test drawer movement and adjust if needed',
    ],
    'bed frame': [
      'Attach headboard and footboard to side rails',
      'Place support slats across the side rails',
      'Attach the four legs to each corner',
      'Test stability and adjust as needed',
      'Place mattress on top of slats',
    ],
  };

  return instructions[furnitureType] || [];
}

/**
 * Calculate estimated assembly time (in minutes)
 */
function calculateAssemblyTime(furnitureType, parts) {
  const baseTime = {
    table: 30,
    chair: 25,
    bookshelf: 45,
    desk: 40,
    'bed frame': 60,
  };

  const partsComplexity = parts.reduce((total, part) => total + part.quantity, 0);
  return baseTime[furnitureType] + Math.floor(partsComplexity * 2);
}

/**
 * Generate a complete furniture design
 * @param {Object} config - Design configuration
 * @param {string} config.furnitureType - Type of furniture (table, chair, bookshelf, desk, bed frame)
 * @param {string} config.material - Material (wood, metal, plastic)
 * @param {Object} [config.dimensions] - Custom dimensions (optional)
 * @param {string} [config.materialColor] - Custom color (optional)
 * @returns {Object} Complete design with parts, cost, and instructions
 */
export function generateDesign(config) {
  const { furnitureType, material, dimensions, materialColor } = config;

  // Validate inputs
  if (!furnitureType || !DEFAULT_DIMENSIONS[furnitureType]) {
    throw new Error(`Invalid furniture type: ${furnitureType}. Must be one of: table, chair, bookshelf, desk, bed frame`);
  }

  if (!material || !MATERIALS[material]) {
    throw new Error(`Invalid material: ${material}. Must be one of: wood, metal, plastic`);
  }

  // Use default dimensions if not provided
  const finalDimensions = dimensions || DEFAULT_DIMENSIONS[furnitureType];

  // Use material's default color if not provided
  const color = materialColor || MATERIALS[material].defaultColor;

  // Generate parts based on furniture type
  let parts;
  switch (furnitureType) {
    case 'table':
      parts = generateTableParts(finalDimensions, material, color);
      break;
    case 'chair':
      parts = generateChairParts(finalDimensions, material, color);
      break;
    case 'bookshelf':
      parts = generateBookshelfParts(finalDimensions, material, color);
      break;
    case 'desk':
      parts = generateDeskParts(finalDimensions, material, color);
      break;
    case 'bed frame':
      parts = generateBedFrameParts(finalDimensions, material, color);
      break;
    default:
      throw new Error(`Unsupported furniture type: ${furnitureType}`);
  }

  // Calculate total cost
  const totalCost = calculateTotalCost(parts, material);

  // Generate assembly instructions
  const instructions = generateInstructions(furnitureType, parts);

  // Calculate assembly time
  const assemblyTime = calculateAssemblyTime(furnitureType, parts);

  return {
    furnitureType,
    material,
    materialColor: color,
    dimensions: finalDimensions,
    parts,
    totalCost,
    instructions,
    assemblyTime,
  };
}
