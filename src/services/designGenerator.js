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

// Standard Bed Sizes (Mattress Dimensions in CM)
const BED_SIZES = {
  'Single': { length: 90, width: 190 }, // UK/EU
  'Twin': { length: 90, width: 190 },   // US
  'Twin XL': { length: 90, width: 203 },
  'Double': { length: 137, width: 190 },
  'Full': { length: 137, width: 190 },
  'Queen': { length: 160, width: 200 }, // Default to EU Queen (larger)
  'King': { length: 180, width: 200 },  // Default to EU King
  'Super King': { length: 180, width: 200 },
  'California King': { length: 183, width: 213 }
};

// Default dimensions for each furniture type (in cm)
const DEFAULT_DIMENSIONS = {
  table: { length: 120, width: 80, height: 75 },
  chair: { length: 45, width: 45, height: 90 },
  bookshelf: { length: 80, width: 30, height: 180 },
  desk: { length: 140, width: 70, height: 75 },
  'bed frame': { length: 90, width: 190, height: 40 },
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

  // Logic for Long Tables (>220cm)
  const needsExtraSupport = length > 220;

  if (needsExtraSupport) {
    // Add Perimeter Support Legs (Mid-point of Long Sides)
    parts.push({
      id: 'table-leg-mid',
      name: 'Perimeter Support Leg',
      type: 'support',
      dimensions: { length: legSize, width: legSize, height: height - topThickness },
      quantity: 2,
      // Manual positioning required or handle in furnitureEngineering? 
      // Manual is safer for specific perimeter requirement.
      // X=0 (Mid), Z = +/- (Width/2 - LegSize/2)
      position: { x: 0, y: (height - topThickness) / 2, z: (width / 2) - (legSize / 2) },
      // Duplicate for Z negative ? anchorPattern 'mid-legs'?
      // Let's use explicit quantity 1 for each to avoid complex pattern logic
    });
    // Actually, pushing 2 manual parts is better
    parts.pop(); // Remove the generic push above

    // Inset to match Corner Legs (Pattern 1 default)
    const inset = 2;
    const legZ = (width / 2) - (legSize / 2) - inset;
    const legY = (height - topThickness) / 2;

    parts.push({
      id: 'table-leg-mid-1',
      name: 'Perimeter Support Leg',
      type: 'support',
      dimensions: { length: legSize, width: legSize, height: height - topThickness },
      quantity: 1,
      position: { x: 0, y: legY, z: legZ },
      material, color
    });
    parts.push({
      id: 'table-leg-mid-2',
      name: 'Perimeter Support Leg',
      type: 'support',
      dimensions: { length: legSize, width: legSize, height: height - topThickness },
      quantity: 1,
      position: { x: 0, y: legY, z: -legZ },
      material, color
    });
  }

  // Add structural additions if any
  if (engineeringSpecs.additions) {
    engineeringSpecs.additions.forEach((add, idx) => {
      // Ignore 'center-support' if we handled it via Perimeter Legs?
      // engineeringSpecs might trigger 'center-support' based on Load.
      // If we forcefully added legs, we should suppress duplicate center legs if they clash.
      // But 'center-support' usually means straight down the middle (X=0, Z=0).
      // Perimeter legs are X=0, Z=Side. So no clash.

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
        const apronHei = add.dimensions.height;
        const apronThick = add.dimensions.thickness;
        // Apron Y Position: Under Top
        const apronY = height - topThickness - (apronHei / 2);

        if (needsExtraSupport) {
          // SPLIT APRON LOGIC (Updated for 2cm Inset)
          const inset = 2; // Matches leg inset
          const safety = 0.05; // Gap

          // Gap = L/2 - 1.5*LegSize - Inset
          const segmentLength = (length / 2) - (1.5 * legSize) - inset - safety;

          // Center X = L/4 - 0.25*LegSize - 0.5*Inset
          const segCenterX = (length / 4) - (0.25 * legSize) - (0.5 * inset);

          // Z Offset matches Inset Legs
          const zOffset = (width / 2) - (legSize / 2) - inset;

          // Create 4 segments
          // Front Left (-X, +Z)
          parts.push(createManualApron(`apron-FL`, -segCenterX, apronY, zOffset, segmentLength, apronThick, apronHei, material, color));
          // Front Right (+X, +Z)
          parts.push(createManualApron(`apron-FR`, segCenterX, apronY, zOffset, segmentLength, apronThick, apronHei, material, color));
          // Back Left (-X, -Z)
          parts.push(createManualApron(`apron-BL`, -segCenterX, apronY, -zOffset, segmentLength, apronThick, apronHei, material, color));
          // Back Right (+X, -Z)
          parts.push(createManualApron(`apron-BR`, segCenterX, apronY, -zOffset, segmentLength, apronThick, apronHei, material, color));

        } else {
          // STANDARD LONG APRON
          parts.push({
            id: `apron-long-${idx}`,
            name: 'Apron (Long)',
            type: 'support',
            dimensions: { length: length - (2 * legSize), width: apronThick, height: apronHei },
            quantity: 2,
            anchorPattern: 'apron',
            material,
            color
          });
        }

        // SHORT APRON (Always Standard)
        parts.push({
          id: `apron-short-${idx}`,
          name: 'Apron (Short)',
          type: 'support',
          dimensions: { length: width - (2 * legSize), width: apronThick, height: apronHei },
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

// Helper for Manual Apron
function createManualApron(id, x, y, z, len, thick, h, mat, col) {
  return {
    id,
    name: 'Apron Segment',
    type: 'support',
    dimensions: { length: len, width: thick, height: h },
    quantity: 1,
    position: { x, y, z },
    material: mat,
    color: col
  };
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
  const thickness = 2; // Shelf thickness
  const baseHeight = 10; // Bottom Panel height
  const topHeight = 2;   // Top Panel height

  // 1. Calculate Usable Height
  const usableHeight = height - baseHeight - topHeight;

  // 2. Determine Shelf Count
  let internalShelves = 0;

  if (engineeringSpecs.shelves) {
    // User requested specific count.
    // UX Decision: User perceives "Shelves" as Total Horizontal Surfaces.
    // 1 of them is the Bottom Panel.
    // So, Internal Shelves = Requested - 1.
    // Exception: If they ask for 1 shelf, that's just the bottom panel? Or 1 internal?
    // Let's assume user count includes the bottom.
    // "7 shelves" -> 6 internal + 1 bottom = 7 surfaces.

    // Ensure we don't go negative if user says 0 or 1.
    internalShelves = Math.max(0, engineeringSpecs.shelves - 1);

    // Constraint Check: Minimum 20cm gap
    const minGap = 20;
    const maxShelves = Math.floor((usableHeight - minGap) / (thickness + minGap));

    if (internalShelves > maxShelves) {
      // User wanted X total (X-1 internal).
      // If we cap internal, we effectively cap total.
      const cappedTotal = maxShelves + 1;
      const msg = `Requested ${engineeringSpecs.shelves} shelves, capped at ${cappedTotal} for viability (min 20cm gap).`;
      console.warn(`[DesignGenerator] ${msg}`);

      // Push to engineeringSpecs.warnings (Pass-by-reference to bubble up)
      if (!engineeringSpecs.warnings) engineeringSpecs.warnings = [];
      engineeringSpecs.warnings.push(msg);

      internalShelves = maxShelves;
    }
  } else {
    // Auto-calculate based on ideal 35cm gap
    const idealGap = 35;
    internalShelves = Math.floor((usableHeight - idealGap) / (idealGap + thickness));

    // Fallback/Clamp
    internalShelves = Math.max(1, internalShelves);
  }

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
      anchorPattern: 'bottom',
      material,
      color,
    },
    // PARTITION MANAGER (Virtual Part -> Spawns Dividers)
    {
      id: 'bookshelf-partition', // Renamed from 'bookshelf-divider' for consistency
      name: 'Vertical Partition', // Renamed from 'Partition'
      type: 'support',
      // Start with standard thickness. Height is dynamic (per interval).
      dimensions: { length: thickness, width: width, height: 10 },
      quantity: 1, // Placeholder. Logic updates this based on 3D generation.
      anchorPattern: 'vertical-partition',
      material,
      color,
      meta: {
        strategy: engineeringSpecs && engineeringSpecs.partitionStrategy, // 1. Engineering Specs (Now uses updated projectedLoad)
        count: engineeringSpecs && engineeringSpecs['partitionCount'],
        modifiers: engineeringSpecs && engineeringSpecs.shelfModifiers
      }
    }
  ];

  // Logic block for manual partition addition removed.
  // 'bookshelf-partition' above handles all cases via applyAnchorPoints.

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
 * Updated: Supports 'open-compartment' (U-shape/Box) instead of drawers.
 * Overhauled to fix syntax issues and ensure full-width storage logic.
 */
function generateDeskParts(dimensions, material, color, engineeringSpecs) {
  const { length, width, height } = dimensions;

  // Extract engineering specs safely
  const legSize = engineeringSpecs.legSize || 4;
  const topThickness = engineeringSpecs.topThickness || 2.5;
  const storageType = engineeringSpecs.storageType || 'open-compartment';

  // Partition Logic - Safe Extraction
  console.log('DesignGenerator Desk Specs:', JSON.stringify(engineeringSpecs, null, 2));
  let strategy = engineeringSpecs.partitionStrategy || 'none';
  let pCount = engineeringSpecs.deskPartitionCount || engineeringSpecs.partitionCount || 0;
  const pRatio = engineeringSpecs.partitionRatio || 'equal';

  // INTELLIGENT INFERENCE: If a specific ratio is provided, it overrides strategy/count
  if (pRatio && typeof pRatio === 'string' && pRatio !== 'equal' && pRatio !== 'random') {
    // Check if ratio implies multiple segments (e.g. "3:2:5")
    const segments = pRatio.split(/[:,\-\s]+/).filter(s => !isNaN(parseFloat(s)));
    if (segments.length > 1) {
      pCount = segments.length - 1;
      strategy = 'ratio'; // Force ratio strategy
    }
  }

  // STRICT GUARD: If strategy is 'none', force count to 0, UNLESS count > 0 is explicitly extracted or inferred.
  if (strategy === 'none') {
    if (pCount > 0) {
      // User asked for N partitions but didn't specify strategy -> Force Equal
      console.log(`[DesignGenerator] auto-enforcing 'equal' strategy for ${pCount} partitions.`);
      strategy = 'equal';
    } else {
      pCount = 0;
    }
  }

  // Output for debugging
  // console.log(`[DesignGenerator] Partition Logic Resolved: Strategy=${strategy}, Count=${pCount}, Ratio=${pRatio}`);

  // Random Strategy Handling

  if (strategy === 'random' || strategy === 'random-shelves') {
    pCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 partitions
  }

  // --- SIDE STORAGE LOGIC (V2) ---
  const sideStorage = engineeringSpecs.sideStorage || 'none';
  const sideShelves = engineeringSpecs.sideShelves || { left: 2, right: 2 };

  // Constraints
  const MIN_LEG_SPACE = 60; // Ergonomic standard
  const MAX_SIDE_UNIT_RATIO = 0.33; // Max 1/3 desk width per unit

  // Determine Side Units
  const hasLeftStorage = (sideStorage === 'left' || sideStorage === 'both');
  const hasRightStorage = (sideStorage === 'right' || sideStorage === 'both');

  // Calculate Unit Widths
  let sideUnitWidth = 0;
  if (hasLeftStorage || hasRightStorage) {
    // Default 40cm, key off User Input if available
    let targetWidth = 40;
    if (engineeringSpecs.sideStorageWidth) {
      targetWidth = engineeringSpecs.sideStorageWidth;
    }

    // Constraint: Max 1/3 of Desk LENGTH (not depth/width)
    // User Requirement: "cannot span more than a 3rd of the length of the desk top"
    // Note: 'length' is the long dimension (Left-Right).
    const maxAllowed = length * MAX_SIDE_UNIT_RATIO;

    // Apply Constraint
    sideUnitWidth = Math.min(targetWidth, maxAllowed);

    if (targetWidth !== 40 || sideUnitWidth !== targetWidth) {
      console.log(`[DesignGenerator] Side Storage Width: Requested=${targetWidth}cm, MaxAllowed=${maxAllowed.toFixed(1)}cm, Final=${sideUnitWidth}cm`);
    }
  }

  // Calculate Total Occupied Width
  const leftOccupied = hasLeftStorage ? sideUnitWidth : 0;
  const rightOccupied = hasRightStorage ? sideUnitWidth : 0;
  const totalOccupied = leftOccupied + rightOccupied;

  // Check Leg Space & Resize if needed
  let finalLength = length;
  let legSpace = finalLength - totalOccupied;

  if (legSpace < MIN_LEG_SPACE) {
    // Auto-Expand
    const needed = MIN_LEG_SPACE + totalOccupied;
    console.log(`[DesignGenerator] Auto-expanding desk from ${length} to ${needed}cm for leg space.`);
    finalLength = needed;
    legSpace = MIN_LEG_SPACE;
  }

  // Storage Configuration
  const storageHeight = 15; // cm
  const storageDepth = width; // Full depth
  const openStorage = (storageType === 'open-compartment' || storageType === 'drawer');

  // Adjust Storage (Apron) Dimensions
  // Strategy: Dynamic Fill.
  // If Side Storage exists, Apron fills the remaining space.
  // If No Side Storage, Apron spans full width (Floating Box style).

  const apronLeftX = hasLeftStorage ? (-finalLength / 2 + sideUnitWidth) : (-finalLength / 2);
  const apronRightX = hasRightStorage ? (finalLength / 2 - sideUnitWidth) : (finalLength / 2);

  const apronWidth = apronRightX - apronLeftX;
  const apronCenterX = apronLeftX + (apronWidth / 2);

  // Constraint: Disable partitions in under-desk unit if Double Side Storage
  if (sideStorage === 'both') {
    strategy = 'none';
    pCount = 0;
    console.log('[DesignGenerator] Double side storage detected. Disabling under-desk partitions.');
  }

  // Gap Fix: Small overlap to merge geometries
  const overlap = 0.2;

  // Leg Height Calculation
  const effectiveLegHeight = openStorage
    ? height - topThickness - storageHeight + overlap
    : height - topThickness;

  // --- MODULAR BUILD PROCESS (V3) ---
  const parts = [];

  // MODULE 1: DESK TOP (Always present)
  // Position: TOP aligned. Center = H/2 - Thickness/2.
  const topY = (height / 2) - (topThickness / 2);

  parts.push({
    id: 'desk-top',
    name: 'Desk Top',
    type: 'surface',
    dimensions: { length: finalLength, width, height: topThickness },
    quantity: 1,
    position: { x: 0, y: topY, z: 0 }, // Explicit Position
    material,
    color,
  });

  // Calculate Side Storage Y
  // Anchor: Floor (-H/2). Height = H - Top.
  // Center Y = -H/2 + UnitHeight/2.
  const sideUnitHeight = height - topThickness;
  const sideStorageY = (-height / 2) + (sideUnitHeight / 2);

  // Calculate Structural Thickness based on Load (Global)
  const load = engineeringSpecs.distributedLoad || 50;
  let wallThick = 1.5;
  if (load > 1000) wallThick = 5.0;
  else if (load > 500) wallThick = 3.5;
  else if (load > 200) wallThick = 2.5;

  if (hasLeftStorage) {
    parts.push({
      id: 'side-storage-left',
      name: 'Side Storage Unit (Left)',
      type: 'complex',
      dimensions: { length: sideUnitWidth, width: width, height: sideUnitHeight },
      position: { x: (-finalLength / 2) + (sideUnitWidth / 2), y: sideStorageY, z: 0 },
      material, color,
      quantity: 1,
      meta: {
        subtype: 'vertical-storage',
        shelfCount: sideShelves.left,
        topThickness: topThickness,
        fullSpan: true,
        hasBack: true,
        wallThickness: wallThick, // Structural Walls scale with Load
        shelfThickness: 1.5       // Shelves stay thin
      }
    });
  }

  if (hasRightStorage) {
    parts.push({
      id: 'side-storage-right',
      name: 'Side Storage Unit (Right)',
      type: 'complex',
      dimensions: { length: sideUnitWidth, width: width, height: sideUnitHeight },
      position: { x: (finalLength / 2) - (sideUnitWidth / 2), y: sideStorageY, z: 0 },
      material, color,
      quantity: 1,
      meta: {
        subtype: 'vertical-storage',
        shelfCount: sideShelves.right,
        topThickness: topThickness,
        fullSpan: true,
        hasBack: true,
        wallThickness: wallThick, // Structural Walls scale with Load
        shelfThickness: 1.5       // Shelves stay thin
      }
    });
  }

  // MODULE 3: LEGS (Conditional)
  const addLegs = (side) => {
    const inset = openStorage ? legSize : 0;
    const xOffset = (finalLength / 2) - (legSize / 2) - inset;
    const isLeft = side === 'left';
    const xPos = isLeft ? -xOffset : xOffset;

    // Anchor: Floor (-H/2). Height = effectiveLegHeight.
    // Center Y = -H/2 + LegHeight/2.
    const legY = (-height / 2) + (effectiveLegHeight / 2);

    [-1, 1].forEach(zDir => {
      const zPos = zDir * ((width / 2) - (legSize / 2));
      parts.push({
        id: `leg-${side}-${zDir}`,
        name: `Leg ${side} ${zDir > 0 ? 'Back' : 'Front'}`,
        type: 'support',
        dimensions: { length: legSize, width: legSize, height: effectiveLegHeight },
        quantity: 1,
        position: { x: xPos, y: legY, z: zPos },
        material, color
      });
    });
  };

  if (!hasLeftStorage) addLegs('left');
  if (!hasRightStorage) addLegs('right');

  // MODULE 4: CENTRAL STORAGE
  if (openStorage) {
    const load = engineeringSpecs.distributedLoad || 50;
    let wallThick = 1.5;
    if (load > 1000) wallThick = 5.0;
    else if (load > 500) wallThick = 3.5;
    else if (load > 200) wallThick = 2.5;

    // Position: Under Top. 
    // Anchor: Top Edge = (H/2) - TopThickness.
    // Center Y = TopEdge - (StorageHeight/2) + Overlap.
    const apronY = (height / 2) - topThickness - (storageHeight / 2) + overlap;

    parts.push({
      id: 'desk-storage-unit',
      name: 'Open Storage',
      type: 'storage',
      dimensions: { length: apronWidth, width: storageDepth, height: storageHeight },
      quantity: 1,
      anchorPattern: 'under-top',
      position: { x: apronCenterX, y: apronY, z: 0 },
      material,
      color,
      meta: {
        subtype: 'under-desk-storage',
        isOpen: true,
        hasBack: true,
        fullSpan: true,
        suppressLeft: hasLeftStorage,
        suppressRight: hasRightStorage,
        topThickness: topThickness,
        verticalOverlap: overlap,
        wallThickness: wallThick,
        partitionStrategy: strategy,
        partitionRatio: pRatio,
        partitionCount: pCount // 1
      }
    });
  }

  return parts;
}

/**
 * Generate parts for PLATFORM BED FRAME (Unified Architecture)
 * Metric: CM
 * Logic: "Mattress First". Frame surrounds the mattress.
 */
function generatePlatformBedParts(dimensions, material, color, engineeringSpecs, bedSizeName) {
  // 1. Resolve Dimensions (Mattress vs Frame)
  // If `bedSizeName` is provided, we use standard mattress dims.
  // If not, we assume `dimensions` ARE the mattress dimensions (Custom request).

  let mattressL, mattressW;

  if (bedSizeName && BED_SIZES[bedSizeName]) {
    mattressW = BED_SIZES[bedSizeName].length; // Map consistency check: W is usually shorter 
    // Wait, BED_SIZES has { length: 90, width: 190 } ??
    // Standard convention: Width (Side-to-Side), Length (Head-to-Toe).
    // In designGenerator, 'length' is usually Width (X-axis) for tables? 
    // Let's check: Table 120 (L) x 80 (W). 120 is usually Left-Right.
    // Bed: 180 (W) x 200 (L). 
    // My BED_SIZES above had L=90 W=190. That implies L=Width. 
    // Correcting interpretation: L=Width (X), W=Length/Depth (Z).
    mattressL = BED_SIZES[bedSizeName].length;
    mattressW = BED_SIZES[bedSizeName].width;
  } else {
    // User Custom Dims
    mattressL = dimensions.length;
    mattressW = dimensions.width;
  }

  // HEAVY DUTY SCALING
  // Default Load rule: Double (137cm+) -> 1500kg?
  // Or check engineeringSpecs.distributedLoad.

  let isHeavyDuty = false;
  if ((engineeringSpecs.distributedLoad || 0) >= 1500) {
    isHeavyDuty = true;
  } else if (mattressL >= 135) {
    // Force 1500kg spec if not already set high
    engineeringSpecs.distributedLoad = 1500;
    isHeavyDuty = true;
    console.log(`[DesignGenerator] Upgrading Bed to Heavy Duty (1500kg) due to size ${mattressL}cm`);
  }


  // Specs
  const railH = 20; // 20cm tall rails
  let railThick = isHeavyDuty ? 4.0 : 2.5; // Robust
  let legSize = isHeavyDuty ? 10 : 6;

  // Adjust Outer Frame Dimensions
  // Headboard/Footboard contain the rails? Or Rails butted?
  // Platform Style: HB and FB extend to floor (Posts). Rails between them.
  // Frame Width = Mattress Width + (2 * Gap) + (2 * RailThick)?
  // Let's do: Frame Width = Mattress Width + 2cm (Gap) + 2*RailThick.
  // NO, modern sleek: Rails are flush with mattress edge or 1cm gap.

  const gap = 1;
  const outerWidth = mattressL + (2 * railThick) + (2 * gap);
  const outerLength = mattressW + (2 * railThick) + (2 * gap); // Include HB/FB thickness

  // PARTS
  const parts = [];

  // 1. HEADBOARD
  // Full Width (Outer). Height = 100cm.
  // Position: Rear (Z = -OuterLength/2) - wait, auto-layout handles Z?
  // No, we need explicit positions for 'Floating' architecture logic if possible, 
  // OR rely on anchor points.
  // Let's use Anchor Logic but define dimensions precisely.

  parts.push({
    id: 'bed-headboard', name: 'Headboard', type: 'surface',
    dimensions: { length: outerWidth, width: railThick, height: 100 },
    quantity: 1,
    material, color,
    position: { x: 0, y: 50, z: -(outerLength / 2) + (railThick / 2) } // Explicit Z
  });

  // 2. FOOTBOARD
  // Full Width. Height = 40cm (Low profile).
  parts.push({
    id: 'bed-footboard', name: 'Footboard', type: 'surface',
    dimensions: { length: outerWidth, width: railThick, height: 40 },
    quantity: 1,
    material, color,
    position: { x: 0, y: 20, z: (outerLength / 2) - (railThick / 2) }
  });

  // 3. SIDE RAILS
  // Run between HB and FB.
  // Length (Z) = OuterLength - 2*RailThick.
  const railLen = outerLength - (2 * railThick);
  // Position: X = +/- (OuterWidth/2 - RailThick/2).
  // Height: 20cm. Off floor by LegHeight (e.g. 15cm).
  const legH = 15;
  const railY = legH + (railH / 2);

  const xRail = (outerWidth / 2) - (railThick / 2);

  parts.push({
    id: 'bed-rail-left', name: 'Side Rail (Left)', type: 'support',
    dimensions: { length: railThick, width: railLen, height: railH },
    quantity: 1,
    material, color,
    position: { x: -xRail, y: railY, z: 0 }
  });

  parts.push({
    id: 'bed-rail-right', name: 'Side Rail (Right)', type: 'support',
    dimensions: { length: railThick, width: railLen, height: railH },
    quantity: 1,
    material, color,
    position: { x: xRail, y: railY, z: 0 }
  });

  // 4. LEGS
  // 4 Corners. Under the HB/FB posts? Or offset?
  // Simple: 4 chunky legs under the corners of the frame.
  // Height = legH + railH? No, typically simpler.
  // Let's say legs go from floor to top of Rail (legH + railH = 35cm).

  const totalLegH = legH + railH;

  // Corner Positions
  //   const legX = (outerWidth/2) - (legSize/2);
  //   const legZ = (outerLength/2) - (legSize/2);

  // Actually, let's use the standard 'corners' anchor pattern to save manual math,
  // BUT we must update dimensions to reflect the OUTER size, not the inner mattress size.
  // The generator uses `finalDimensions` passed in. We might need to trick it or force positions.
  // FOR NOW: Explicit positions are safest for this custom arch.

  [1, -1].forEach(xDir => {
    [1, -1].forEach(zDir => {
      parts.push({
        id: `bed-leg-${xDir}-${zDir}`, name: 'Structural Post', type: 'support',
        dimensions: { length: legSize, width: legSize, height: totalLegH },
        quantity: 1,
        material, color,
        position: {
          x: xDir * ((outerWidth / 2) - (legSize / 2)),
          y: totalLegH / 2,
          z: zDir * ((outerLength / 2) - (legSize / 2))
        }
      });
    });
  });

  // 5. CENTER BEAM (Heavy Duty)
  // Required if Width > 120cm
  if (mattressL > 120) {
    // Lower the beam by slat thickness (2cm) so slats rest ON it
    const beamH = railH - 2;
    parts.push({
      id: 'bed-center-beam', name: 'Center Main Beam', type: 'support',
      dimensions: { length: 6, width: railLen, height: beamH },
      quantity: 1,
      material, color,
      position: { x: 0, y: railY - 1, z: 0 } // Shifted down 1cm (Center of 18cm vs 20cm)
    });

    // CENTER LEGS (The "1500kg" secret)
    if (isHeavyDuty) {
      // Center legs must also be shorter (fit under slats)
      const centerLegH = totalLegH - 2;

      parts.push({
        id: 'bed-center-leg-1', name: 'Center Support Leg', type: 'support',
        dimensions: { length: 8, width: 8, height: centerLegH },
        quantity: 1,
        material, color,
        position: { x: 0, y: centerLegH / 2, z: 0 }
      });
      parts.push({
        id: 'bed-center-leg-2', name: 'Center Support Leg', type: 'support',
        dimensions: { length: 8, width: 8, height: centerLegH },
        quantity: 1,
        material, color,
        position: { x: 0, y: centerLegH / 2, z: railLen / 3 }
      });
      parts.push({
        id: 'bed-center-leg-3', name: 'Center Support Leg', type: 'support',
        dimensions: { length: 8, width: 8, height: centerLegH },
        quantity: 1,
        material, color,
        position: { x: 0, y: centerLegH / 2, z: -railLen / 3 }
      });
    }
  }

  // 6. SLATS
  // High density. 
  // Span = Inner Width.
  const slatSpan = outerWidth - (2 * railThick);
  const slatCount = 12;

  parts.push({
    id: 'bed-slat', name: 'Hardwood Slat', type: 'surface',
    dimensions: { length: slatSpan, width: 6, height: 2 }, // 6cm wide slats
    quantity: slatCount,
    material: 'wood', color: '#DEB887', // Always wood color for slats
    anchorPattern: 'distribute-z',
    position: { x: 0, y: totalLegH - 1, z: 0 }, // Flush with top (Height=2, Center = Top - 1)
    meta: {
      insetX: railThick // Tell anchor logic to respect rails? 
      // Actually, distribute-z uses dimensions.width (Z).
      // We need to pass the "Bed Length" to distribute-z logic.
      // Since we are inside generateParts, we rely on the engineering util 
      // to distribute them along the Z axis of the PARENT dimension?
      // Or we utilize the calculated railLen.
    }
  });

  // NOTE: The Engineering Utility Slat distribution relies on "dimensions.width" (Z-Axis).
  // We should prob pass explicit positions or rely on logic adjustment.
  // For now, let's trust the 'distribute-z' updates we might check later.

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
    let volume = calculateVolume(part.dimensions);
    if (isNaN(volume)) {
      console.warn(`[CostCalc] Invalid dimensions for part ${part.name} (ID: ${part.id}). Dims:`, part.dimensions);
      volume = 0;
    }
    const partCost = volume * materialProps.cost * part.quantity;
    if (isNaN(partCost)) {
      console.error(`[CostCalc] NaN Cost for ${part.name}: Vol=${volume}, Cost=${materialProps.cost}, Qty=${part.quantity}`);
    }
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
  /* eslint-disable no-unused-vars */
  const { furnitureType, material, dimensions, materialColor, hasArmrests } = config;
  /* eslint-enable no-unused-vars */

  // Initialize with inputs or defaults for processing
  // But wait, defaults aren't applied yet.
  // We need to verify type first.

  if (!furnitureType || !DEFAULT_DIMENSIONS[furnitureType]) {
    throw new Error(`Invalid furniture type: ${furnitureType}. Must be one of: table, chair, bookshelf, desk, bed frame`);
  }

  // 1. Setup Dimensions & Load (Mutable)
  let finalDimensions = dimensions ? { ...dimensions } : { ...DEFAULT_DIMENSIONS[furnitureType] };
  let projectedLoad = config.projectedLoad;

  // --- BED LOGIC PRE-PROCESS ---
  // If bedSize is provided, we must resolve dimensions AND load specs BEFORE generating parts/specs.
  if (furnitureType === 'bed frame') {
    let mattressL, mattressW;

    // 1. Resolve Dimensions
    if (config.bedSize && BED_SIZES[config.bedSize]) {
      // Standard Size
      mattressL = BED_SIZES[config.bedSize].length;
      mattressW = BED_SIZES[config.bedSize].width;
      // Note: In our system 'length' is X (Width of bed), 'width' is Z (Depth/Length of bed).
      // BED_SIZES = { width: 190, length: 90 }. Width=Z, Length=X.

      finalDimensions.length = mattressL;
      finalDimensions.width = mattressW;
      // Height remains as input or default
    } else {
      // Custom Dimensions (Mattress = Input)
      mattressL = finalDimensions.length;
      // If user didn't specify width/height, defaults might be wrongly applied by dimensions arg?
      // Assuming 'dimensions' has valid defaults from Parser if missing.
    }

    // 2. Resolve Load Capacity
    if (mattressL >= 135) {
      // Large Beds -> 1500kg
      if (!projectedLoad || projectedLoad < 1500) {
        projectedLoad = 1500;
        console.log(`[DesignGenerator] Auto-upgrading Bed to 1500kg capacity due to size (${mattressL}cm)`);
      }
    } else {
      // Small Beds -> 500kg (User Request)
      if (!projectedLoad || projectedLoad < 500) {
        projectedLoad = 500;
        console.log(`[DesignGenerator] Auto-upgrading Small Bed to 500kg capacity`);
      }
    }
  }

  if (!material || !MATERIALS[material]) {
    throw new Error(`Invalid material: ${material}. Must be one of: wood, metal, plastic`);
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
    projectedLoad: projectedLoad, // Pass updated local var (e.g. 1500kg for Beds)
    shelves: config.shelves, // Custom shelf count
    partitionStrategy: config.partitionStrategy, // Partition strategy (none, all, random)
    partitionRatio: config.partitionRatio, // Partition ratio (60-40, etc.)
    partitionCount: config.partitionCount, // Number of partitions per shelf
    shelfModifiers: config.shelfModifiers || [], // Per-shelf overrides
  });

  const { legSize, topThickness, additions, loadAnalysis, ...loadSpecs } = specs;

  // Extract for validation phase
  console.log(`[DesignGenerator] Flag hasArmrests: ${hasArmrests}`);

  const distributedLoad = projectedLoad || loadAnalysis.expectedLoad?.distributed || 50;

  const engineeringSpecs = {
    legSize,
    topThickness,
    additions,
    hasArmrests, // Pass this flag to part generators
    distributedLoad, // Pass load to part generators (Crucial for bed Heavy Duty check)
    shelves: specs.shelves, // Pass shelves count
    partitionStrategy: specs.partitionStrategy, // Pass partition strategy
    // distributedLoad: distributedLoad, // Pass load for structural sizing - This line was a duplicate and is removed.
    partitionRatio: config.partitionRatio || specs.partitionRatio, // 60-40, etc.
    partitionCount: config.partitionCount || specs.partitionCount, // Number of partitions per shelf
    deskPartitionCount: config.partitionCount || specs.partitionCount, // Alias for desk safety
    shelfModifiers: specs.shelfModifiers, // Pass modifiers
    storageType: config.storageType || 'open-compartment',
    storageLocation: config.storageLocation || 'under-top',
    sideStorage: config.sideStorage,
    sideShelves: config.sideShelves,
    sideStorageWidth: config.sideStorageWidth // Pass custom width to generator
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
      // Updated V2 Logic
      parts = generatePlatformBedParts(finalDimensions, material, color, engineeringSpecs, config.bedSize);
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


  // Cost calculation moved to AFTER BOM correction for accuracy
  // const totalCost = calculateTotalCost(parts, material);

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
    totalCost: 0, // Placeholder, will be updated after BOM correction
    instructions,
    assemblyTime,
    structural: structuralReport, // Attach engineering data
    warnings: [...(engineeringSpecs.warnings || [])] // Merge AI warnings and Engineering warnings
  };

  // --- 3D GENERATION PHASE ---
  // Apply Engineering Anchors to calculate explicit positions
  // This "explodes" parts (Leg x4 becomes Leg-1, Leg-2...) and sets precise x/y/z
  const { parts: positionedParts, warnings: anchorsWarnings } = applyAnchorPoints(parts, furnitureType, finalDimensions, structuralReport);

  // Combine all warnings
  const finalWarnings = [...design.warnings, ...(anchorsWarnings || [])];

  // --- BOM CORRECTION PHASE ---
  // Recalculate quantities based on actual 3D parts generated
  // Strategy: Group by "Name", but also verify dimensions match for accuracy.
  // For simplicity and to match the visual name, we group by Name.

  const aggregatedParts = new Map();

  positionedParts.forEach(p => {
    // Normalizing Key: Group by Name AND Dimensions to distinguish variants
    // Round dimensions to avoid float precision issues causing duplicates
    const dimKey = `${Math.round(p.dimensions.length)}x${Math.round(p.dimensions.width)}x${Math.round(p.dimensions.height)}`;
    const key = `${p.name}|${dimKey}`;

    if (aggregatedParts.has(key)) {
      const entry = aggregatedParts.get(key);
      entry.quantity += 1;
    } else {
      // Create new entry based on this part instance
      // We strip the specific ID/Position to make it generic
      const genericPart = { ...p, quantity: 1 };
      delete genericPart.position; // Remove specific position
      delete genericPart.id;       // Remove instance ID
      // Assign a generic ID for the list
      genericPart.id = p.name.toLowerCase().replace(/\s+/g, '-') + '-' + dimKey;

      aggregatedParts.set(key, genericPart);
    }
  });

  // Convert map back to array
  const correctedParts = Array.from(aggregatedParts.values());

  const geometry3D = generateThreeJSGeometry({
    ...design,
    parts: positionedParts // Use the exploded, positioned parts for 3D
  });

  // Corrected Cost Calculation
  const correctedTotalCost = calculateTotalCost(correctedParts, material);

  return {
    ...design,
    parts: correctedParts, // Use corrected BOM for UI
    bom: undefined, // Cleanup
    totalCost: correctedTotalCost, // Update cost with actual parts
    warnings: finalWarnings, // Override with full list
    geometry: geometry3D
  };
}
