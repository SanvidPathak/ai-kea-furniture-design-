import {
  calculateLoadRequirements,
  calculateLegDimensions,
  calculateDeflection,
  calculateStability,
  determineStructuralAdditions,
  calculateIntegrityScore,
  validateAssemblyFeasibility,
  estimateWorkforce,
  applyAnchorPoints,
  generateEngineeringSpecs
} from '../utils/furnitureEngineering.js';
import { generateThreeJSGeometry } from '../utils/geometryGenerator.js';

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
 * Generate parts for table with engineering specs
 */
function generateTableParts(dimensions, material, color, engineeringSpecs) {
  const { length, width, height } = dimensions;
  const { legSize, topThickness } = engineeringSpecs;

  const parts = [
    {
      id: 'table-top',
      name: 'Table Top',
      type: 'surface',
      dimensions: { length, width, height: topThickness },
      quantity: 1,
      material,
      color,
    },
    {
      id: 'table-leg',
      name: 'Table Leg',
      type: 'support',
      dimensions: { length: legSize, width: legSize, height: height - topThickness },
      quantity: 4,
      material,
      color,
    },
  ];

  // Add structural additions if any
  if (engineeringSpecs.additions) {
    engineeringSpecs.additions.forEach((add, idx) => {
      if (add.type === 'center-support') {
        parts.push({
          id: `center-leg-${idx}`,
          name: 'Center Support Leg',
          type: 'support',
          dimensions: { length: legSize, width: legSize, height: height - topThickness },
          quantity: add.quantity,
          material,
          color
        });
      }
      if (add.type === 'apron') {
        // Aprons fit BETWEEN the legs
        // Long Apron: Runs along Length. Size = Length - 2*LegSize.
        parts.push({
          id: `apron-long-${idx}`,
          name: 'Apron (Long)',
          type: 'support',
          dimensions: { length: length - (2 * legSize), width: add.dimensions.thickness, height: add.dimensions.height },
          quantity: 2,
          anchorPattern: 'apron',
          material,
          color
        });
        // Short Apron: Runs along Width. Size = Width - 2*LegSize.
        parts.push({
          id: `apron-short-${idx}`,
          name: 'Apron (Short)',
          type: 'support',
          dimensions: { length: width - (2 * legSize), width: add.dimensions.thickness, height: add.dimensions.height },
          quantity: 2,
          anchorPattern: 'apron',
          material,
          color
        });
      }
    });
  }

  return parts;
}

/**
 * Generate parts for chair
 */
function generateChairParts(dimensions, material, color, engineeringSpecs) {
  const { length, width, height } = dimensions;
  const thickness = engineeringSpecs.topThickness || 2;
  const seatHeight = height * 0.5;
  const { legSize } = engineeringSpecs;

  const parts = [
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
      dimensions: { length: legSize, width: legSize, height: seatHeight },
      quantity: 4,
      anchorPattern: 'corners',
      material,
      color,
    },
  ];

  if (engineeringSpecs.hasArmrests) {
    // 1. Horizontal Top Bar
    parts.push({
      id: 'chair-armrest-top',
      name: 'Arm Rest Top', // Changed name to distinguish
      type: 'support',
      // Thin X, Long Z, Thin Y
      dimensions: { length: 5, width: width - thickness, height: 3 },
      quantity: 2,
      material,
      color
    });

    // 2. Vertical Front Support Post
    parts.push({
      id: 'chair-armrest-support',
      name: 'Arm Support',
      type: 'support',
      // Square post, thickness matches top bar (5)
      dimensions: { length: 5, width: 5, height: 22 },
      quantity: 2,
      material,
      color
    });
  }

  return parts;
}

/**
 * Generate parts for bookshelf
 */
