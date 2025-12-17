/**
 * AI-KEA Furniture Engineering Utilities
 * Provides physics-based estimations for structural integrity, stability, and workforce requirements.
 * Also handles explicit part positioning (Anchor Points).
 */

const MATERIALS_STRENGTH = {
    // Compressive strength in MPa
    wood: 40,
    metal: 250,
    plastic: 30,
    glass: 50 // High compressive, low tensile
};

const MATERIALS_MODULUS = {
    // Young's Modulus in GPa
    wood: 11,
    metal: 200,
    plastic: 2.5,
    glass: 70
};

/**
 * Calculate expected load based on furniture type
 * @param {string} type 
 * @returns {object} Full load analysis
 */
export function calculateLoadRequirements(type) {
    const t = type.toLowerCase();
    let load = 30; // Default

    if (t.includes('chair') || t.includes('stool')) load = 120;
    else if (t.includes('table') || t.includes('desk')) load = 50;
    else if (t.includes('shelf') || t.includes('rack')) load = 20;
    else if (t.includes('bed')) load = 200;

    return {
        totalLoad: load,
        expectedLoad: {
            distributed: load, // Simplified for now
            point: load * 0.8
        },
        selfWeight: 15 // Placeholder estimation
    };
}

/**
 * Calculate minimum leg dimensions
 * @param {number} loadKg 
 * @param {number} heightCm 
 * @param {string} material 
 * @param {number} quantity 
 * @returns {number} Minimum width/thickness in cm
 */
export function calculateLegDimensions(loadKg, heightCm, material, quantity) {
    // Simple Euler buckling estimation
    // P_crit = (pi^2 * E * I) / (K * L)^2
    // We simplify to a safe stress check with a high safety factor

    // Distribute load
    const loadPerLeg = loadKg / (quantity || 4);

    // Min sizes (heuristic)
    let minDim = 2.0; // cm

    if (loadPerLeg > 30 && material === 'wood') minDim = 3.5;
    if (loadPerLeg > 50 && material === 'wood') minDim = 5.0;

    if (material === 'metal') minDim = Math.max(1.5, minDim * 0.5);

    // Slenderness check
    if (heightCm / minDim > 40) {
        minDim = heightCm / 40; // Prevent spindly legs
    }

    // Return dimensions for different profiles
    return {
        square: minDim,
        round: minDim * 1.15 // Slightly larger diameter for equivalent area/strength
    };
}

/**
 * Calculate integrity score (0-100)
 */
export function calculateIntegrityScore(loadAnalysis, deflectionAnalysis, stabilityAnalysis, additions, assemblyFeasibility) {
    // Placeholder for complex FEA
    let score = 95;

    // Penalty for stability issues
    if (!stabilityAnalysis.safe) {
        score -= 20;
    }

    // Penalty for deflection
    if (deflectionAnalysis && deflectionAnalysis > 2.0) { // Tolerance in cm
        score -= 15;
    }

    return Math.max(10, score);
}

/**
 * Calculate deflection of horizontal surfaces
 */
export function calculateDeflection(length, width, thickness, material, load) {
    // Beam formula: delta = (F * L^3) / (48 * E * I) (Simply supported center load)
    // E in GPa -> convert to N/cm^2 approx
    // I = (w * h^3) / 12

    const E = (MATERIALS_MODULUS[material] || 10) * 1e9; // Pascals
    // Convert to N/cm^2: 1 Pa = 1 N/m^2 = 1e-4 N/cm^2 ... wait, GPa = 1e9 Pa.
    // 1 GPa = 10^9 N/m^2 = 10^5 N/cm^2
    const E_N_cm2 = (MATERIALS_MODULUS[material] || 10) * 100000;

    // Moment of Inertia
    const I = (width * Math.pow(thickness, 3)) / 12;

    const LoadN = load * 9.8;

    const L3 = Math.pow(length, 3);

    const deflection = (LoadN * L3) / (48 * E_N_cm2 * I);

    const isAcceptable = deflection <= 0.5; // Max 5mm deflection

    // Calculate recommended thickness if failing (inverse formula)
    let recommendedThickness = thickness;
    if (!isAcceptable) {
        // I_req = (F * L^3) / (48 * E * delta_max)
        // h^3 = (12 * I_req) / w
        const maxDeflection = 0.5;
        const I_req = (LoadN * L3) / (48 * E_N_cm2 * maxDeflection);
        const h3 = (12 * I_req) / width;
        recommendedThickness = Math.pow(h3, 1 / 3);
        recommendedThickness = Math.ceil(recommendedThickness * 2) / 2; // Round up to nearest 0.5
    }

    return {
        deflection,
        isAcceptable,
        recommendedThickness
    };
}

