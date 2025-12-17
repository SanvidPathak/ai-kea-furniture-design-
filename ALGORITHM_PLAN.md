# Realistic Furniture Design Algorithm with 3D Preview

## Overview

This document outlines the plan to create a robust, physics-based furniture design algorithm that generates structurally sound, realistic designs with proper scaling and architecture. The algorithm will output both traditional design data AND Three.js-compatible 3D geometry for visual preview.

---

## Goals

1. **Structural Realism**: Calculate weight loads, material strength, and validate structural integrity
2. **Intelligent Scaling**: Automatically adjust architecture based on furniture dimensions
3. **Material-Specific Behavior**: Different structural requirements for wood, metal, and plastic
4. **AI Integration**: LLM extracts structural preferences from natural language
5. **Validation System**: Warnings and suggestions for edge cases
6. **3D Preview**: Three.js-compatible geometry output for visual rendering

---

## Phase 1: Core Physics Engine

**File**: `src/utils/furnitureEngineering.js` (NEW)

### Material Properties Database

```javascript
export const MATERIAL_PROPERTIES = {
  wood: {
    density: 0.6,              // g/cm³ (pine/softwood average)
    cost: 0.051,               // ₹ per cm³
    tensileStrength: 40,       // MPa (megapascals)
    compressiveStrength: 35,   // MPa
    youngsModulus: 10000,      // MPa (stiffness)
    maxLoad: 500,              // kg per standard leg
    minThickness: 1.5,         // cm (minimum practical thickness)
    deflectionFactor: 1.0,     // deflection multiplier for shelves
    joinery: 'mortise-tenon'   // preferred connection method
  },
  metal: {
    density: 7.8,              // g/cm³ (steel)
    cost: 0.429,               // ₹ per cm³
    tensileStrength: 400,      // MPa
    compressiveStrength: 250,  // MPa
    youngsModulus: 200000,     // MPa
    maxLoad: 2000,             // kg per standard leg
    minThickness: 0.3,         // cm (sheet metal/tube wall)
    deflectionFactor: 0.1,     // much stiffer than wood
    joinery: 'welding'
  },
  plastic: {
    density: 0.9,              // g/cm³ (ABS)
    cost: 0.108,               // ₹ per cm³
    tensileStrength: 45,       // MPa
    compressiveStrength: 70,   // MPa
    youngsModulus: 2300,       // MPa
    maxLoad: 150,              // kg per standard leg
    minThickness: 0.5,         // cm
    deflectionFactor: 2.0,     // more flexible, needs ribs
    joinery: 'snap-fit'
  }
};
```

### Load Calculation Functions