function generateBookshelfParts(dimensions, material, color, engineeringSpecs) {
  const { length, width, height } = dimensions;
  const thickness = 2;
  // If user asks for "5 shelves", we assume they mean 5 internal adjustable shelves.
  // We do NOT subtract 1 for the bottom/top.
  const totalShelves = engineeringSpecs.shelves || 5;
  const internalShelves = totalShelves;

  const parts = [
    {
      id: 'bookshelf-side',
      name: 'Side Panel',
      type: 'surface',
      // Swap: Length is Thickness (X), Width is Depth (Z)
      dimensions: { length: thickness, width: width, height },
      quantity: 2,
      anchorPattern: 'sides',
      material,
      color,
    },
    {
      id: 'bookshelf-shelf',
      name: 'Shelf',
      type: 'surface',
      dimensions: { length, width, height: thickness },
      quantity: internalShelves,
      anchorPattern: 'distribute-y',
      material,
      color,
    },
    {
      id: 'bookshelf-back',
      name: 'Back Panel',
      type: 'surface',
      dimensions: { length, width: thickness, height },
      quantity: 1,
      // handled by generic 'back panel' logic
      material,
      color,
    },
    {
      id: 'bookshelf-top',
      name: 'Top Panel',
      type: 'surface',
      dimensions: { length, width, height: thickness },
      quantity: 1,
      material,
      color,
    },
    {
      id: 'bookshelf-bottom',
      name: 'Bottom Panel',
      type: 'surface',
      // Thicker base to raise off ground
      dimensions: { length, width, height: 10 },
      quantity: 1,
      material,
      color,
    },
  ];

  // Vertical Partitions
  if (['all-shelves', 'random-shelves'].includes(engineeringSpecs.partitionStrategy)) {
    // Determine quantity based on shelves. At least 1 per shelf interval.
    // We have `internalShelves` intervals + top gap = totalShelves intervals.
    // Let's say we want 1 partition per shelf level.
    parts.push({
      id: 'bookshelf-partition',
      name: 'Vertical Partition',
      type: 'support',
      // Height will be auto-calculated by engineering (fits gap)
      // Length is thickness (X). Width is Depth (Z).
      dimensions: { length: thickness, width: width, height: 30 },
      quantity: internalShelves + 1, // One for each gap (Bottom->Shelf1... ShelfN->Top)
      anchorPattern: 'vertical-partition',
      material,
      color,
      anchorPattern: 'vertical-partition',
      material,
      color,
      meta: {
        strategy: engineeringSpecs.partitionStrategy,
        ratio: engineeringSpecs.partitionRatio, // Pass 60-40, 0.6, etc.
        count: engineeringSpecs.partitionCount, // Pass explicit count if available
        modifiers: engineeringSpecs.shelfModifiers // Pass per-shelf rules
      }
    });
  }

  if (engineeringSpecs.additions) {
    engineeringSpecs.additions.forEach(add => {
      if (add.type === 'anti-tip-bracket') {
        // Logical part
      }
    });
  }

  return parts;
}

/**
 * Generate parts for desk
 */
function generateDeskParts(dimensions, material, color, engineeringSpecs) {
  const { length, width, height } = dimensions;
  const { legSize, topThickness } = engineeringSpecs;

  return [
    {
      id: 'desk-top',
      name: 'Desk Top',
      type: 'surface',
      dimensions: { length, width, height: topThickness },
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
      dimensions: { length: legSize, width: legSize, height: height - topThickness },
      quantity: 4,
      anchorPattern: 'corners',
      material,
      color,
    },
  ];
}

/**
 * Generate parts for bed frame
 */