/**
 * Calculate stability (tipping risk)
 */
/**
 * Calculate stability (tipping risk)
 */
export function calculateStability(dimensions) {
    // If dimensions are missing/invalid, default to safe
    if (!dimensions) return { safe: true, reason: 'Dimension data missing' };

    const baseMin = Math.min(dimensions.length, dimensions.width);
    const height = dimensions.height;

    // Avoid division by zero
    if (baseMin <= 0) return { safe: true, reason: 'Invalid base dimensions' };

    const ratio = height / baseMin;

    if (ratio > 3) return { safe: false, reason: 'Too tall for its base' };
    return { safe: true, reason: 'Stable ratio' };
}

/**
 * Recommend structural additions
 */
/**
 * Recommend structural additions
 */
export function determineStructuralAdditions(furnitureType, dimensions) {
    const additions = [];

    // APRONS: Always recommended for tables > 120cm
    if (dimensions.length > 120 && furnitureType === 'table') {
        additions.push({ type: 'apron', quantity: 1, dimensions: { thickness: 2.5, height: 8 } });
    }

    // PERIMETER LEGS: Avoid center legs. If very long, add side legs.
    if (dimensions.length > 220 && furnitureType === 'table') {
        // Add 2 extra legs (6 total) positioned at mid-sides
        additions.push({
            type: 'side-leg',
            quantity: 2,
            dimensions: { thickness: 4, height: dimensions.height } // Thickness placeholder, will be overwritten
        });
    }

    return additions;
}

/**
 * Validate feasibility
 */
export function validateAssemblyFeasibility(design) {
    return { feasible: true, warnings: [] };
}

/**
 * Estimate workforce/time
 */
export function estimateWorkforce(parts) {
    const partCount = parts.reduce((acc, p) => acc + (p.quantity || 1), 0);
    const hours = Math.ceil(partCount * 0.5);
    return {
        hours,
        people: hours > 4 ? 2 : 1
    };
}


/**
 * Apply structural anchor points to position parts explicitly.
 * This replaces heuristic guessing in the geometry engine.
 * @param {Array} parts - The list of abstract parts
 * @param {string} furnitureType - 'table', 'chair', etc.
 * @param {object} dimensions - Global dimensions {length, width, height}
 */