```javascript
/**
 * Calculate the expected load on furniture based on type
 * @param {string} furnitureType - table, chair, bookshelf, desk, bed frame
 * @param {object} dimensions - {length, width, height} in cm
 * @returns {object} {selfWeight, expectedLoad, totalLoad} in kg
 */
export function calculateLoadRequirements(furnitureType, dimensions, material) {
  const materialProps = MATERIAL_PROPERTIES[material];

  // Estimate self-weight based on typical construction
  const volume = estimateTotalVolume(furnitureType, dimensions);
  const selfWeight = (volume * materialProps.density) / 1000; // convert to kg

  // Expected load based on furniture type
  const loadProfiles = {
    table: { distributed: 50, point: 20 },      // 50kg distributed, 20kg point load
    desk: { distributed: 80, point: 30 },       // heavier items (monitors, books)
    chair: { distributed: 0, point: 120 },      // adult person sitting
    bookshelf: { distributed: 30, point: 10 },  // per shelf (books are dense)
    'bed frame': { distributed: 200, point: 0 } // two adults
  };

  const expectedLoad = loadProfiles[furnitureType] || { distributed: 30, point: 10 };

  return {
    selfWeight: Math.round(selfWeight * 10) / 10,
    expectedLoad,
    totalLoad: selfWeight + expectedLoad.distributed,
    material: material
  };
}

/**
 * Calculate required leg dimensions based on load
 * @param {number} totalLoad - total weight in kg
 * @param {number} numLegs - number of support points
 * @param {string} material - wood, metal, plastic
 * @returns {object} {diameter, thickness} in cm
 */
export function calculateLegDimensions(totalLoad, numLegs, material) {
  const materialProps = MATERIAL_PROPERTIES[material];
  const safetyFactor = 1.8; // 80% safety margin

  // Load per leg (kg)
  const loadPerLeg = (totalLoad * safetyFactor) / numLegs;

  // Check if load exceeds material capacity
  if (loadPerLeg > materialProps.maxLoad) {
    throw new Error(`Load too high for ${material}. Consider more legs or different material.`);
  }

  // Calculate required cross-sectional area (cm²)
  // Compressive stress = Force / Area
  // Area = Force / (Strength / Safety Factor)
  const force = loadPerLeg * 9.81; // convert to Newtons
  const allowableStress = (materialProps.compressiveStrength * 10) / safetyFactor; // N/cm²
  const requiredArea = force / allowableStress;

  // For square legs: side = sqrt(area)
  // For round legs: diameter = sqrt(4*area/π)
  const squareSide = Math.ceil(Math.sqrt(requiredArea) * 2) / 2; // round to 0.5cm
  const roundDiameter = Math.ceil(Math.sqrt((4 * requiredArea) / Math.PI) * 2) / 2;

  // Apply material-specific minimums
  const minDim = materialProps.minThickness * 3; // legs need to be thicker than min

  return {
    square: Math.max(squareSide, minDim),
    round: Math.max(roundDiameter, minDim),
    area: requiredArea
  };
}

/**
 * Calculate shelf/surface deflection (sagging)
 * @param {number} span - unsupported length in cm
 * @param {number} load - distributed load in kg
 * @param {number} thickness - surface thickness in cm
 * @param {string} material
 * @returns {object} {deflection, isAcceptable, recommendedThickness}
 */
export function calculateDeflection(span, load, thickness, material) {
  const materialProps = MATERIAL_PROPERTIES[material];

  // Simplified beam deflection formula: δ = (5 * w * L^4) / (384 * E * I)
  // δ = deflection, w = load per length, L = span, E = Young's modulus, I = moment of inertia

  const width = 30; // assume 30cm depth for calculation
  const w = (load * 9.81) / (span * width); // N/cm²
  const L = span;
  const E = materialProps.youngsModulus * 10; // convert MPa to N/cm²
  const I = (width * Math.pow(thickness, 3)) / 12; // moment of inertia for rectangle

  const deflection = (5 * w * Math.pow(L, 4)) / (384 * E * I);
  const deflectionMm = deflection * 10; // convert to mm

  // Acceptable deflection: L/360 (industry standard)
  const maxAcceptable = (span * 10) / 360; // mm
  const isAcceptable = deflectionMm <= maxAcceptable;

  // Calculate recommended thickness if current is insufficient
  let recommendedThickness = thickness;
  if (!isAcceptable) {
    // Solve for I: I = (5 * w * L^4) / (384 * E * δ_max)
    const requiredI = (5 * w * Math.pow(L, 4)) / (384 * E * (maxAcceptable / 10));
    // Solve for thickness: t = ∛(12 * I / width)
    recommendedThickness = Math.ceil(Math.pow((12 * requiredI) / width, 1/3) * 2) / 2;
  }

  return {
    deflection: Math.round(deflectionMm * 10) / 10,
    maxAcceptable: Math.round(maxAcceptable * 10) / 10,
    isAcceptable,
    recommendedThickness: Math.max(recommendedThickness, materialProps.minThickness)
  };
}

/**
 * Check stability (tip-over risk)
 * @param {object} dimensions - {length, width, height}
 * @param {number} centerOfGravityHeight - height of CoG in cm
 * @returns {object} {isStable, tipAngle, recommendation}
 */
export function calculateStability(dimensions, centerOfGravityHeight) {
  const { length, width, height } = dimensions;
  const baseArea = length * width;
  const aspectRatio = height / Math.min(length, width);

  // Calculate tip angle (angle at which furniture tips over)
  // tan(θ) = (base/2) / CoG_height
  const baseRadius = Math.min(length, width) / 2;
  const tipAngle = Math.atan(baseRadius / centerOfGravityHeight) * (180 / Math.PI);

  // Furniture is considered stable if tip angle > 20°
  const isStable = tipAngle > 20;

  let recommendation = null;
  if (!isStable) {
    recommendation = 'Widen base or lower center of gravity';
  } else if (aspectRatio > 3) {
    recommendation = 'Consider anti-tip bracket for tall furniture';
  }

  return {
    isStable,
    tipAngle: Math.round(tipAngle * 10) / 10,
    aspectRatio: Math.round(aspectRatio * 100) / 100,
    recommendation
  };
}

/**
 * Determine if additional structural supports are needed
 * @param {string} furnitureType
 * @param {object} dimensions
 * @param {string} material
 * @returns {array} list of required structural additions
 */
export function determineStructuralAdditions(furnitureType, dimensions, material) {
  const additions = [];
  const { length, width, height } = dimensions;

  // Tables and desks
  if (furnitureType === 'table' || furnitureType === 'desk') {
    if (length > 150 || width > 100) {
      additions.push({
        type: 'center-support',
        reason: 'Span exceeds 150cm, requires center leg or apron reinforcement',
        quantity: Math.ceil(length / 150)
      });
    }
    if (material === 'wood' && (length > 120 || width > 80)) {
      additions.push({
        type: 'apron',
        reason: 'Wood construction benefits from apron for rigidity',
        dimensions: { height: 8, thickness: 2 }
      });
    }
  }

  // Bookshelves
  if (furnitureType === 'bookshelf') {
    if (height > 120) {
      additions.push({
        type: 'back-panel',
        reason: 'Tall bookshelf needs back panel for lateral stability',
        thickness: material === 'wood' ? 0.6 : 0.3
      });
      additions.push({
        type: 'anti-tip-bracket',
        reason: 'Tall furniture requires wall anchoring',
        quantity: 1
      });
    }
    if (width > 80 && material !== 'metal') {
      additions.push({
        type: 'shelf-support',
        reason: 'Wide shelves need center support or thicker material',
        quantity: Math.ceil(width / 80)
      });
    }
  }

  // Chairs
  if (furnitureType === 'chair') {
    if (height > 90) {
      additions.push({
        type: 'cross-bracing',
        reason: 'Tall chair needs leg bracing for stability',
        location: '20cm from floor'
      });
    }
    additions.push({
      type: 'seat-angle',
      reason: 'Ergonomic seating requires 5° backward tilt',
      angle: 5
    });
  }

  // Bed frames
  if (furnitureType === 'bed frame') {
    const slatsNeeded = Math.ceil(length / 10); // slat every 10cm
    additions.push({
      type: 'slats',
      reason: 'Bed requires slats for mattress support',
      quantity: slatsNeeded,
      dimensions: { length: width, width: 8, thickness: 2 }
    });
    if (width > 120) {
      additions.push({
        type: 'center-beam',
        reason: 'Wide bed needs center support beam',
        quantity: 1
      });
    }
  }

  return additions;
}

/**
 * Calculate structural integrity score (0-100)
 */
export function calculateIntegrityScore(loadAnalysis, deflectionAnalysis, stabilityAnalysis, additions) {
  let score = 100;

  // Deduct for safety factor issues
  const safetyRatio = loadAnalysis.expectedLoad.distributed / loadAnalysis.selfWeight;
  if (safetyRatio > 5) score -= 20; // very light construction
  if (safetyRatio < 0.5) score -= 10; // over-engineered (wasteful)

  // Deduct for deflection issues
  if (!deflectionAnalysis.isAcceptable) {
    const deflectionRatio = deflectionAnalysis.deflection / deflectionAnalysis.maxAcceptable;
    score -= Math.min(30, deflectionRatio * 20);
  }

  // Deduct for stability issues
  if (!stabilityAnalysis.isStable) score -= 25;
  if (stabilityAnalysis.aspectRatio > 3) score -= 10;

  // Deduct if missing required structural additions
  const criticalAdditions = additions.filter(a =>
    a.type === 'anti-tip-bracket' || a.type === 'center-support'
  );
  score -= criticalAdditions.length * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}
```

