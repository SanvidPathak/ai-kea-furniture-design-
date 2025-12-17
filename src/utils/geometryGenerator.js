/**
 * AI-KEA Geometry Generator
 * Converts abstract furniture design parts into Three.js compatible geometry definitions.
 * Handles material visual properties and scene composition.
 * NOTE: Positioning and Scaling is now handled upstream by furnitureEngineering.js
 */

/**
 * Convert furniture design parts to Three.js geometry definitions
 * @param {object} design - Complete design object
 * @returns {object} Three.js-compatible geometry data
 */
export function generateThreeJSGeometry(design) {
    const { furnitureType, parts, dimensions, material, materialColor } = design;

    // 1. Map to 3D Geometry
    // Parts are already exploded and positioned by furnitureEngineering.applyAnchorPoints
    const geometryParts = parts.map((part, index) => {
        // Use explicit position from engineering engine
        // Fallback to center if missing (shouldn't happen with new engine)
        const position = part.position || { x: 0, y: safeNum(dimensions.height) / 2, z: 0 };

        // Use explicit rotation if provided (e.g. for Aprons), else calculate default
        const rotation = part.rotation || calculatePartRotation(part, furnitureType);

        const geometry = determineGeometryType(part);

        return {
            id: part.id || `part-${index}`,
            name: part.name,
            type: geometry.type,
            position,
            rotation,
            dimensions: {
                width: safeNum(part.dimensions.length),  // X axis = Length
                height: safeNum(part.dimensions.height), // Y axis = Height
                depth: safeNum(part.dimensions.width)    // Z axis = Width (Depth)
            },
            material: {
                color: part.color || materialColor,
                roughness: getMaterialRoughness(material),
                metalness: getMaterialMetalness(material),
                opacity: material === 'glass' ? 0.3 : 1,
                transparent: material === 'glass'
            },
            castShadow: true,
            receiveShadow: true
        };
    });

    // Calculate bounding box for camera setup
    const bounds = {
        width: dimensions.length,
        height: dimensions.height,
        depth: dimensions.width
    };

    // Calculate optimal camera position (ISO view)
    const maxDimension = Math.max(bounds.width, bounds.height, bounds.depth);
    const cameraDistance = maxDimension * 2.0;

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
                y: bounds.height / 2, // Look at center height
                z: 0
            },
            fov: 50
        },
        lighting: {
            ambient: { color: '#ffffff', intensity: 0.5 },
            directional: [
                { position: { x: 500, y: 1000, z: 750 }, color: '#ffffff', intensity: 0.8 },
                { position: { x: -500, y: 1000, z: -750 }, color: '#ffffff', intensity: 0.4 }
            ]
        },
        background: '#f5f1e8'
    };
}

/**
 * Helper to ensure value is a finite number
 */
function safeNum(val, fallback = 0) {
    return Number.isFinite(val) ? val : fallback;
}

/**
 * Determine rotation for part
 * (Legacy fallback: Engineering engine should ideally provide this)
 */
function calculatePartRotation(part, furnitureType) {
    // Most parts are axis-aligned

    // Rotate aprons on the short side of a table
    // (Note: applyAnchorPoints now handles this, so this might be redundant but safe to keep)
    if (furnitureType === 'table' || furnitureType === 'desk') {
        if (part.name.toLowerCase().includes('apron')) {
            if (part.name.toLowerCase().includes('short')) {
                return { x: 0, y: Math.PI / 2, z: 0 };
            }
        }
    }

    return { x: 0, y: 0, z: 0 };
}

/**
 * Determine Three.js geometry type based on part shape
 */
function determineGeometryType(part) {
    // Future: support cylinder for round legs
    if (part.name.toLowerCase().includes('leg') && part.dimensions.square === undefined && part.dimensions.round) {
        return { type: 'box' };
    }
    return { type: 'box' };
}

/**
 * Get material roughness value for Three.js
 */
function getMaterialRoughness(material) {
    const roughness = {
        wood: 0.8,
        metal: 0.3,
        plastic: 0.5,
        glass: 0.0
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
        plastic: 0.1,
        glass: 0.1
    };
    return metalness[material] || 0;
}