export function applyAnchorPoints(parts, furnitureType, dimensions) {
    if (!dimensions) {
        console.error('applyAnchorPoints: dimensions is missing', { parts, furnitureType });
        dimensions = { length: 0, width: 0, height: 0 }; // Fallback to prevent crash
    }
    const { length, width, height } = dimensions;
    const safeNum = (v) => Number.isFinite(v) ? v : 0;

    // Clone parts to avoid side-effects
    const positionedParts = parts.map(p => ({ ...p }));

    // --- 1. ASSIGN ANCHOR PATTERNS ---
    positionedParts.forEach(part => {
        // Tables / Desks
        if (furnitureType === 'table' || furnitureType === 'desk') {
            // Table Top
            if (part.type === 'surface' || part.name.toLowerCase().includes('top')) {
                const thickness = safeNum(part.dimensions.height);
                part.position = { x: 0, y: height - (thickness / 2), z: 0 };
            }
            // Corner Legs
            else if ((part.type === 'support' || part.name.toLowerCase().includes('leg'))
                && !part.name.toLowerCase().includes('center')
                && !part.name.toLowerCase().includes('apron')) {
                part.anchorPattern = 'corners';
            }
            // Center Legs
            else if (part.name.toLowerCase().includes('center')) {
                part.anchorPattern = 'distribute-x';
            }
            // Aprons
            else if (part.name.toLowerCase().includes('apron')) {
                part.anchorPattern = 'apron';
            }
        }

        // Chairs
        else if (furnitureType === 'chair') {
            const seatY = height * 0.5;

            // Seat
            if (part.name.toLowerCase().includes('seat')) {
                const pHei = safeNum(part.dimensions.height);
                part.position = { x: 0, y: seatY - (pHei / 2), z: 0 };
            }
            // Legs
            else if (part.name.toLowerCase().includes('leg')) {
                part.anchorPattern = 'corners';
            }
            // Backrest
            else if (part.name.toLowerCase().includes('back')) {
                const pHei = safeNum(part.dimensions.height);
                // Position: Centered X, Sitting on Seat Y, At Back Z
                const pThick = safeNum(part.dimensions.width); // usually thickness is width for vertical panels

                part.position = {
                    x: 0,
                    y: seatY + (pHei / 2),
                    z: -(width / 2) + (pThick / 2)
                };
            }
        }

        // Bookshelves
        else if (furnitureType === 'bookshelf') {
            // Sides
            if (part.name.toLowerCase().includes('side')) {
                part.anchorPattern = 'sides';

                // FIX: Ensure dimensions are oriented correctly (Thin X, Deep Z)
                // If Length (X) is large (> 5cm) and Width (Z) is small (< 5cm), swap them.
                // Assuming side panels are usually thin (< 5cm).
                if (part.dimensions.length > 5 && part.dimensions.width <= 5) {
                    const temp = part.dimensions.length;
                    part.dimensions.length = part.dimensions.width;
                    part.dimensions.width = temp;
                }
            }
            // Shelves
            else if (part.name.toLowerCase().includes('shelf')) {
                part.anchorPattern = 'distribute-y';
            }
            // Top/Bottom specifically? Treat as shelf for now or dedicated?
            else if (part.name.toLowerCase().includes('top')) {
                part.position = { x: 0, y: height - safeNum(part.dimensions.height) / 2, z: 0 };
            }
            else if (part.name.toLowerCase().includes('bottom')) {
                part.position = { x: 0, y: 5, z: 0 }; // Lifted bottom
            }
            // Back
            else if (part.name.toLowerCase().includes('back')) {
                const pThick = safeNum(part.dimensions.thickness, 0.5);
                part.position = { x: 0, y: height / 2, z: -(width / 2) + (pThick / 2) };
            }
        }
    });

    // --- 2. EXPLODE AND CALCULATE POSITIONS ---
    const explodedParts = [];

    positionedParts.forEach(part => {
        const qty = part.quantity || 1;

        // Pattern 1: CORNERS (4 Legs)
        if (qty > 1 && part.anchorPattern === 'corners') {
            const pLen = safeNum(part.dimensions.length);
            const pWid = safeNum(part.dimensions.width);
            const pHei = safeNum(part.dimensions.height);

            const inset = 2;
            const halfL = (length / 2) - (pLen / 2) - inset;
            const halfW = (width / 2) - (pWid / 2) - inset;

            const corners = [
                { x: halfL, z: halfW },
                { x: -halfL, z: halfW },
                { x: -halfL, z: -halfW },
                { x: halfL, z: -halfW }
            ];

            for (let i = 0; i < qty; i++) {
                const pos = corners[i % 4];
                explodedParts.push({
                    ...part,
                    id: `${part.id}-${i}`,
                    originalId: part.id,
                    quantity: 1,
                    position: { x: pos.x, y: pHei / 2, z: pos.z }
                });
            }
        }
        // Pattern 2: DISTRIBUTE X (Center Legs)
        else if (qty > 1 && part.anchorPattern === 'distribute-x') {
            const count = qty;
            const step = length / (count + 1);
            const pHei = safeNum(part.dimensions.height);

            for (let i = 0; i < count; i++) {
                const xPos = (-length / 2) + (step * (i + 1));
                explodedParts.push({
                    ...part,
                    id: `${part.id}-${i}`,
                    originalId: part.id,
                    quantity: 1,
                    position: { x: xPos, y: pHei / 2, z: 0 }
                });
            }
        }
        // Pattern 3: DISTRIBUTE Y (Shelves)
        else if (qty > 1 && part.anchorPattern === 'distribute-y') {
            const count = qty;
            // Available space between bottom and top (approx)
            const startY = 10;
            const endY = height - 10;
            const space = endY - startY;
            const step = space / (count + 1);

            for (let i = 0; i < count; i++) {
                const yPos = startY + (step * (i + 1));
                explodedParts.push({
                    ...part,
                    id: `${part.id}-${i}`,
                    originalId: part.id,
                    quantity: 1,
                    position: { x: 0, y: yPos, z: 0 }
                });
            }
        }
        // Pattern 3b: DISTRIBUTE Z (Bed Slats)
        else if (qty > 1 && part.anchorPattern === 'distribute-z') {
            const count = qty;
            // Available space along depth (Z)
            // Bed length is dimensions.width (if swapped) or dimensions.length?
            // Usually dimensions.width (Z).
            // Let's assume generic Z length is `width`.
            const zLen = dimensions.width;

            // Distribute with padding
            const startZ = (-zLen / 2) + 20;
            const endZ = (zLen / 2) - 20;
            const step = (endZ - startZ) / (count - 1);

            for (let i = 0; i < count; i++) {
                const zPos = startZ + (step * i);
                explodedParts.push({
                    ...part,
                    id: `${part.id}-${i}`,
                    originalId: part.id,
                    quantity: 1,
                    position: { x: 0, y: part.dimensions.height / 2, z: zPos }
                });
            }
        }
        // Pattern 3c: VERTICAL PARTITION SYSTEM
        else if (part.anchorPattern === 'vertical-partition') {
            // 1. Gather Y-levels from already processed parts
            const yLevels = [];

            // Add Bottom Panel Top Face
            const bottom = explodedParts.find(p => p.name.includes('Bottom Panel'));
            if (bottom) yLevels.push(bottom.position.y + (safeNum(bottom.dimensions.height) / 2));
            else yLevels.push(0); // Fallback floor

            // Add Top Panel Bottom Face
            const top = explodedParts.find(p => p.name.includes('Top Panel'));
            if (top) yLevels.push(top.position.y - (safeNum(top.dimensions.height) / 2));
            else yLevels.push(safeNum(dimensions.height)); // Fallback top

            // Add Shelves (Center Y) -> Convert to Top/Bottom faces?
            // Shelves are thin (2cm). Let's assume we stack ON TOP of them?
            // Actually, we want partitions BETWEEN them.
            // Shelf Y is center. Face is Y +/- Th/2.
            const shelves = explodedParts.filter(p => p.name.includes('Shelf'));
            shelves.forEach(s => {
                const th = safeNum(s.dimensions.height);
                yLevels.push(s.position.y - (th / 2)); // Bottom Face
                yLevels.push(s.position.y + (th / 2)); // Top Face
            });

            // Sort levels
            yLevels.sort((a, b) => a - b);

            // Filter out small gaps (thickness of shelves themselves)
            // Valid gap > 5cm
            const validIntervals = [];
            for (let i = 0; i < yLevels.length - 1; i++) {
                const diff = yLevels[i + 1] - yLevels[i];
                if (diff > 5) {
                    validIntervals.push({ start: yLevels[i], end: yLevels[i + 1], height: diff });
                }
            }

            // 2. Place partitions
            const strategy = part.meta?.strategy || 'random-shelves';

            validIntervals.forEach((interval, intervalIdx) => {
                const totalIntervals = validIntervals.length;

                // 1. Identify active modifier for this shelf
                const modifiers = part.meta?.modifiers || [];
                let mod = null;

                // VISUAL INDEXING: 0 = Top, Max = Bottom
                // internal 'intervalIdx' is 0=Bottom, Max=Top (due to yLevels numeric sort)
                // So: visualIdx = (totalIntervals - 1) - intervalIdx
                const visualIdx = (totalIntervals - 1) - intervalIdx;

                if (modifiers.length > 0) {
                    // 1. Exact Index (User uses 1-based indexing: 1 = Top)
                    mod = modifiers.find(m => m.target === String(visualIdx + 1));

                    // 2. Keywords (loose)
                    if (!mod) {
                        const targetLower = (m) => m.target.toLowerCase();

                        // Top = Visual 0
                        if (visualIdx === 0) {
                            mod = modifiers.find(m => targetLower(m).includes('top'));
                        }
                        // Bottom = Visual Max
                        else if (visualIdx === totalIntervals - 1) {
                            mod = modifiers.find(m => targetLower(m).includes('bottom'));
                        }
                        // Middle / Rest
                        else {
                            mod = modifiers.find(m => targetLower(m).includes('middle'));
                        }
                    }

                    // 3. Fallback Rest (applies to anything not matched above)
                    if (!mod) {
                        mod = modifiers.find(m => m.target.toLowerCase().includes('rest'));
                    }
                }

                // 2. Determine Placement (Strategy OR Modifier Force)
                let shouldPlace = false;
                if (mod) {
                    shouldPlace = true; // Rule forces placement
                } else {
                    // Fallback to global strategy
                    if (strategy === 'all-shelves') shouldPlace = true;
                    else if (strategy === 'random-shelves') shouldPlace = Math.random() > 0.3;
                }

                if (shouldPlace) {
                    let ratioStr = mod?.ratio || part.meta?.ratio;
                    let count = (mod?.count !== undefined) ? mod.count : (part.meta?.count || 1);

                    // Stop if count explicitly 0
                    if (count === 0) return;

                    // Infer count from ratio if explicit count not provided but ratio has >2 segments
                    // Ex: "33-33-33" -> 3 segments -> 2 cuts
                    // Only do this if we didn't get an explicit count override from mod
                    let ratioSegments = [];
                    if (ratioStr && ratioStr !== 'random' && ratioStr !== 'center' && ratioStr.includes('-')) {
                        const parts = ratioStr.split('-').map(p => parseFloat(p)).filter(n => !isNaN(n));
                        if (parts.length > 2) {
                            // Use inferred count unless mod explicitly set it
                            if (!mod || mod.count === undefined) {
                                count = parts.length - 1;
                            }
                        }
                        ratioSegments = parts;
                    }

                    // Calculate Cut Positions (0.0 to 1.0 relative to width)
                    let cuts = [];

                    // STRATEGY: RATIO
                    if (ratioSegments.length > 0) {
                        const total = ratioSegments.reduce((a, b) => a + b, 0);
                        let accum = 0;
                        // For N segments, we have N-1 cuts between them
                        for (let i = 0; i < ratioSegments.length - 1; i++) {
                            accum += ratioSegments[i];
                            cuts.push(accum / total);
                        }
                        // Simplified
                        count = cuts.length;
                    }
                    // STRATEGY: RANDOM (Explicit 'random' or default random strategy if no override)
                    else if (ratioStr === 'random' || (strategy === 'random-shelves' && !ratioStr)) {
                        for (let i = 0; i < count; i++) {
                            // Random pos between 20% and 80%
                            cuts.push(0.2 + (Math.random() * 0.6));
                        }
                    }
                    // STRATEGY: EQUAL (Default catch-all)
                    else {
                        for (let i = 0; i < count; i++) {
                            cuts.push((i + 1) / (count + 1));
                        }
                        // Handle simple "60-40" type ratio for single partition override if count==1
                        if (count === 1 && ratioStr && ratioStr.includes('-') && ratioSegments.length === 2) {
                            const total = ratioSegments[0] + ratioSegments[1];
                            cuts = [ratioSegments[0] / total];
                        }
                    }
                    // Generate Parts at Cuts
                    cuts.forEach((cutPct, cutIdx) => {
                        const xOff = (-dimensions.length / 2) + (cutPct * dimensions.length);
                        explodedParts.push({
                            ...part,
                            id: `${part.id}-${intervalIdx}-${cutIdx}`,
                            originalId: part.id,
                            quantity: 1,
                            dimensions: { ...part.dimensions, height: interval.height },
                            position: { x: xOff, y: interval.start + (interval.height / 2), z: 0 }
                        });
                    });
                }
            });
        }
        // Pattern 4: SIDES (Bookshelf Sides)
        else if (qty > 1 && part.anchorPattern === 'sides') {
            const pThick = safeNum(part.dimensions.length); // Use Length because we swapped it (X-axis is thickness) or default
            const xOff = (length / 2) - (pThick / 2);
            // Left
            explodedParts.push({
                ...part,
                id: `${part.id}-L`,
                originalId: part.id,
                quantity: 1,
                position: { x: -xOff, y: height / 2, z: 0 }
            });
            // Right
            if (qty > 1) {
                explodedParts.push({
                    ...part,
                    id: `${part.id}-R`,
                    originalId: part.id,
                    quantity: 1,
                    position: { x: xOff, y: height / 2, z: 0 }
                });
            }
        }
        // Pattern 5: APRON
        else if (part.anchorPattern === 'apron') {
            const pLen = safeNum(part.dimensions.length);
            const pHei = safeNum(part.dimensions.height);
            // We expect pLen to be shortened (Length - 2*Leg).
            // But checking 'name' is safer than length diffs.

            // Find leg size dynamically
            const legPart = parts.find(p => p.name.toLowerCase().includes('leg'));
            const legSize = legPart ? safeNum(legPart.dimensions.width) : 5;

            // Find top thickness dynamically
            const topPart = parts.find(p => p.name.toLowerCase().includes('top'));
            const topThickness = topPart ? safeNum(topPart.dimensions.height) : 3;

            const apronY = dimensions.height - topThickness - (pHei / 2);

            if (part.name.includes('Long')) {
                // Runs along X. Position Z away from center.
                // Align with center of legs: Z = +/- (Width/2 - LegSize/2)
                const zOffset = (dimensions.width / 2) - (legSize / 2);
                explodedParts.push({ ...part, id: part.id + '-1', quantity: 1, position: { x: 0, y: apronY, z: zOffset }, rotation: { x: 0, y: 0, z: 0 } });
                explodedParts.push({ ...part, id: part.id + '-2', quantity: 1, position: { x: 0, y: apronY, z: -zOffset }, rotation: { x: 0, y: 0, z: 0 } });
            }
            else if (part.name.includes('Short')) {
                // Runs along Z. Position X away from center.
                // Align with center of legs: X = +/- (Length/2 - LegSize/2)
                const xOffset = (dimensions.length / 2) - (legSize / 2);
                // Rotation 90 degrees around Y usually for Z-aligned parts?
                // Wait, if dimensions.length is Z-length? No, dimensions.length is usually X.
                // If I rotate 90, X becomes Z.
                // So "Length" (X-dim) becomes Length along Z.
                explodedParts.push({ ...part, id: part.id + '-1', quantity: 1, position: { x: xOffset, y: apronY, z: 0 }, rotation: { x: 0, y: Math.PI / 2, z: 0 } });
                explodedParts.push({ ...part, id: part.id + '-2', quantity: 1, position: { x: -xOffset, y: apronY, z: 0 }, rotation: { x: 0, y: Math.PI / 2, z: 0 } });
            }
            else {
                // Fallback
                explodedParts.push(part);
            }
        }

        // SPECIAL PARTS (Intercept before generic)
        else if (part.name.toLowerCase().includes('chair-seat') || part.name === 'Seat') {
            const seatLevel = dimensions.height * 0.5;
            explodedParts.push({
                ...part,
                quantity: 1,
                position: { x: 0, y: seatLevel + (safeNum(part.dimensions.height) / 2), z: 0 }
            });
        }
        else if (part.name.toLowerCase().includes('backrest')) {
            const seatLevel = dimensions.height * 0.5;
            const backHeight = safeNum(part.dimensions.height);
            // Sit on top of the seat. seatLevel is center. We assume thin seat, so just above center.
            explodedParts.push({
                ...part,
                quantity: 1,
                // Flush with rear edge: -Depth/2 + Thickness/2
                position: { x: 0, y: seatLevel + (backHeight / 2) + 2, z: -(dimensions.width / 2) + (safeNum(part.dimensions.width) / 2) }
            });
        }
        else if (part.name.toLowerCase().includes('arm rest top')) {
            const thick = safeNum(part.dimensions.length);
            const height = safeNum(part.dimensions.height);
            const armLen = safeNum(part.dimensions.width); // Z-Length

            // X-Offset: Push to edges
            const xOff = (dimensions.width / 2) - (thick / 2);

            // Z-Offset: Shift forward to butt against backrest
            // Gap = ChairDepth - ArmLength (which is BackThickness)
            // Shift = Gap / 2
            const zOff = (dimensions.width - armLen) / 2;

            const seatLevel = dimensions.height * 0.5;
            const supportHeight = 22; // Matches designGenerator

            // Position Top Bar
            explodedParts.push({
                ...part,
                id: `${part.id}-L`,
                originalId: part.id,
                quantity: 1,
                position: { x: -xOff, y: seatLevel + supportHeight + (height / 2), z: zOff }
            });
            explodedParts.push({
                ...part,
                id: `${part.id}-R`,
                originalId: part.id,
                quantity: 1,
                position: { x: xOff, y: seatLevel + supportHeight + (height / 2), z: zOff }
            });
        }
        else if (part.name.toLowerCase().includes('arm support')) {
            const thick = safeNum(part.dimensions.length);
            const depth = safeNum(part.dimensions.width);
            const height = safeNum(part.dimensions.height);

            const xOff = (dimensions.width / 2) - (thick / 2);
            const seatLevel = dimensions.height * 0.5;

            // Z-Offset: Place at the FRONT edge.
            // Dimensions.width is the Chair Depth (45).
            const zOff = (dimensions.width / 2) - (depth / 2);

            // Position Left Support
            explodedParts.push({
                ...part,
                id: `${part.id}-L`,
                originalId: part.id,
                quantity: 1,
                position: { x: -xOff, y: seatLevel + (height / 2), z: zOff }
            });
            // Position Right Support
            explodedParts.push({
                ...part,
                id: `${part.id}-R`,
                originalId: part.id,
                quantity: 1,
                position: { x: xOff, y: seatLevel + (height / 2), z: zOff }
            });
        }
        // SPECIAL: Bookshelf Back Panel
        else if (part.name.toLowerCase().includes('back panel')) {
            const pThick = safeNum(part.dimensions.width); // Z-dim
            explodedParts.push({
                ...part,
                quantity: 1,
                // Flush Rear
                position: { x: 0, y: dimensions.height / 2, z: -(dimensions.width / 2) + (pThick / 2) }
            });
        }
        // SPECIAL: Headboard
        else if (part.name.toLowerCase().includes('headboard')) {
            const pThick = safeNum(part.dimensions.width);
            explodedParts.push({
                ...part,
                quantity: 1,
                // Flush Rear
                // Headboard height is usually from floor. Center Y = Height/2.
                position: { x: 0, y: safeNum(part.dimensions.height) / 2, z: -(dimensions.width / 2) + (pThick / 2) }
            });
        }
        // SPECIAL: Footboard
        else if (part.name.toLowerCase().includes('footboard')) {
            const pThick = safeNum(part.dimensions.width);
            explodedParts.push({
                ...part,
                quantity: 1,
                // Flush Front
                position: { x: 0, y: safeNum(part.dimensions.height) / 2, z: (dimensions.width / 2) - (pThick / 2) }
            });
        }
        // SPECIAL: Desk Drawer
        else if (part.name.toLowerCase().includes('drawer')) {
            const drawerWidth = safeNum(part.dimensions.length); // X-Width
            const drawerHeight = safeNum(part.dimensions.height); // Y-Height

            // Position under the top
            // Top Thickness is hard to guess here without context, assume 3
            const topThick = 3;
            const yPos = dimensions.height - topThick - (drawerHeight / 2) - 1; // 1cm gap

            if (qty === 2) {
                // Distribute Left/Right
                const offset = dimensions.length / 4;
                explodedParts.push({ ...part, id: part.id + '-1', quantity: 1, position: { x: -offset, y: yPos, z: 0 } });
                explodedParts.push({ ...part, id: part.id + '-2', quantity: 1, position: { x: offset, y: yPos, z: 0 } });
            } else {
                explodedParts.push({ ...part, quantity: 1, position: { x: 0, y: yPos, z: 0 } });
            }
        }
        // SPECIAL: Bookshelf Top Panel
        else if (part.name.toLowerCase().includes('top panel')) {
            const pThick = safeNum(part.dimensions.height);
            explodedParts.push({
                ...part,
                quantity: 1,
                // Top (Flush with top edge)
                position: { x: 0, y: dimensions.height - (pThick / 2), z: 0 }
            });
        }
        // SPECIAL: Bookshelf Bottom Panel
        else if (part.name.toLowerCase().includes('bottom panel')) {
            const pThick = safeNum(part.dimensions.height);
            explodedParts.push({
                ...part,
                quantity: 1,
                // Bottom (Flush with bottom edge / floor)
                position: { x: 0, y: pThick / 2, z: 0 }
            });
        }
        // DEFAULT FALLBACK
        else {
            if (qty > 1) {
                // If we have quantity but no pattern, just explode them in place (better than missing)
                for (let i = 0; i < qty; i++) {
                    explodedParts.push({
                        ...part,
                        id: `${part.id}-${i}`,
                        originalId: part.id,
                        quantity: 1,
                        position: part.position || { x: 0, y: safeNum(part.dimensions.height) / 2, z: 0 }
                    });
                }
            } else {
                // Single part
                if (!part.position) {
                    part.position = { x: 0, y: safeNum(part.dimensions.height) / 2, z: 0 };
                }
                explodedParts.push(part);
            }
        }
    });



    return explodedParts;
}