---

## Phase 2: 3D Geometry Generator

**File**: `src/utils/geometryGenerator.js` (NEW)

### Three.js Geometry Conversion

```javascript
/**
 * Convert furniture design parts to Three.js geometry definitions
 * @param {object} design - Complete design object
 * @returns {object} Three.js-compatible geometry data
 */
export function generateThreeJSGeometry(design) {
  const { furnitureType, parts, dimensions, material, materialColor } = design;

  // Convert parts to 3D positioned geometries
  const geometryParts = parts.map((part, index) => {
    const position = calculatePartPosition(part, index, furnitureType, dimensions);
    const rotation = calculatePartRotation(part, furnitureType);
    const geometry = determineGeometryType(part);

    return {
      id: part.id || `part-${index}`,
      name: part.name,
      type: geometry.type,
      position,
      rotation,
      dimensions: {
        width: part.dimensions.width || part.dimensions.length,
        height: part.dimensions.height,
        depth: part.dimensions.thickness || part.dimensions.width
      },
      material: {
        color: part.color || materialColor,
        roughness: getMaterialRoughness(material),
        metalness: getMaterialMetalness(material),
        opacity: 1
      },
      castShadow: true,
      receiveShadow: true
    };
  });

  // Calculate bounding box
  const bounds = {
    width: dimensions.length,
    height: dimensions.height,
    depth: dimensions.width
  };

  // Calculate optimal camera position
  const maxDimension = Math.max(bounds.width, bounds.height, bounds.depth);
  const cameraDistance = maxDimension * 2;

  return {
    parts: geometryParts,
    bounds,
    camera: {
      position: {
        x: cameraDistance * 0.7,
        y: cameraDistance * 0.5,
        z: cameraDistance * 0.7
      },
      lookAt: {
        x: 0,
        y: bounds.height / 2,
        z: 0
      },
      fov: 50
    },
    lighting: {
      ambient: { color: '#ffffff', intensity: 0.5 },
      directional: [
        { position: { x: 5, y: 10, z: 7.5 }, color: '#ffffff', intensity: 0.8 },
        { position: { x: -5, y: 10, z: -7.5 }, color: '#ffffff', intensity: 0.4 }
      ]
    },
    background: '#f5f1e8' // IKEA earth beige
  };
}

/**
 * Calculate 3D position for each part based on furniture type
 */
function calculatePartPosition(part, index, furnitureType, dimensions) {
  const { length, width, height } = dimensions;

  // Position parts in 3D space relative to furniture center (0, 0, 0)
  const positions = {
    table: calculateTablePartPosition,
    desk: calculateTablePartPosition,
    chair: calculateChairPartPosition,
    bookshelf: calculateBookshelfPartPosition,
    'bed frame': calculateBedPartPosition
  };

  const calculator = positions[furnitureType] || calculateDefaultPosition;
  return calculator(part, index, dimensions);
}

function calculateTablePartPosition(part, index, dimensions) {
  const { length, width, height } = dimensions;

  // Table top at top
  if (part.type === 'surface' || part.name.includes('Top')) {
    return { x: 0, y: height - (part.dimensions.thickness / 2), z: 0 };
  }

  // Legs at corners
  if (part.type === 'support' && part.name.includes('Leg')) {
    const legPositions = [
      { x: -(length / 2 - part.dimensions.length / 2), z: -(width / 2 - part.dimensions.width / 2) },
      { x: (length / 2 - part.dimensions.length / 2), z: -(width / 2 - part.dimensions.width / 2) },
      { x: -(length / 2 - part.dimensions.length / 2), z: (width / 2 - part.dimensions.width / 2) },
      { x: (length / 2 - part.dimensions.length / 2), z: (width / 2 - part.dimensions.width / 2) }
    ];
    const legIndex = parseInt(part.name.match(/\d+/)?.[0] || 1) - 1;
    return {
      ...legPositions[legIndex % 4],
      y: part.dimensions.height / 2
    };
  }

  // Center support
  if (part.name.includes('Center')) {
    return { x: 0, y: part.dimensions.height / 2, z: 0 };
  }

  return { x: 0, y: 0, z: 0 };
}

function calculateChairPartPosition(part, index, dimensions) {
  // Implement chair-specific positioning
  // Seat, back, legs, armrests
  return { x: 0, y: 0, z: 0 }; // Placeholder
}

function calculateBookshelfPartPosition(part, index, dimensions) {
  // Implement bookshelf-specific positioning
  // Shelves, sides, back panel
  return { x: 0, y: 0, z: 0 }; // Placeholder
}

function calculateBedPartPosition(part, index, dimensions) {
  // Implement bed-specific positioning
  // Frame, slats, headboard
  return { x: 0, y: 0, z: 0 }; // Placeholder
}

/**
 * Determine rotation for part (most parts are axis-aligned)
 */
function calculatePartRotation(part, furnitureType) {
  // Most parts don't need rotation
  return { x: 0, y: 0, z: 0 };
}

/**
 * Determine Three.js geometry type based on part shape
 */
function determineGeometryType(part) {
  // For now, everything is box geometry
  // Future: detect cylindrical legs, curved backs, etc.
  return { type: 'box' };
}

/**
 * Get material roughness value for Three.js
 */
function getMaterialRoughness(material) {
  const roughness = {
    wood: 0.8,
    metal: 0.3,
    plastic: 0.5
  };
  return roughness[material] || 0.5;
}

/**
 * Get material metalness value for Three.js
 */
function getMaterialMetalness(material) {
  const metalness = {
    wood: 0,
    metal: 0.9,
    plastic: 0.1
  };
  return metalness[material] || 0;
}
```

