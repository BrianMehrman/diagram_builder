/**
 * EdgeRenderer Component
 *
 * Renders graph edges as lines/arrows between nodes.
 * Supports pulse animation for edges connected to highlighted nodes (arrival feedback).
 */

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, LineBasicMaterial, Vector3 } from 'three';
import { useCanvasStore } from '../store';
import { useReducedMotion } from '../../../shared/hooks/useReducedMotion';
import type { GraphEdge, GraphNode } from '../../../shared/types';

interface EdgeRendererProps {
  edge: GraphEdge;
  nodes: GraphNode[];
}

/**
 * Get edge color based on type
 */
function getEdgeColor(type: GraphEdge['type']): string {
  switch (type) {
    case 'contains':
      return '#60a5fa'; // Blue
    case 'depends_on':
      return '#a78bfa'; // Purple
    case 'calls':
      return '#34d399'; // Green
    case 'inherits':
      return '#fbbf24'; // Amber
    case 'imports':
      return '#f87171'; // Red
    default:
      return '#9ca3af'; // Gray
  }
}

const HIGHLIGHT_COLOR = new Color('#ffffff');

/**
 * EdgeRenderer component
 */
export function EdgeRenderer({ edge, nodes }: EdgeRendererProps) {
  const materialRef = useRef<LineBasicMaterial>(null);
  const [pulseIntensity, setPulseIntensity] = useState(0);

  const highlightedNodeId = useCanvasStore((state) => state.highlightedNodeId);
  const prefersReducedMotion = useReducedMotion();

  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  const isConnected =
    highlightedNodeId !== null &&
    (edge.source === highlightedNodeId || edge.target === highlightedNodeId);

  const color = getEdgeColor(edge.type);
  const baseColor = useMemo(() => new Color(color), [color]);

  // Animate pulse effect for connected edges
  useFrame((_, delta) => {
    if (!materialRef.current?.color) return;

    if (isConnected) {
      if (prefersReducedMotion) {
        // Static highlight: brighten color, full opacity
        materialRef.current.opacity = 1.0;
        materialRef.current.color.copy(baseColor).lerp(HIGHLIGHT_COLOR, 0.4);
        setPulseIntensity(1);
      } else {
        // Sine wave pulse animation (~1s cycle, matching NodeRenderer)
        const time = performance.now() / 1000;
        const t = 0.5 + Math.sin(time * 4) * 0.5; // 0 to 1
        materialRef.current.opacity = 0.7 + t * 0.3; // 0.7 to 1.0
        materialRef.current.color.copy(baseColor).lerp(HIGHLIGHT_COLOR, t * 0.4);
        setPulseIntensity(t);
      }
    } else if (pulseIntensity > 0) {
      // Fade out when no longer connected to highlighted node
      const newIntensity = Math.max(0, pulseIntensity - delta * 2);
      setPulseIntensity(newIntensity);
      materialRef.current.opacity = 0.7 + newIntensity * 0.3;
      materialRef.current.color.copy(baseColor).lerp(HIGHLIGHT_COLOR, newIntensity * 0.4);
    } else {
      // Reset to base state
      materialRef.current.opacity = 0.7;
      materialRef.current.color.copy(baseColor);
    }
  });

  // Create line geometry
  const points = useMemo(() => {
    if (!sourceNode?.position || !targetNode?.position) {
      return null;
    }

    return [
      new Vector3(
        sourceNode.position.x,
        sourceNode.position.y,
        sourceNode.position.z
      ),
      new Vector3(
        targetNode.position.x,
        targetNode.position.y,
        targetNode.position.z
      ),
    ];
  }, [sourceNode, targetNode]);

  if (!points) {
    return null;
  }

  const positionsArray = new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]));

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positionsArray, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0.7}
      />
    </line>
  );
}