function generateBedFrameParts(dimensions, material, color, engineeringSpecs) {
  const { length, width, height } = dimensions;
  const thickness = 3;
  const { legSize } = engineeringSpecs;


  const parts = [
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
      // Swap: Length is Thickness (X), Width is Length (Z)
      dimensions: { length: thickness, width: length, height: 10 },
      quantity: 2,
      anchorPattern: 'sides',
      material,
      color,
    },
    {
      id: 'bedframe-slat',
      name: 'Support Slat',
      type: 'support',
      dimensions: { length: width - 20, width: 8, height: thickness },
      quantity: 10,
      anchorPattern: 'distribute-z',
      material,
      color,
    },
    {
      id: 'bedframe-leg',
      name: 'Bed Leg',
      type: 'support',
      dimensions: { length: legSize, width: legSize, height: height },
      quantity: 4,
      material,
      color,
    },
  ];

  if (engineeringSpecs.additions) {
    engineeringSpecs.additions.forEach(add => {
      if (add.type === 'center-beam') {
        parts.push({
          id: 'bedframe-center',
          name: 'Center Beam',
          type: 'support',
          dimensions: { length, width: 8, height: thickness },
          quantity: 1,
          material,
          color
        });
      }
    });
  }
  return parts;
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
  const materialProps = MATERIALS[material] || MATERIALS.wood; // Fallback
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
  const materialProps = MATERIALS[material] || MATERIALS.wood;
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
function generateInstructions(furnitureType, structuralReport, workforce) {
  const baseInstructions = {
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

  const instructions = [...(baseInstructions[furnitureType] || [])];

  // Inject Structural Recommendations
  if (structuralReport && structuralReport.recommendations) {
    structuralReport.recommendations.forEach(rec => {
      instructions.push(`NOTE: ${rec}`);
    });
  }

  // Inject Workforce Warning
  if (workforce && workforce.requiresTwoPeople) {
    instructions.unshift(`⚠️ ${workforce.reason} (Estimated Weight/Size)`);
  }

  return instructions;
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
  return (baseTime[furnitureType] || 30) + Math.floor(partsComplexity * 2);
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
export async function generateDesign(config) {
  const { furnitureType, material, dimensions, materialColor, hasArmrests } = config;

  // Validate inputs
  if (!furnitureType || !DEFAULT_DIMENSIONS[furnitureType]) {
    throw new Error(`Invalid furniture type: ${furnitureType}. Must be one of: table, chair, bookshelf, desk, bed frame`);
  }

  if (!material || !MATERIALS[material]) {
    throw new Error(`Invalid material: ${material}. Must be one of: wood, metal, plastic`);
  }

  // Use default dimensions if not provided
  const finalDimensions = dimensions || DEFAULT_DIMENSIONS[furnitureType];

  if (!finalDimensions) {
    throw new Error(`Could not determine dimensions for furniture type: ${furnitureType}`);
  }

  // Use material's default color if not provided
  const color = materialColor || MATERIALS[material].defaultColor;

  // --- ENGINEERING PHASE ---
  // Unified Engineering Pipeline
  // Unified Engineering Pipeline
  const specs = await generateEngineeringSpecs({
    furnitureType,
    dimensions: finalDimensions,
    material,
    projectedLoad: config.projectedLoad, // Pass the parsed load to engineering
    shelves: config.shelves, // Custom shelf count
    partitionStrategy: config.partitionStrategy, // Partition strategy (none, all, random)
    partitionRatio: config.partitionRatio, // Partition ratio (60-40, etc.)
    partitionCount: config.partitionCount, // Number of partitions per shelf
    shelfModifiers: config.shelfModifiers || [], // Per-shelf overrides
  });

  const { legSize, topThickness, additions, loadAnalysis } = specs;

  // Extract for validation phase
  const distributedLoad = loadAnalysis.expectedLoad?.distributed || 50;

  const engineeringSpecs = {
    legSize,
    topThickness,
    additions,
    hasArmrests, // Pass this flag to part generators
    shelves: specs.shelves, // Pass shelves count
    partitionStrategy: specs.partitionStrategy, // Pass partition strategy
    partitionRatio: specs.partitionRatio, // Pass partition ratio
    partitionCount: specs.partitionCount, // Pass partition count
    shelfModifiers: specs.shelfModifiers // Pass modifiers
  };

  // Generate parts based on furniture type + engineering specs
  let parts;
  switch (furnitureType) {
    case 'table':
      parts = generateTableParts(finalDimensions, material, color, engineeringSpecs);
      break;
    case 'chair':
      parts = generateChairParts(finalDimensions, material, color, engineeringSpecs);
      break;
    case 'bookshelf':
      parts = generateBookshelfParts(finalDimensions, material, color, engineeringSpecs);
      break;
    case 'desk':
      parts = generateDeskParts(finalDimensions, material, color, engineeringSpecs);
      break;
    case 'bed frame':
      parts = generateBedFrameParts(finalDimensions, material, color, engineeringSpecs);
      break;
    default:
      throw new Error(`Unsupported furniture type: ${furnitureType}`);
  }

  // --- VALIDATION PHASE ---
  // 5. Stability
  const cogHeight = finalDimensions.height * 0.6; // heuristic
  const stabilityAnalysis = calculateStability(finalDimensions, cogHeight);

  // 6. Assembly Feasibility
  const assemblyFeasibility = validateAssemblyFeasibility(parts);

  // 7. Workforce
  const workforce = estimateWorkforce(parts, finalDimensions);

  // 8. Integrity Score
  // Recalculate deflection for report if needed
  const deflectionAnalysis = calculateDeflection(finalDimensions.length, finalDimensions.width, topThickness, material, distributedLoad);

  const integrityScore = calculateIntegrityScore(loadAnalysis, deflectionAnalysis, stabilityAnalysis, additions, assemblyFeasibility);

  const structuralReport = {
    loadCapacity: `${loadAnalysis.expectedLoad.distributed}kg`,
    selfWeight: `${loadAnalysis.selfWeight}kg`,
    integrityScore,
    isStable: stabilityAnalysis.isStable,
    warnings: [
      ...assemblyFeasibility.warnings,
      ...(stabilityAnalysis.sizeWarning ? [stabilityAnalysis.sizeWarning] : []),
      ...(stabilityAnalysis.recommendation ? [stabilityAnalysis.recommendation] : [])
    ],
    recommendations: stabilityAnalysis.recommendation ? [stabilityAnalysis.recommendation] : []
  };


  // Calculate total cost
  const totalCost = calculateTotalCost(parts, material);

  // Generate assembly instructions
  const instructions = generateInstructions(furnitureType, structuralReport, workforce);

  // Calculate assembly time
  const assemblyTime = calculateAssemblyTime(furnitureType, parts);

  const design = {
    furnitureType,
    material,
    materialColor: color,
    dimensions: finalDimensions,
    parts,
    totalCost,
    instructions,
    assemblyTime,
    structural: structuralReport // Attach engineering data
  };

  // --- 3D GENERATION PHASE ---
  // Apply Engineering Anchors to calculate explicit positions
  // This "explodes" parts (Leg x4 becomes Leg-1, Leg-2...) and sets precise x/y/z
  const positionedParts = applyAnchorPoints(parts, furnitureType, finalDimensions);

  const geometry3D = generateThreeJSGeometry({
    ...design,
    parts: positionedParts // Use the exploded, positioned parts for 3D
  });

  return {
    ...design,
    geometry3D
  };
}