---

## Phase 3: Enhanced Design Generator

**File**: `src/services/designGenerator.js` (MODIFY)

### Integration with Physics Engine

```javascript
import {
  calculateLoadRequirements,
  calculateLegDimensions,
  calculateDeflection,
  calculateStability,
  determineStructuralAdditions,
  calculateIntegrityScore,
  MATERIAL_PROPERTIES
} from '../utils/furnitureEngineering.js';
import { generateThreeJSGeometry } from '../utils/geometryGenerator.js';

/**
 * Generate furniture design with structural engineering
 */
export async function generateDesign(params) {
  const {
    furnitureType,
    material,
    materialColor,
    dimensions: userDimensions,
    structuralPreference = 'standard' // 'lightweight', 'standard', 'heavy-duty'
  } = params;

  // Use default dimensions if not provided
  const dimensions = userDimensions || getDefaultDimensions(furnitureType);

  // Step 1: Calculate load requirements
  const loadAnalysis = calculateLoadRequirements(furnitureType, dimensions, material);

  // Step 2: Determine structural additions needed
  const structuralAdditions = determineStructuralAdditions(furnitureType, dimensions, material);

  // Step 3: Generate parts with engineering calculations
  const parts = generateEngineeringParts(
    furnitureType,
    dimensions,
    material,
    loadAnalysis,
    structuralAdditions,
    structuralPreference
  );

  // Step 4: Validate deflection for surfaces
  const surfaces = parts.filter(p => p.type === 'surface');
  const deflectionAnalyses = surfaces.map(surface => ({
    part: surface.name,
    ...calculateDeflection(
      surface.span || dimensions.length,
      loadAnalysis.expectedLoad.distributed,
      surface.dimensions.thickness,
      material
    )
  }));

  // Step 5: Check stability
  const cogHeight = dimensions.height / 2; // simplified CoG
  const stabilityAnalysis = calculateStability(dimensions, cogHeight);

  // Step 6: Calculate integrity score
  const integrityScore = calculateIntegrityScore(
    loadAnalysis,
    deflectionAnalyses[0] || { isAcceptable: true },
    stabilityAnalysis,
    structuralAdditions
  );

  // Step 7: Generate warnings and recommendations
  const warnings = [];
  const recommendations = [];

  deflectionAnalyses.forEach(d => {
    if (!d.isAcceptable) {
      warnings.push(`${d.part} may sag (${d.deflection}mm deflection)`);
      recommendations.push(`Increase ${d.part} thickness to ${d.recommendedThickness}cm`);
    }
  });

  if (!stabilityAnalysis.isStable) {
    warnings.push(`Design may be unstable (tip angle: ${stabilityAnalysis.tipAngle}°)`);
    recommendations.push(stabilityAnalysis.recommendation);
  }

  structuralAdditions.forEach(addition => {
    recommendations.push(`Add ${addition.type}: ${addition.reason}`);
  });

  // Step 8: Calculate costs
  const partsWithCost = calculateCostBreakdown(parts, material);
  const totalCost = partsWithCost.reduce((sum, part) => sum + part.totalPartCost, 0);

  // Step 9: Generate assembly instructions
  const instructions = generateAssemblyInstructions(furnitureType, parts, structuralAdditions);
  const assemblyTime = calculateAssemblyTime(parts, furnitureType);

  // Step 10: Generate 3D geometry
  const design = {
    furnitureType,
    material,
    materialColor,
    dimensions,
    parts: partsWithCost,
    totalCost,
    instructions,
    assemblyTime,
    structural: {
      loadCapacity: `${loadAnalysis.expectedLoad.distributed}kg`,
      selfWeight: `${loadAnalysis.selfWeight}kg`,
      safetyFactor: 1.8,
      integrityScore,
      warnings,
      recommendations,
      additions: structuralAdditions
    }
  };

  const geometry3D = generateThreeJSGeometry(design);

  return {
    ...design,
    geometry3D
  };
}

/**
 * Generate parts with engineering calculations
 */
function generateEngineeringParts(furnitureType, dimensions, material, loadAnalysis, additions, preference) {
  const generators = {
    table: generateTablePartsEngineered,
    desk: generateTablePartsEngineered,
    chair: generateChairPartsEngineered,
    bookshelf: generateBookshelfPartsEngineered,
    'bed frame': generateBedPartsEngineered
  };

  const generator = generators[furnitureType];
  if (!generator) {
    throw new Error(`Unknown furniture type: ${furnitureType}`);
  }

  return generator(dimensions, material, loadAnalysis, additions, preference);
}

/**
 * Generate table parts with proper engineering
 */
function generateTablePartsEngineered(dimensions, material, loadAnalysis, additions, preference) {
  const { length, width, height } = dimensions;
  const parts = [];

  // Calculate proper leg dimensions
  const numLegs = 4 + (additions.find(a => a.type === 'center-support')?.quantity || 0);
  const legDims = calculateLegDimensions(loadAnalysis.totalLoad, numLegs, material);
  const legSize = legDims.square;

  // Calculate proper top thickness based on deflection
  let topThickness = 2.5; // start with standard
  const deflection = calculateDeflection(length, loadAnalysis.expectedLoad.distributed, topThickness, material);
  if (!deflection.isAcceptable) {
    topThickness = deflection.recommendedThickness;
  }

  // Adjust based on structural preference
  if (preference === 'heavy-duty') {
    topThickness *= 1.2;
  } else if (preference === 'lightweight') {
    topThickness *= 0.9;
  }

  // Table top
  parts.push({
    id: 'table-top',
    name: 'Table Top',
    type: 'surface',
    material,
    dimensions: {
      length,
      width,
      thickness: Math.ceil(topThickness * 2) / 2 // round to 0.5cm
    },
    quantity: 1,
    span: length
  });

  // Corner legs
  for (let i = 1; i <= 4; i++) {
    parts.push({
      id: `leg-${i}`,
      name: `Leg ${i}`,
      type: 'support',
      material,
      dimensions: {
        length: legSize,
        width: legSize,
        height: height - topThickness
      },
      quantity: 1
    });
  }

  // Center support if needed
  const centerSupport = additions.find(a => a.type === 'center-support');
  if (centerSupport) {
    for (let i = 0; i < centerSupport.quantity; i++) {
      parts.push({
        id: `center-leg-${i + 1}`,
        name: `Center Support ${i + 1}`,
        type: 'support',
        material,
        dimensions: {
          length: legSize,
          width: legSize,
          height: height - topThickness
        },
        quantity: 1
      });
    }
  }

  // Apron if needed
  const apron = additions.find(a => a.type === 'apron');
  if (apron) {
    const apronPieces = [
      { name: 'Apron Long 1', length, width: apron.dimensions.thickness },
      { name: 'Apron Long 2', length, width: apron.dimensions.thickness },
      { name: 'Apron Short 1', length: width - (2 * apron.dimensions.thickness), width: apron.dimensions.thickness },
      { name: 'Apron Short 2', length: width - (2 * apron.dimensions.thickness), width: apron.dimensions.thickness }
    ];

    apronPieces.forEach((piece, idx) => {
      parts.push({
        id: `apron-${idx + 1}`,
        name: piece.name,
        type: 'support',
        material,
        dimensions: {
          length: piece.length,
          width: piece.width,
          height: apron.dimensions.height
        },
        quantity: 1
      });
    });
  }

  return parts;
}

// Implement other furniture type generators similarly...
function generateChairPartsEngineered(dimensions, material, loadAnalysis, additions, preference) {
  // TODO: Implement chair engineering
  return [];
}

function generateBookshelfPartsEngineered(dimensions, material, loadAnalysis, additions, preference) {
  // TODO: Implement bookshelf engineering
  return [];
}

function generateBedPartsEngineered(dimensions, material, loadAnalysis, additions, preference) {
  // TODO: Implement bed engineering
  return [];
}
```

