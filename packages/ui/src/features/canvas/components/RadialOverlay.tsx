/**
 * RadialOverlay
 *
 * Full-canvas SVG overlay that shows the radial connection map for the
 * currently selected node. Center node = selected building. 1st-hop spokes
 * with arrowheads and labels. 2nd-hop spokes at reduced opacity.
 *
 * Rendered as an absolutely-positioned overlay on top of the 3D canvas.
 * Clicking the backdrop dismisses the overlay.
 */

import { useMemo } from 'react';
import { useCanvasStore } from '../store';
import { useFocusedConnections } from '../hooks/useFocusedConnections';
import type { Graph, GraphNode } from '../../../shared/types';

// Edge type → color (matches 3D scene colors)
const EDGE_COLORS: Record<string, string> = {
  calls: '#34d399',
  imports: '#94a3b8',
  depends_on: '#94a3b8',
  inherits: '#fbbf24',
  contains: '#94a3b8',
};
const DEFAULT_EDGE_COLOR = '#94a3b8';
const DASHED_TYPES = new Set(['imports', 'depends_on', 'inherits', 'contains']);

// SVG layout constants
const CX = 400;
const CY = 300;
const DIRECT_RADIUS = 180;
const SECOND_RADIUS = 290;
const CENTER_R = 30;
const NODE_R = 20;
const SECOND_NODE_R = 14;

function shortLabel(node: GraphNode | undefined): string {
  if (!node) return '?';
  const label = node.label ?? node.id;
  return label.split('/').pop() ?? label;
}

interface RadialOverlayProps {
  graph: Graph;
}

export function RadialOverlay({ graph }: RadialOverlayProps) {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const showRadialOverlay = useCanvasStore((s) => s.showRadialOverlay);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const toggleRadialOverlay = useCanvasStore((s) => s.toggleRadialOverlay);
  const { directEdges, secondHopEdges, directNodeIds } = useFocusedConnections(graph);

  const nodeMap = useMemo(() => {
    const m = new Map<string, GraphNode>();
    for (const n of graph.nodes) m.set(n.id, n);
    return m;
  }, [graph.nodes]);

  if (!showRadialOverlay || !selectedNodeId) return null;

  const focusedNode = nodeMap.get(selectedNodeId);
  const directIds = Array.from(directNodeIds);

  // Arrange direct nodes evenly around the center
  const directPositions = directIds.map((id, i) => {
    const angle = (2 * Math.PI * i) / directIds.length - Math.PI / 2;
    return {
      id,
      x: CX + DIRECT_RADIUS * Math.cos(angle),
      y: CY + DIRECT_RADIUS * Math.sin(angle),
    };
  });

  const posMap = new Map<string, { x: number; y: number }>(
    directPositions.map((p) => [p.id, { x: p.x, y: p.y }]),
  );
  posMap.set(selectedNodeId, { x: CX, y: CY });

  // Collect second-hop node IDs (not already direct or selected)
  const secondHopIds = Array.from(
    new Set(
      secondHopEdges
        .flatMap((e) => [e.source, e.target])
        .filter((id) => !directNodeIds.has(id) && id !== selectedNodeId),
    ),
  );

  // Arrange second-hop nodes around the outer ring
  const secondHopPositions = secondHopIds.map((id, i) => {
    const angle = (2 * Math.PI * i) / Math.max(secondHopIds.length, 1) - Math.PI / 2 + 0.2;
    return {
      id,
      x: CX + SECOND_RADIUS * Math.cos(angle),
      y: CY + SECOND_RADIUS * Math.sin(angle),
    };
  });

  for (const p of secondHopPositions) posMap.set(p.id, { x: p.x, y: p.y });

  function arrowHead(
    x2: number,
    y2: number,
    dx: number,
    dy: number,
    color: string,
  ): React.ReactElement | null {
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return null;
    const nx = dx / len;
    const ny = dy / len;
    const px = -ny * 5;
    const py = nx * 5;
    return (
      <polygon
        points={`${x2},${y2} ${x2 - nx * 10 + px},${y2 - ny * 10 + py} ${x2 - nx * 10 - px},${y2 - ny * 10 - py}`}
        fill={color}
      />
    );
  }

  function handleNodeClick(nodeId: string) {
    selectNode(nodeId);
    // Overlay stays open and re-renders centered on the new node
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleRadialOverlay();
      }}
    >
      <svg width={800} height={600} style={{ overflow: 'visible' }}>
        {/* Second-hop edges */}
        {secondHopEdges.map((edge) => {
          const src = posMap.get(edge.source);
          const tgt = posMap.get(edge.target);
          if (!src || !tgt) return null;
          const color = EDGE_COLORS[edge.type] ?? DEFAULT_EDGE_COLOR;
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          return (
            <g key={edge.id} opacity={0.4}>
              <line
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray={DASHED_TYPES.has(edge.type) ? '5,3' : undefined}
              />
              {arrowHead(tgt.x, tgt.y, dx, dy, color)}
            </g>
          );
        })}

        {/* Direct edges */}
        {directEdges.map((edge) => {
          const src = posMap.get(edge.source);
          const tgt = posMap.get(edge.target);
          if (!src || !tgt) return null;
          const color = EDGE_COLORS[edge.type] ?? DEFAULT_EDGE_COLOR;
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const midX = (src.x + tgt.x) / 2;
          const midY = (src.y + tgt.y) / 2;
          return (
            <g key={edge.id}>
              <line
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={color}
                strokeWidth={2}
                strokeDasharray={DASHED_TYPES.has(edge.type) ? '6,3' : undefined}
              />
              {arrowHead(tgt.x, tgt.y, dx, dy, color)}
              <text
                x={midX}
                y={midY - 6}
                textAnchor="middle"
                fontSize={10}
                fill={color}
                opacity={0.9}
              >
                {edge.type}
              </text>
            </g>
          );
        })}

        {/* Second-hop nodes */}
        {secondHopPositions.map(({ id, x, y }) => (
          <g
            key={id}
            onClick={() => handleNodeClick(id)}
            style={{ cursor: 'pointer' }}
            opacity={0.6}
          >
            <circle cx={x} cy={y} r={SECOND_NODE_R} fill="#1e293b" stroke="#64748b" strokeWidth={1.5} />
            <text x={x} y={y + SECOND_NODE_R + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">
              {shortLabel(nodeMap.get(id))}
            </text>
          </g>
        ))}

        {/* Direct nodes */}
        {directPositions.map(({ id, x, y }) => (
          <g key={id} onClick={() => handleNodeClick(id)} style={{ cursor: 'pointer' }}>
            <circle cx={x} cy={y} r={NODE_R} fill="#1e293b" stroke="#60a5fa" strokeWidth={2} />
            <text x={x} y={y + NODE_R + 14} textAnchor="middle" fontSize={11} fill="#e2e8f0">
              {shortLabel(nodeMap.get(id))}
            </text>
          </g>
        ))}

        {/* Center (focused) node */}
        <circle cx={CX} cy={CY} r={CENTER_R} fill="#2563eb" stroke="#93c5fd" strokeWidth={2} />
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#fff">
          {shortLabel(focusedNode)}
        </text>
      </svg>
    </div>
  );
}
