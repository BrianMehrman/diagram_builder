/**
 * CityView Component
 *
 * Renders the codebase as a radial city of buildings.
 * Files appear as 3D buildings positioned by the RadialCityLayoutEngine.
 * Entry-point files are at center, deeper code radiates outward.
 * External libraries appear as distinct wireframe buildings in the outermost ring.
 */

import { useMemo, useEffect } from 'react';
import { Building } from './Building';
import { ExternalBuilding } from './ExternalBuilding';
import { XRayBuilding } from './XRayBuilding';
import { CityEdge } from './CityEdge';
import { GroundPlane } from './GroundPlane';
import { UndergroundLayer } from './UndergroundLayer';
import { DistrictGround } from '../components/DistrictGround';
import { ClusterBuilding } from '../components/ClusterBuilding';
import { LodController } from '../components/LodController';
import {
  ClassBuilding,
  FunctionShop,
  InterfaceBuilding,
  AbstractBuilding,
  VariableCrate,
  EnumCrate,
  RooftopGarden,
  buildNestedTypeMap,
} from '../components/buildings';
import { getBuildingConfig } from '../components/buildingGeometry';
import { getDistrictColor } from '../components/districtGroundUtils';
import { getSignType, getSignVisibility, renderSign } from '../components/signs';
import { RadialCityLayoutEngine } from '../layout/engines/radialCityLayout';
import { shouldCluster, createClusterMetadata } from '../layout/engines/clusterUtils';
import { useCanvasStore } from '../store';
import { computeXRayWallOpacity, shouldShowXRayDetail } from '../xrayUtils';
import { computeGroundOpacity } from '../undergroundUtils';
import type { Graph, GraphNode } from '../../../shared/types';
import type { DistrictArcMetadata } from '../layout/engines/radialCityLayout';

interface CityViewProps {
  graph: Graph;
}

/** Distance threshold for showing x-ray internal detail */
const XRAY_DETAIL_DISTANCE = 30;

/** Default threshold for clustering — districts with more nodes collapse at LOD 1 */
const DEFAULT_CLUSTER_THRESHOLD = 20;

/** Types that can contain nested type definitions */
const CONTAINER_TYPES = new Set(['class', 'abstract_class', 'file']);

/**
 * Renders the appropriate typed building component based on node.type.
 * Falls back to the generic Building component for unrecognized types.
 * Adds RooftopGarden for container types with nested children.
 */
function renderTypedBuilding(
  node: GraphNode,
  position: { x: number; y: number; z: number },
  nestedMap: Map<string, GraphNode[]>,
) {
  const props = { key: node.id, node, position };
  const hasNested = CONTAINER_TYPES.has(node.type) && nestedMap.has(node.id);

  let building: React.JSX.Element;
  switch (node.type) {
    case 'class':
      building = <ClassBuilding {...props} />;
      break;
    case 'function':
      building = <FunctionShop {...props} />;
      break;
    case 'interface':
      building = <InterfaceBuilding {...props} />;
      break;
    case 'abstract_class':
      building = <AbstractBuilding {...props} />;
      break;
    case 'variable':
      building = <VariableCrate {...props} />;
      break;
    case 'enum':
      building = <EnumCrate {...props} />;
      break;
    default:
      building = <Building key={node.id} node={node} position={position} />;
      break;
  }

  if (!hasNested) return building;

  const config = getBuildingConfig(node);
  return (
    <group key={node.id} position={[position.x, position.y, position.z]}>
      {/* Re-render building at origin since group handles position */}
      {renderTypedBuildingInner(node)}
      <RooftopGarden
        parentNode={node}
        parentWidth={config.geometry.width}
        parentHeight={config.geometry.height}
        nestedMap={nestedMap}
      />
    </group>
  );
}

/**
 * Renders just the building mesh without position (used inside rooftop group).
 */
function renderTypedBuildingInner(node: GraphNode) {
  const origin = { x: 0, y: 0, z: 0 };
  const props = { key: `inner-${node.id}`, node, position: origin };
  switch (node.type) {
    case 'class':
      return <ClassBuilding {...props} />;
    case 'abstract_class':
      return <AbstractBuilding {...props} />;
    default:
      return <Building key={`inner-${node.id}`} node={node} position={origin} />;
  }
}