---

## Phase 4: AI Integration

**File**: `src/services/aiDesignParser.js` (MODIFY)

### Enhanced LLM Prompt for Structural Understanding

```javascript
export async function parseNaturalLanguage(userQuery) {
  const systemPrompt = `You are an expert furniture designer and structural engineer with 20 years of experience in modular furniture design, material science, and load-bearing calculations.

Your task is to analyze user descriptions and extract precise furniture specifications including structural requirements.

## STRUCTURAL PREFERENCES
Detect use-case and structural needs from context:

**Heavy-Duty Keywords**: "sturdy", "heavy-duty", "industrial", "office desk", "workbench", "heavy equipment"
→ structuralPreference: "heavy-duty"

**Standard Keywords**: "standard", "normal", "everyday", "dining table", "regular"
→ structuralPreference: "standard"

**Lightweight Keywords**: "lightweight", "minimalist", "slim", "side table", "occasional use"
→ structuralPreference: "lightweight"

## USE-CASE DETECTION
- "office desk" → heavy-duty (monitors, computers, books)
- "dining table" → standard (dishes, food)
- "coffee table" → lightweight (magazines, decorative)
- "bookshelf" → heavy-duty if "library" or "books", else standard
- "work desk" → heavy-duty
- "kids furniture" → standard (safety focus)

