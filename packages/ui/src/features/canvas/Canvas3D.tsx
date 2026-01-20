/**
 * Canvas3D Component
 *
 * Main 3D visualization canvas using Three.js and React Three Fiber
 */

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, FlyControls, Grid, PerspectiveCamera } from '@react-three/drei';
import { useCanvasStore } from './store';
import { GraphRenderer } from './components';
import type { Graph } from '../../shared/types';

interface Canvas3DProps {
  className?: string;
  graph?: Graph;
}

/**
 * Camera controller
 * Syncs Three.js camera with Zustand store
 */
function CameraController({ graph }: { graph?: Graph }) {
  const camera = useCanvasStore((state) => state.camera);
  const setCamera = useCanvasStore((state) => state.setCamera);
  const setCameraTarget = useCanvasStore((state) => state.setCameraTarget);
  const controlMode = useCanvasStore((state) => state.controlMode);

  // Auto-fit camera when graph loads
  React.useEffect(() => {
    if (!graph || !graph.nodes || graph.nodes.length === 0) return;

    // Calculate bounding box of all nodes
    const positions = graph.nodes
      .filter(n => n.position)
      .map(n => n.position!);

    if (positions.length === 0) return;

    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    const zs = positions.map(p => p.z);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    // Calculate center of bounding box
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    // Calculate size of bounding box
    const sizeX = maxX - minX;
    const sizeY = maxY - minY;
    const sizeZ = maxZ - minZ;
    const maxSize = Math.max(sizeX, sizeY, sizeZ);

    // Position camera to see all nodes
    // Camera distance = maxSize * 1.5 to give some padding
    const distance = Math.max(maxSize * 1.5, 10);

    console.log('[Canvas3D] Auto-fitting camera to nodes:', {
      center: { x: centerX, y: centerY, z: centerZ },
      size: { x: sizeX, y: sizeY, z: sizeZ },
      distance
    });

    // Set camera target to center of nodes
    setCameraTarget({ x: centerX, y: centerY, z: centerZ });

    // Set camera position above and in front of center
    setCamera({
      position: {
        x: centerX,
        y: centerY + distance * 0.5,
        z: centerZ + distance
      },
      target: { x: centerX, y: centerY, z: centerZ }
    });
  }, [graph, setCamera, setCameraTarget]);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[camera.position.x, camera.position.y, camera.position.z]}
        fov={75}
        near={0.1}
        far={10000}
      />
      {controlMode === 'orbit' ? (
        <OrbitControls
          target={[camera.target.x, camera.target.y, camera.target.z]}
          enableDamping
          dampingFactor={0.05}
          minDistance={0.1}
          maxDistance={5000}
        />
      ) : (
        <FlyControls
          movementSpeed={10}
          rollSpeed={0.5}
          dragToLook={false}
        />
      )}
    </>
  );
}

/**
 * Scene content
 */
function Scene({ graph }: { graph?: Graph }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Grid helper */}
      <Grid
        args={[50, 50]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#374151"
        fadeDistance={100}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Graph rendering */}
      {graph && <GraphRenderer graph={graph} />}
    </>
  );
}

/**
 * Canvas3D component
 */
export function Canvas3D({ className = '', graph }: Canvas3DProps) {
  const toggleControlMode = useCanvasStore((state) => state.toggleControlMode);

  // Keyboard shortcut to toggle control mode
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Toggle with 'C' key (ignore if typing in input fields)
      if (event.key === 'c' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
        event.preventDefault();
        toggleControlMode();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleControlMode]);

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
        }}
        style={{ background: '#111827' }}
      >
        <CameraController graph={graph} />
        {graph !== undefined ? <Scene graph={graph} /> : <Scene />}
      </Canvas>
    </div>
  );
}
