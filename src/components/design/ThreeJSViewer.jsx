import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stage, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const FurniturePart = ({ part }) => {
    const meshRef = useRef();

    const { position, dimensions, material, rotation, color } = part;

    // Convert position object to array [x, y, z] if needed, but R3F accepts object {x,y,z} too usually.
    // Our generator outputs {x,y,z} which is compatible with position prop if valid.
    // Dimensions for BoxGeometry are width, height, depth.

    return (
        <mesh
            position={[position.x, position.y, position.z]}
            rotation={[rotation.x, rotation.y, rotation.z]}
            castShadow
            receiveShadow
        >
            {/* length=x, height=y, width=z mapping */}
            <boxGeometry args={[dimensions.length || dimensions.width, dimensions.height, dimensions.depth || dimensions.width || 1]} />
            <meshStandardMaterial
                color={material.color}
                roughness={material.roughness}
                metalness={material.metalness}
                transparent={material.transparent}
                opacity={material.opacity}
            />
        </mesh>
    );
};

const AnchorPoint = ({ position, label }) => (
    <group position={[position.x, position.y, position.z]}>
        <mesh>
            <sphereGeometry args={[2, 16, 16]} />
            <meshBasicMaterial color="red" depthTest={false} transparent opacity={0.8} />
        </mesh>
        {/* Simple visual line to origin or ground if needed, but sphere is enough for now */}
    </group>
);

// Auto-Fit Camera Component
// Calculates the bounding box and adjusts camera distance to fit the object
// Compensates for narrow aspect ratios (Mobile Portrait)
function AutoFitCamera({ geometry3D }) {
    const { camera, size } = useThree();
    const controlsRef = React.useRef();

    React.useEffect(() => {
        if (!geometry3D || !geometry3D.parts) return;

        // 1. Calculate Bounding Box
        const box = new THREE.Box3();
        geometry3D.parts.forEach(part => {
            // Create temporary mesh to measure (since we don't have the refs easily accessible)
            // Or simpler: Math based on position/dimensions
            const halfL = (part.dimensions.length || part.dimensions.width) / 2;
            const halfH = part.dimensions.height / 2;
            const halfW = (part.dimensions.depth || part.dimensions.width || 1) / 2;

            const center = new THREE.Vector3(part.position.x, part.position.y, part.position.z);
            const min = center.clone().sub(new THREE.Vector3(halfL, halfH, halfW));
            const max = center.clone().add(new THREE.Vector3(halfL, halfH, halfW));

            box.expandByPoint(min);
            box.expandByPoint(max);
        });

        const center = new THREE.Vector3();
        box.getCenter(center);
        const sizeVector = new THREE.Vector3();
        box.getSize(sizeVector);

        // 2. Determine Max Dimension (Fit Target)
        // We want to fit the largest dimension
        const maxDim = Math.max(sizeVector.x, sizeVector.y, sizeVector.z);

        // 3. Calculate Required Distance
        const fov = camera.fov * (Math.PI / 180);

        // Distance needed to fit the height (Vertical FOV is fixed)
        const distV = sizeVector.y / (2 * Math.tan(fov / 2));

        // Distance needed to fit the width/depth (Horizontal FOV depends on Aspect)
        // tan(hFOV/2) = tan(vFOV/2) * aspect
        // distH = size.x / (2 * tan(hFOV/2))
        const aspect = size.width / size.height;
        const distH = Math.max(sizeVector.x, sizeVector.z) / (2 * Math.tan(fov / 2) * aspect);

        // 4. Choose the larger distance to ensure everything fits
        let cameraZ = Math.max(distV, distH);

        // Add padding (reduced to 1.2x for better mobile visibility)
        cameraZ *= 1.2;

        // Clamp minimum distance to avoid being inside the object
        cameraZ = Math.max(cameraZ, maxDim * 1.2);

        // 5. Update Camera
        camera.position.set(cameraZ, cameraZ * 0.6, cameraZ); // Angle looking down slightly
        camera.lookAt(center);
        camera.updateProjectionMatrix();

    }, [geometry3D, camera, size]);

    return null;
}

export function ThreeJSViewer({ geometry3D }) {
    const [debugMode, setDebugMode] = React.useState(false);

    if (!geometry3D || !geometry3D.parts) return null;

    return (
        <div
            className="w-full h-[300px] sm:h-[400px] bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden shadow-inner border border-neutral-200 dark:border-neutral-700 relative touch-pan-y min-w-0"
            style={{ maxWidth: '100%' }}
        >
            <Canvas shadows={false} dpr={[1, 2]}>
                {/* Manual Fallback: Stage/Shadows causing white screen crash on some GPUs with large scales */}

                {/* 1. Simple Lighting */}
                <ambientLight intensity={0.8} />
                <directionalLight position={[100, 200, 100]} intensity={1.5} />
                <directionalLight position={[-100, 100, -50]} intensity={0.5} />

                {/* 2. Manual Camera - centered on typical object size (~150cm) */}
                <PerspectiveCamera makeDefault position={[250, 200, 250]} fov={45} />
                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} />
                <AutoFitCamera geometry3D={geometry3D} />

                {/* 3. The Object */}
                <group position={[0, -40, 0]}> {/* Shift down roughly half height to center visual */}
                    {geometry3D.parts.map((part) => (
                        <React.Fragment key={part.id}>
                            <FurniturePart part={part} />
                            {debugMode && (
                                <AnchorPoint
                                    position={part.position}
                                    label={part.name}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </group>

                {/* 4. Simple Grid instead of complex shadows */}
                <gridHelper args={[500, 50, '#e5e5e5', '#f0f0f0']} position={[0, -75, 0]} />

                {debugMode && <axesHelper args={[100]} position={[0, -75, 0]} />}
            </Canvas>

            {/* Overlay UI */}
            <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-none">
                <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-neutral-600 dark:text-neutral-300">
                    Drag to Rotate • Scroll to Zoom
                </div>
            </div>

            <div className="absolute top-4 right-4 pointer-events-auto">
                <button
                    onClick={() => setDebugMode(!debugMode)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${debugMode
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                        : 'bg-white/50 text-neutral-500 hover:bg-white'
                        }`}
                >
                    {debugMode ? 'Hide Anchors' : 'Show Anchors'}
                </button>
            </div>
        </div>
    );
}