## OUTPUT SCHEMA
{
  "furnitureType": "table" | "chair" | "bookshelf" | "desk" | "bed frame",
  "material": "wood" | "metal" | "plastic",
  "materialColor": "#hexcolor",
  "dimensions": {
    "length": number (cm),
    "width": number (cm),
    "height": number (cm)
  },
  "structuralPreference": "lightweight" | "standard" | "heavy-duty",
  "useCase": string,
  "styleNotes": string
}`;

  // Rest of AI parsing implementation...
  // Call Gemini with enhanced schema including structuralPreference
}
```

---

## Phase 5: Validation & Warnings System

**File**: `src/utils/designValidator.js` (NEW)

```javascript
/**
 * Comprehensive design validation
 */
export function validateDesign(design) {
  const errors = [];
  const warnings = [];
  const suggestions = [];

  // Dimension validation
  if (design.dimensions.length < 10 || design.dimensions.length > 500) {
    errors.push('Length must be between 10cm and 500cm');
  }

  // Structural validation
  if (design.structural.integrityScore < 50) {
    errors.push('Design fails structural integrity requirements');
  } else if (design.structural.integrityScore < 70) {
    warnings.push('Design has marginal structural integrity');
  }

  // Material appropriateness
  if (design.furnitureType === 'bookshelf' && design.material === 'plastic' && design.dimensions.height > 100) {
    warnings.push('Plastic may not be ideal for tall bookshelves with heavy loads');
    suggestions.push('Consider wood or metal for better load capacity');
  }

  // Add design warnings
  warnings.push(...design.structural.warnings);
  suggestions.push(...design.structural.recommendations);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    score: design.structural.integrityScore
  };
}
```

