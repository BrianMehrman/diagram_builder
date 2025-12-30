/**
 * Canvas3D Component
 *
 * Main 3D visualization canvas using Three.js and React Three Fiber
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
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
function CameraController() {
  const camera = useCanvasStore((state) => state.camera);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[camera.position.x, camera.position.y, camera.position.z]}
        fov={75}
        near={0.1}
        far={1000}
      />
      <OrbitControls
        target={[camera.target.x, camera.target.y, camera.target.z]}
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2}
      />
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
          <CameraController />
        {graph !== undefined ? <Scene graph={graph} /> : <Scene />}
      </Canvas>
    </div>
  );
}