export function CityView({ graph }: CityViewProps) {
  const setLayoutPositions = useCanvasStore((s) => s.setLayoutPositions);
  const isXRayMode = useCanvasStore((s) => s.isXRayMode);
  const xrayOpacity = useCanvasStore((s) => s.xrayOpacity);
  const cameraPosition = useCanvasStore((s) => s.camera.position);
  const isUndergroundMode = useCanvasStore((s) => s.isUndergroundMode);
  const layoutDensity = useCanvasStore((s) => s.layoutDensity);
  const lodLevel = useCanvasStore((s) => s.lodLevel);

  // Compute radial city layout — entry points at center, deeper code outward
  const layout = useMemo(() => {
    const engine = new RadialCityLayoutEngine();
    return engine.layout(graph, { density: layoutDensity });
  }, [graph, layoutDensity]);

  // Publish layout positions to store so camera flight can use them
  useEffect(() => {
    setLayoutPositions(layout.positions);
  }, [layout.positions, setLayoutPositions]);

  // Separate internal and external nodes
  const internalFiles = useMemo(
    () => graph.nodes.filter((n) => n.type === 'file' && !n.isExternal),
    [graph.nodes]
  );

  const externalNodes = useMemo(
    () => graph.nodes.filter((n) => n.isExternal === true),
    [graph.nodes]
  );

  // Group internal files by directory for clustering
  const districtGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const node of internalFiles) {
      const filePath = (node.metadata?.path as string) ?? node.label ?? '';
      const lastSlash = filePath.lastIndexOf('/');
      const dir = lastSlash >= 0 ? filePath.substring(0, lastSlash) : 'root';
      if (!groups.has(dir)) groups.set(dir, []);
      groups.get(dir)!.push(node.id);
    }
    return groups;
  }, [internalFiles]);

  // Compute cluster metadata for districts that exceed the threshold
  const clusters = useMemo(() => {
    if (lodLevel > 1) return []; // No clustering at LOD 2+
    const result = [];
    for (const [districtId, nodeIds] of districtGroups) {
      if (shouldCluster(nodeIds.length, DEFAULT_CLUSTER_THRESHOLD)) {
        result.push(createClusterMetadata(districtId, nodeIds, layout.positions));
      }
    }
    return result;
  }, [districtGroups, layout.positions, lodLevel]);

  // Set of node IDs that are clustered (hidden as individual buildings at LOD 1)
  const clusteredNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cluster of clusters) {
      for (const id of cluster.nodeIds) {
        ids.add(id);
      }
    }
    return ids;
  }, [clusters]);

  // Build a map of parentId -> nested type children for rooftop gardens
  const nestedTypeMap = useMemo(
    () => buildNestedTypeMap(graph.nodes),
    [graph.nodes],
  );

  // Build a map of file id -> child nodes for x-ray mode
  const childrenByFile = useMemo(() => {
    if (!isXRayMode) return new Map<string, typeof graph.nodes>();
    const map = new Map<string, typeof graph.nodes>();
    for (const node of graph.nodes) {
      if (node.type === 'class' || node.type === 'method' || node.type === 'function') {
        const parentId = node.parentId;
        if (parentId) {
          const existing = map.get(parentId) ?? [];
          existing.push(node);
          map.set(parentId, existing);
        }
      }
    }
    return map;
  }, [graph.nodes, isXRayMode]);

  // Build node lookup for edge rendering
  const nodeMap = useMemo(() => {
    const map = new Map<string, typeof graph.nodes[0]>();
    for (const node of graph.nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [graph.nodes]);

  // Filter edges to only those with both endpoints having layout positions
  const visibleEdges = useMemo(() => {
    return graph.edges.filter(
      (e) =>
        (e.type === 'imports' || e.type === 'depends_on' || e.type === 'calls') &&
        layout.positions.has(e.source) &&
        layout.positions.has(e.target)
    );
  }, [graph.edges, layout.positions]);

  // Ground plane dimensions from layout bounds
  const groundWidth = layout.bounds.max.x - layout.bounds.min.x;
  const groundDepth = layout.bounds.max.z - layout.bounds.min.z;

  // Extract district arcs from radial layout metadata (if available)
  const districtArcs = (layout.metadata?.districtArcs ?? []) as DistrictArcMetadata[];

  return (
    <group name="city-view">
      {/* LOD level controller — updates lodLevel based on camera distance */}
      <LodController />

      {/* Ground plane */}
      <GroundPlane
        width={Math.max(groundWidth, 20)}
        depth={Math.max(groundDepth, 20)}
        opacity={computeGroundOpacity(isUndergroundMode)}
      />

      {/* District ground planes (radial layout) */}
      {districtArcs.map((arc, index) => (
        <DistrictGround
          key={`${arc.id}-${arc.ringDepth}`}
          arcStart={arc.arcStart}
          arcEnd={arc.arcEnd}
          innerRadius={arc.innerRadius}
          outerRadius={arc.outerRadius}
          color={getDistrictColor(arc.id, index)}
          label={arc.id}
        />
      ))}

      {/* District highway signs (LOD-controlled) */}
      {districtArcs.map((arc) => {
        const midAngle = (arc.arcStart + arc.arcEnd) / 2;
        const signRadius = arc.outerRadius + 1;
        const districtLabel = (arc.id ?? '').split('/').pop() || arc.id || 'district';
        return renderSign({
          key: `district-sign-${arc.id}-${arc.ringDepth}`,
          signType: 'highway',
          text: districtLabel,
          position: {
            x: Math.cos(midAngle) * signRadius,
            y: 1.5,
            z: Math.sin(midAngle) * signRadius,
          },
          visible: getSignVisibility('highway', lodLevel),
        });
      })}

      {/* Underground dependency tunnels */}
      <UndergroundLayer graph={graph} positions={layout.positions} />

      {/* Cluster buildings (LOD 1 only) */}
      {clusters.map((cluster) => (
        <ClusterBuilding
          key={`cluster-${cluster.districtId}`}
          position={cluster.center}
          nodeCount={cluster.nodeCount}
          districtName={cluster.districtId}
          size={cluster.size}
        />
      ))}

      {/* Internal buildings with signs (skip clustered nodes at LOD 1) */}
      {internalFiles.map((node) => {
        const pos = layout.positions.get(node.id);
        if (!pos) return null;
        if (clusteredNodeIds.has(node.id)) return null;

        if (isXRayMode) {
          const dx = cameraPosition.x - pos.x;
          const dy = cameraPosition.y - pos.y;
          const dz = cameraPosition.z - pos.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const wallOpacity = computeXRayWallOpacity(true, xrayOpacity);
          const showDetail = shouldShowXRayDetail(true, dist, XRAY_DETAIL_DISTANCE);

          return (
            <XRayBuilding
              key={node.id}
              node={node}
              position={pos}
              children={childrenByFile.get(node.id) ?? []}
              xrayOpacity={wallOpacity}
              showDetail={showDetail}
            />
          );
        }

        const signType = getSignType(node);
        const signVisible = getSignVisibility(signType, lodLevel);
        const config = getBuildingConfig(node);
        const signLabel = (node.label ?? node.id).split('/').pop() ?? node.id;

        return (
          <group key={node.id}>
            {renderTypedBuilding(node, pos, nestedTypeMap)}
            {renderSign({
              key: `sign-${node.id}`,
              signType,
              text: signLabel,
              position: {
                x: pos.x,
                y: pos.y + config.geometry.height + 1.5,
                z: pos.z,
              },
              visible: signVisible,
            })}
          </group>
        );
      })}

      {/* External library buildings */}
      {externalNodes.map((node) => {
        const pos = layout.positions.get(node.id);
        if (!pos) return null;

        return <ExternalBuilding key={node.id} node={node} position={pos} />;
      })}

      {/* Dependency edges between buildings */}
      {visibleEdges.map((edge) => {
        const srcPos = layout.positions.get(edge.source)!;
        const tgtPos = layout.positions.get(edge.target)!;
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
    </group>
  );
}