---

## Phase 6: Updated Data Schema

### New Design Object Structure

```javascript
{
  // EXISTING FIELDS (unchanged)
  id: "design-123",
  userId: "user-456",
  furnitureType: "desk",
  material: "wood",
  materialColor: "#8B4513",
  dimensions: { length: 150, width: 75, height: 75 },
  parts: [
    {
      id: "desk-top",
      name: "Desk Top",
      type: "surface",
      dimensions: { length: 150, width: 75, thickness: 3 },
      quantity: 1,
      material: "wood",
      color: "#8B4513",
      // Cost data
      volume: 33750,
      unitCost: 1721.25,
      totalPartCost: 1721.25,
      percentage: 45.2
    }
    // ... more parts
  ],
  totalCost: 3809.50,
  instructions: ["Step 1: Lay out all parts...", "..."],
  assemblyTime: 55,

  // NEW: AI metadata (if AI-generated)
  aiEnhanced: true,
  userQuery: "I need a sturdy office desk for my home office",
  aiConfidence: "high",

  // NEW: Structural metadata
  structural: {
    loadCapacity: "80kg",           // Expected distributed load
    selfWeight: "18.5kg",            // Weight of furniture itself
    safetyFactor: 1.8,               // Engineering safety margin
    integrityScore: 87,              // 0-100 structural score
    warnings: [                      // Potential issues
      "Consider adding center support for spans > 150cm"
    ],
    recommendations: [               // Suggested improvements
      "Add apron: Wood construction benefits from apron for rigidity"
    ],
    additions: [                     // Auto-added structural elements
      {
        type: "center-support",
        reason: "Span exceeds 150cm, requires center leg",
        quantity: 1
      },
      {
        type: "apron",
        reason: "Wood construction benefits from apron for rigidity",
        dimensions: { height: 8, thickness: 2 }
      }
    ],
    useCase: "office desk",          // Detected use case
    structuralPreference: "heavy-duty"  // Lightweight/standard/heavy-duty
  },

  // NEW: Three.js 3D geometry
  geometry3D: {
    parts: [
      {
        id: "desk-top",
        name: "Desk Top",
        type: "box",                 // box, cylinder, plane
        position: { x: 0, y: 72, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { width: 150, height: 3, depth: 75 },
        material: {
          color: "#8B4513",
          roughness: 0.8,
          metalness: 0,
          opacity: 1
        },
        castShadow: true,
        receiveShadow: true
      },
      {
        id: "leg-1",
        name: "Leg 1",
        type: "box",
        position: { x: -70, y: 36, z: -32.5 },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { width: 5, height: 72, depth: 5 },
        material: { color: "#8B4513", roughness: 0.8, metalness: 0 },
        castShadow: true,
        receiveShadow: true
      }
      // ... more parts
    ],
    bounds: { width: 150, height: 75, depth: 75 },
    camera: {
      position: { x: 210, y: 105, z: 210 },
      lookAt: { x: 0, y: 37.5, z: 0 },
      fov: 50
    },
    lighting: {
      ambient: { color: "#ffffff", intensity: 0.5 },
      directional: [
        { position: { x: 5, y: 10, z: 7.5 }, color: "#ffffff", intensity: 0.8 }
      ]
    },
    background: "#f5f1e8"
  },

  // EXISTING TIMESTAMPS
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Implementation Files Summary

### New Files to Create

1. **`src/utils/furnitureEngineering.js`** (~500 lines)
   - Material properties database
   - Load calculation functions
   - Leg dimension calculator
   - Deflection calculator
   - Stability checker
   - Structural additions determiner
   - Integrity score calculator

2. **`src/utils/geometryGenerator.js`** (~400 lines)
   - Three.js geometry converter
   - Part positioning calculations
   - Material property mappers
   - Camera/lighting setup

3. **`src/utils/designValidator.js`** (~150 lines)
   - Design validation logic
   - Error/warning/suggestion generator

4. **`src/components/design/Design3DPreview.jsx`** (~300 lines)
   - Three.js React component
   - Interactive 3D viewer
   - Orbit controls
   - Loading states

### Files to Modify

5. **`src/services/designGenerator.js`**
   - Replace static part generation with engineering calculations
   - Integrate physics engine
   - Add 3D geometry generation
   - Update all furniture type generators

6. **`src/services/aiDesignParser.js`**
   - Update LLM prompt for structural preferences
   - Add use-case detection
   - Update schema to include structuralPreference

7. **`src/services/hybridDesignGenerator.js`**
   - Add validation layer
   - Pass through structural metadata

8. **`src/pages/CreateDesignPage.jsx`**
   - Add 3D preview toggle
   - Display structural warnings
   - Show integrity score

9. **`src/pages/DesignDetailPage.jsx`**
   - Add 3D preview section
   - Display structural metadata
   - Show load capacity and warnings

10. **`src/components/design/DesignPreview.jsx`** (if exists)
    - Add 3D view option
    - Toggle between 2D spec view and 3D preview

---

## Dependencies

### Already Installed
- `three@^0.160.0` ✓

### May Need to Install
```bash
npm install @react-three/fiber @react-three/drei
```

**@react-three/fiber**: React renderer for Three.js
**@react-three/drei**: Helper components (OrbitControls, Environment, etc.)

---

## Implementation Approach

### Complexity: Medium

1. **Load Calculations**: Based on furniture type and expected use
2. **Material Strength Tables**: Industry-standard values
3. **Safety Factors**: 1.8x (standard for consumer furniture)
4. **Deflection Formula**: Simplified beam bending equation
5. **Stability Check**: Tip-over angle calculation

### Not Included (Future Advanced Features)
- Finite element analysis (FEA)
- Stress distribution heatmaps
- Joint strength calculations
- Manufacturing tolerances
- CNC/cutting optimization

---

## Backward Compatibility

- Existing designs without structural metadata will continue to work
- New fields are additions, not replacements
- 3D geometry is optional (generated on-demand)
- Old designs can be migrated by re-running through new generator

---

## Testing Strategy

1. **Unit Tests**: Test each physics calculation function individually
2. **Integration Tests**: Validate complete design generation
3. **Edge Cases**:
   - Very small furniture (< 50cm)
   - Very large furniture (> 300cm)
   - Extreme aspect ratios (very tall, very wide)
   - Different materials and loads
4. **Visual Tests**: 3D preview renders correctly for all furniture types

---

## Performance Considerations

- Engineering calculations add ~50-100ms to design generation
- 3D geometry generation adds ~20-50ms
- Total overhead: ~100-150ms (acceptable for user experience)
- 3D geometry is cached in design object (no recalculation needed)
- Three.js rendering is GPU-accelerated (smooth 60fps)

---

## Future Enhancements (Beyond This Plan)

- **Advanced Materials**: Engineered wood, composites, glass
- **Joint Design**: Mortise-tenon, dowels, biscuits, pocket screws
- **Manufacturing Output**: CNC G-code, cut lists with grain direction
- **Cost Optimization**: Minimize material waste, sheet nesting
- **AR Preview**: Use Three.js scene in AR.js or WebXR
- **Customization**: User-adjustable safety factors, load requirements
- **Sustainability**: Carbon footprint, material sourcing info

---

## Documentation Updates Needed

1. **README.md**: Add section on structural engineering features
2. **PHASES.md**: Add Phase 10 - Realistic Design Algorithm
3. **API Docs**: Document new design schema fields
4. **User Guide**: Explain structural scores, warnings, 3D preview

---

**End of Algorithm Plan**

This plan provides a comprehensive roadmap for implementing realistic, structurally sound furniture designs with 3D visualization capabilities while maintaining the existing AI-powered and manual design workflows.
