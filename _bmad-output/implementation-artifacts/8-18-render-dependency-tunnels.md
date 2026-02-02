# Story 8-18: Render Dependency Tunnels with Visual Styling

**Status:** not-started

---

## Story

**ID:** 8-18
**Key:** 8-18-render-dependency-tunnels
**Title:** Enhance Dependency Tunnel Rendering with Visual Styling
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 5 (Visibility Modes)
**Priority:** LOW - Visual polish

**As a** developer viewing dependencies,
**I want** dependency tunnels to have clear visual styling,
**So that** I can quickly understand the dependency relationships in my codebase.

**Description:**

Enhance the basic dependency tunnel rendering with improved visual styling: color coding by package type, animated flow direction, tunnel junction points, and legend for interpretation.

**Context:**

From UX 3D Layout Vision:
- Underground tunnels like a subway system
- Tunnel thickness represents import frequency
- Visual differentiation between dependency types
- Future: navigable tunnels

This story enhances Story 8-17's basic tunnels with polish.

---

## Acceptance Criteria

- **AC-1:** Tunnels color coded by dependency type
  - Production dependencies: blue
  - Dev dependencies: purple
  - Peer dependencies: green
  - Type-only imports: gray

- **AC-2:** Animated flow direction (optional)
  - Subtle particle flow or dashed line animation
  - Shows direction of import
  - Toggleable to reduce distraction

- **AC-3:** Tunnel junctions rendered
  - Where multiple imports merge
  - Star/hub pattern at building base
  - Clean visual grouping

- **AC-4:** Legend shows tunnel meaning
  - Color = dependency type
  - Thickness = frequency
  - Small HUD element

- **AC-5:** Tunnel glow effect
  - Subtle emissive glow
  - Increases on hover
  - Creates depth underground

---

## Technical Approach

### Enhanced Dependency Tunnel

```typescript
// packages/ui/src/features/canvas/views/EnhancedDependencyTunnel.tsx

import React, { useRef, useState } from 'react';
import { Tube, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EnhancedDependencyTunnelProps {
  edge: GraphEdge;
  sourcePosition: Position3D;
  targetPosition: Position3D;
  importCount: number;
  packageName: string;
  dependencyType: 'production' | 'dev' | 'peer' | 'type';
  showAnimation: boolean;
}

// Color palette by dependency type
const DEPENDENCY_COLORS = {
  production: '#3b82f6',  // Blue
  dev: '#8b5cf6',         // Purple
  peer: '#22c55e',        // Green
  type: '#6b7280',        // Gray
};

export function EnhancedDependencyTunnel({
  edge,
  sourcePosition,
  targetPosition,
  importCount,
  packageName,
  dependencyType,
  showAnimation,
}: EnhancedDependencyTunnelProps) {
  const [hovered, setHovered] = useState(false);
  const flowRef = useRef<THREE.Points>(null);

  const undergroundY = -3;
  const color = DEPENDENCY_COLORS[dependencyType];
  const radius = Math.min(0.1 + importCount * 0.02, 0.5);

  // Create tunnel path
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(sourcePosition.x, 0, sourcePosition.z),
    new THREE.Vector3(sourcePosition.x, undergroundY, sourcePosition.z),
    new THREE.Vector3(
      (sourcePosition.x + targetPosition.x) / 2,
      undergroundY - 1,
      (sourcePosition.z + targetPosition.z) / 2
    ),
    new THREE.Vector3(targetPosition.x, undergroundY, targetPosition.z),
    new THREE.Vector3(targetPosition.x, 0, targetPosition.z),
  ]);

  // Animate flow particles
  useFrame(({ clock }) => {
    if (flowRef.current && showAnimation) {
      const positions = flowRef.current.geometry.attributes.position;
      const count = positions.count;

      for (let i = 0; i < count; i++) {
        const t = ((clock.elapsedTime * 0.2 + i / count) % 1);
        const point = path.getPoint(t);
        positions.setXYZ(i, point.x, point.y, point.z);
      }
      positions.needsUpdate = true;
    }
  });

  // Generate flow particle positions
  const flowPoints = new Float32Array(20 * 3);
  for (let i = 0; i < 20; i++) {
    const point = path.getPoint(i / 20);
    flowPoints[i * 3] = point.x;
    flowPoints[i * 3 + 1] = point.y;
    flowPoints[i * 3 + 2] = point.z;
  }

  return (
    <group>
      {/* Main tunnel tube */}
      <Tube
        args={[path, 32, radius, 8, false]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={hovered ? 0.9 : 0.6}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </Tube>

      {/* Flow particles (animated) */}
      {showAnimation && (
        <points ref={flowRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={20}
              array={flowPoints}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#ffffff"
            size={0.1}
            transparent
            opacity={0.8}
            sizeAttenuation
          />
        </points>
      )}

      {/* Glow outline */}
      <Tube args={[path, 32, radius + 0.05, 8, false]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Tube>
    </group>
  );
}
```

