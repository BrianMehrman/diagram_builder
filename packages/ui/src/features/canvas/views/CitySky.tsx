/**
 * CitySky Sub-Orchestrator
 *
 * Renders sky-level city elements: dependency edges between buildings.
 *
 * v1 mode: flat CityEdge lines (original behaviour).
 * v2 mode: OverheadWire arcs (rooftop-anchored, calls=solid, composes=dashed)
 *          with GroundShadow projections. Gated by edgeTierVisibility.crossDistrict.
 *
 * Extracted from CityView as part of Epic 10, Story 10-3.
 * Updated in Story 10-17 to wire SkyEdge + GroundShadow.
 * Updated in Story 11-11 to replace SkyEdge with OverheadWire for v2.
 */

import { CityEdge } from './CityEdge';
import { OverheadWire } from '../components/OverheadWire';
import { GroundShadow } from '../components/GroundShadow';
import { useCityLayout } from '../hooks/useCityLayout';
import { useCityFiltering } from '../hooks/useCityFiltering';
import { useCanvasStore } from '../store';
import {
  classifyEdgeRouting,
  getContainmentHeight,
  getBuildingHeight,
  KIOSK_HEIGHT,
} from './cityViewUtils';
import type { Graph, GraphNode } from '../../../shared/types';

/** Compute rooftop Y for a node so OverheadWire arcs start/end at the correct height. */
function getNodeRooftopY(node: GraphNode | undefined): number {
  if (!node) return 0;
  if (node.type === 'class' || node.type === 'abstract_class' || node.type === 'interface') {
    return getContainmentHeight(node.methodCount ?? 0);
  }
  if (node.type === 'function') {
    return KIOSK_HEIGHT;
  }
  return getBuildingHeight(node.depth);
}

interface CitySkyProps {
  graph: Graph;
}

export function CitySky({ graph }: CitySkyProps) {
  const { positions } = useCityLayout(graph);
  const { visibleEdges, nodeMap } = useCityFiltering(graph, positions);
  const cityVersion = useCanvasStore((s) => s.citySettings.cityVersion);
  const edgeTierVisibility = useCanvasStore((s) => s.citySettings.edgeTierVisibility);

  const isV2 = cityVersion === 'v2';

  // In v2 mode: CitySky renders only overhead edges (method calls, composition),
  // gated by the crossDistrict tier toggle.
  // Structural edges (imports, inherits, depends_on) route underground via CityUnderground.
  const edgesToRender = isV2
    ? visibleEdges.filter(
        (e) => classifyEdgeRouting(e.type) === 'overhead' && edgeTierVisibility.crossDistrict,
      )
    : visibleEdges;

  return (
    <>
      {/* Dependency edges between buildings */}
      {edgesToRender.map((edge) => {
        const srcPos = positions.get(edge.source)!;
        const tgtPos = positions.get(edge.target)!;

        if (isV2) {
          const srcNode = nodeMap.get(edge.source);
          const tgtNode = nodeMap.get(edge.target);
          return (
            <group key={edge.id}>
              <OverheadWire
                sourcePosition={srcPos}
                targetPosition={tgtPos}
                sourceHeight={getNodeRooftopY(srcNode)}
                targetHeight={getNodeRooftopY(tgtNode)}
                edgeType={edge.type}
              />
              <GroundShadow
                edge={edge}
                sourcePosition={srcPos}
                targetPosition={tgtPos}
              />
            </group>
          );
        }

        const srcNode = nodeMap.get(edge.source);
        const tgtNode = nodeMap.get(edge.target);
        return (
          <CityEdge
            key={edge.id}
            edge={edge}
            sourcePosition={srcPos}
            targetPosition={tgtPos}
            sourceDepth={srcNode?.depth}
            targetDepth={tgtNode?.depth}
          />
        );
      })}
    </>
  );
}