/**
 * UNIFIED ENGINEERING PIPELINE
 * Centralizes all structural calculations to ensure consistency and prevent data mismatches.
 * Now Async to support future API integrations and non-blocking calculations.
 * @param {object} config
 * @param {string} config.furnitureType
 * @param {object} config.dimensions {length, width, height}
 * @param {string} config.material
 * @returns {Promise<object>} { legSize, topThickness, additions, loadAnalysis, structuralReport }
 */
export async function generateEngineeringSpecs(config) {
    const { furnitureType, dimensions, material, projectedLoad } = config;

    // Simulate async work (minimal delay to unblock event loop)
    await new Promise(resolve => setTimeout(resolve, 0));

    // 1. Load Analysis
    // Ensure we get a proper object even if internal function fails
    let loadAnalysis = calculateLoadRequirements(furnitureType);
    if (typeof loadAnalysis === 'number') {
        // Fallback for stale code state
        loadAnalysis = {
            totalLoad: loadAnalysis,
            expectedLoad: { distributed: loadAnalysis, point: loadAnalysis * 0.8 },
            selfWeight: 15
        };
    }

    // Override with user requested load if present
    if (projectedLoad) {
        // Handle potential string input from AI (e.g., "700" or "700kg")
        const targetLoad = parseInt(String(projectedLoad).replace(/[^0-9]/g, ''), 10);

        if (!isNaN(targetLoad) && targetLoad > 0) {
            loadAnalysis.totalLoad = targetLoad;
            loadAnalysis.expectedLoad = {
                distributed: targetLoad,
                point: targetLoad * 0.8
            };
        }
    }

    // 2. Structural Additions
    const additions = determineStructuralAdditions(furnitureType, dimensions);

    // 3. Leg Sizing
    // Calculate number of legs (default 4 + any extra from additions)
    const extraLegs = additions
        .filter(a => a.type === 'side-leg')
        .reduce((sum, a) => sum + (a.quantity || 1), 0);
    const numLegs = 4 + extraLegs;

    // Get leg dimensions (handle both number and object returns for safety)
    const legCalc = calculateLegDimensions(loadAnalysis.totalLoad, dimensions.height, material, numLegs);
    let legSize = (typeof legCalc === 'object' && legCalc.square) ? legCalc.square : (legCalc || 3.5);

    // BOOST: Without center leg, force thicker legs for aesthetics and stability
    if (dimensions.length > 150) {
        legSize *= 1.25;
    }

    // 4. Top Thickness (Deflection)
    let topThickness = 2.5; // default base

    // Calculate generic distributed load if not already set
    const distLoad = loadAnalysis.expectedLoad?.distributed || 50;

    // Determine span based on type
    let span = dimensions.length;
    if (['chair', 'stool'].includes(furnitureType)) {
        span = Math.max(dimensions.length, dimensions.width);
    }

    // Heuristic Thickness Calculation
    if (distLoad > 200) topThickness = 4;
    if (distLoad > 400) topThickness = 5;
    if (distLoad > 800) topThickness = 6;

    // Deflection Check (Refined)
    // Only check deflection for significant spans or loads
    if (span > 50 || distLoad > 100) {
        const deflection = calculateDeflection(span, dimensions.width, topThickness, material, distLoad);

        // Handle object vs number return
        if (deflection && typeof deflection === 'object' && !deflection.isAcceptable) {
            topThickness = deflection.recommendedThickness || (topThickness * 1.5);
        } else if (typeof deflection === 'number' && deflection > 0.5) {
            topThickness = 4;
        }
    }

    // Cap max thickness to avoid absurdity
    topThickness = Math.min(topThickness, 15);

    return {
        legSize,
        topThickness,
        additions,
        loadAnalysis,
        // Passthrough props
        shelves: config.shelves,
        partitionStrategy: config.partitionStrategy,
        partitionRatio: config.partitionRatio, // 60-40 split etc.
        partitionCount: config.partitionCount, // Explicit count
        shelfModifiers: config.shelfModifiers || [], // Per-shelf overrides
        // Helper metadata
        engineeringNotes: [
            `Designed for ${loadAnalysis.totalLoad}kg load`,
            `Leg profile: ${legSize}cm`,
            `Top thickness: ${topThickness}cm`
        ]
    };
}