### Tunnel Junction Component

```typescript
// packages/ui/src/features/canvas/views/TunnelJunction.tsx

import React from 'react';
import { Sphere, Ring } from '@react-three/drei';
import type { Position3D } from '../../../shared/types';

interface TunnelJunctionProps {
  position: Position3D;
  tunnelCount: number;
  isSource: boolean; // Main codebase vs external library
}

export function TunnelJunction({ position, tunnelCount, isSource }: TunnelJunctionProps) {
  const undergroundY = -3;
  const size = 0.3 + tunnelCount * 0.1;

  return (
    <group position={[position.x, undergroundY, position.z]}>
      {/* Central hub */}
      <Sphere args={[size, 16, 16]}>
        <meshStandardMaterial
          color={isSource ? '#3b82f6' : '#6366f1'}
          emissive={isSource ? '#3b82f6' : '#6366f1'}
          emissiveIntensity={0.3}
        />
      </Sphere>

      {/* Decorative rings */}
      <Ring
        args={[size + 0.1, size + 0.2, 16]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </Ring>

      {/* Vertical shaft to surface */}
      <mesh>
        <cylinderGeometry args={[0.1, 0.1, Math.abs(undergroundY), 8]} />
        <meshStandardMaterial
          color="#475569"
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}
```

### Dependency Legend Component

```typescript
// packages/ui/src/features/canvas/components/DependencyLegend.tsx

import React from 'react';
import { useCanvasStore } from '../store';

const LEGEND_ITEMS = [
  { type: 'production', color: '#3b82f6', label: 'Production' },
  { type: 'dev', color: '#8b5cf6', label: 'Dev' },
  { type: 'peer', color: '#22c55e', label: 'Peer' },
  { type: 'type', color: '#6b7280', label: 'Type-only' },
];

export function DependencyLegend() {
  const isUndergroundMode = useCanvasStore(s => s.isUndergroundMode);

  if (!isUndergroundMode) return null;

  return (
    <div className="absolute bottom-4 left-4 bg-gray-900/90 rounded-lg p-3 text-sm">
      <div className="text-gray-400 text-xs mb-2 uppercase tracking-wide">
        Dependencies
      </div>

      {LEGEND_ITEMS.map(item => (
        <div key={item.type} className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-gray-300">{item.label}</span>
        </div>
      ))}

      <div className="mt-2 pt-2 border-t border-gray-700 text-gray-500 text-xs">
        Thickness = import frequency
      </div>
    </div>
  );
}
```

### Animation Toggle

```typescript
// packages/ui/src/features/canvas/store/undergroundSlice.ts

// Add to existing underground state
export interface UndergroundState {
  isUndergroundMode: boolean;
  groundOpacity: number;
  tunnelOpacity: number;
  showTransitive: boolean;
  showFlowAnimation: boolean; // New
}

// Add action
toggleFlowAnimation: () => set(s => ({ showFlowAnimation: !s.showFlowAnimation })),
```

---

## Tasks/Subtasks

### Task 1: Enhance tunnel component
- [ ] Add color by dependency type
- [ ] Add glow effect
- [ ] Add flow particles

### Task 2: Create tunnel junction component
- [ ] Hub sphere at building base
- [ ] Decorative rings
- [ ] Vertical shaft

### Task 3: Create dependency legend
- [ ] Color key
- [ ] Thickness explanation
- [ ] Position in HUD

### Task 4: Add animation toggle
- [ ] State in store
- [ ] Toggle in settings
- [ ] Disable for performance

### Task 5: Integrate with underground layer
- [ ] Pass dependency type to tunnels
- [ ] Render junctions
- [ ] Show legend

### Task 6: Write unit tests
- [ ] Test color mapping
- [ ] Test animation toggle
- [ ] Test legend rendering

---

## Files to Create

- `packages/ui/src/features/canvas/views/EnhancedDependencyTunnel.tsx` - Enhanced tunnel
- `packages/ui/src/features/canvas/views/TunnelJunction.tsx` - Junction component
- `packages/ui/src/features/canvas/components/DependencyLegend.tsx` - Legend
- `packages/ui/src/features/canvas/views/EnhancedDependencyTunnel.test.tsx` - Tests

## Files to Modify

- `packages/ui/src/features/canvas/store/index.ts` - Add animation toggle
- `packages/ui/src/features/canvas/views/UndergroundLayer.tsx` - Use enhanced components
- `packages/ui/src/features/hud/HUD.tsx` - Add legend

---

## Dependencies

- Story 8-17 (Underground mode - base implementation)

---

## Estimation

**Complexity:** Medium
**Effort:** 4-5 hours
**Risk:** Low - Visual polish, optional animation

---

## Definition of Done

- [ ] Tunnels color coded by type
- [ ] Glow effect on tunnels
- [ ] Flow animation works (toggleable)
- [ ] Junctions rendered at building bases
- [ ] Legend visible in underground mode
- [ ] Unit tests pass
