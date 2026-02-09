/**
 * Canvas3D Component
 *
 * Main 3D visualization canvas using Three.js and React Three Fiber
 */

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, FlyControls, Grid, PerspectiveCamera } from '@react-three/drei';
import { useCanvasStore } from './store';
import { ViewModeRenderer } from './views';
import { TransitionOrchestrator } from './transitions';
import { DependencyLegend } from './components/DependencyLegend';
import type { Graph } from '../../shared/types';

interface Canvas3DProps {
  className?: string;
  graph?: Graph;
}

/**
 * Camera controller
 * Syncs Three.js camera with Zustand store
 */
function CameraController({ graph }: { graph?: Graph | undefined }) {
  const camera = useCanvasStore((state) => state.camera);
  const setCamera = useCanvasStore((state) => state.setCamera);
  const setCameraTarget = useCanvasStore((state) => state.setCameraTarget);
  const setCameraPosition = useCanvasStore((state) => state.setCameraPosition);
  const controlMode = useCanvasStore((state) => state.controlMode);
  const layoutPositions = useCanvasStore((state) => state.layoutPositions);

  // Auto-fit camera when layout positions are computed
  React.useEffect(() => {
    // Prefer layout positions (computed by CityView/BuildingView)
    const positions = layoutPositions.size > 0
      ? Array.from(layoutPositions.values())
      : graph?.nodes?.filter(n => n.position).map(n => n.position!) ?? [];

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

    // For radial layouts, use the diagonal of the XZ plane as the spread
    const xzSpread = Math.sqrt(sizeX * sizeX + sizeZ * sizeZ);
    const maxSize = Math.max(xzSpread, sizeY);

    // Position camera to see all nodes with padding
    const distance = Math.max(maxSize * 0.85, 10);

    // Set camera target to center of nodes
    setCameraTarget({ x: centerX, y: centerY, z: centerZ });

    // Set camera position above and angled for overview
    setCamera({
      position: {
        x: centerX,
        y: centerY + distance * 0.6,
        z: centerZ + distance * 0.5
      },
      target: { x: centerX, y: centerY, z: centerZ }
    });
  }, [layoutPositions, graph, setCamera, setCameraTarget]);

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
          onChange={(e) => {
            if (e?.target?.object) {
              const cam = e.target.object;
              setCameraPosition({ x: cam.position.x, y: cam.position.y, z: cam.position.z });
            }
          }}
        />
      ) : (
        <FlyControls
          movementSpeed={50}
          rollSpeed={0.3}
          dragToLook={true}
          autoForward={false}
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

      {/* View mode rendering (city/building/cell) */}
      {graph && <ViewModeRenderer graph={graph} />}
      <TransitionOrchestrator />
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
    <div className={`w-full h-full relative ${className}`}>
      <DependencyLegend />
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
