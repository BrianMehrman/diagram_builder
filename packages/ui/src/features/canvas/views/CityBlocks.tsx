/**
 * CityBlocks Sub-Orchestrator
 *
 * Renders ground-level city elements: district grounds, highway signs,
 * cluster buildings (LOD 1), internal buildings (typed/x-ray + signs),
 * and external buildings (infrastructure landmarks + wireframe fallback).
 *
 * Extracted from CityView as part of Epic 10, Story 10-3.
 */

import { Building } from './Building';
import { ExternalBuilding } from './ExternalBuilding';
import { XRayBuilding } from './XRayBuilding';
import { DistrictGround } from '../components/DistrictGround';
import { ClusterBuilding } from '../components/ClusterBuilding';
import {
  ClassBuilding,
  FunctionShop,
  InterfaceBuilding,
  AbstractBuilding,
  VariableCrate,
  EnumCrate,
  RooftopGarden,
} from '../components/buildings';
import { getBuildingConfig } from '../components/buildingGeometry';
import { getDistrictColor } from '../components/districtGroundUtils';
import { getSignType, getSignVisibility, renderSign } from '../components/signs';
import {
  PowerStation,
  WaterTower,
  MunicipalBuilding,
  Harbor,
  Airport,
  CityGate,
} from '../components/infrastructure';
import { useCanvasStore } from '../store';
import { useCityLayout } from '../hooks/useCityLayout';
import { useCityFiltering } from '../hooks/useCityFiltering';
import { useDistrictMap } from '../hooks/useDistrictMap';
import { computeXRayWallOpacity, shouldShowXRayDetail } from '../xrayUtils';
import type { Graph, GraphNode, Position3D } from '../../../shared/types';

interface CityBlocksProps {
  graph: Graph;
}

/** Distance threshold for showing x-ray internal detail */
const XRAY_DETAIL_DISTANCE = 30;

/** Types that can contain nested type definitions */
const CONTAINER_TYPES = new Set(['class', 'abstract_class', 'file']);

/**
 * Renders the appropriate infrastructure landmark for an external node
 * based on its `metadata.infrastructureType`. Returns null for 'general'
 * or missing type, signaling fallback to ExternalBuilding.
 */
function renderInfrastructureLandmark(
  node: GraphNode,
  position: Position3D,
): React.JSX.Element | null {
  const infraType = node.metadata?.infrastructureType as string | undefined;
  if (!infraType || infraType === 'general') return null;

  const props = { key: node.id, node, position };
  switch (infraType) {
    case 'database':
      return <Harbor {...props} />;
    case 'api':
      return <Airport {...props} />;
    case 'queue':
      return <PowerStation {...props} />;
    case 'cache':
      return <WaterTower {...props} />;
    case 'auth':
      return <CityGate {...props} />;
    case 'logging':
    case 'filesystem':
      return <MunicipalBuilding {...props} />;
    default:
      return null;
  }
}

/**
 * Renders the appropriate typed building component based on node.type.
 * Falls back to the generic Building component for unrecognized types.
 * Adds RooftopGarden for container types with nested children.
 */
function renderTypedBuilding(
  node: GraphNode,
  position: { x: number; y: number; z: number },
  nestedMap: Map<string, GraphNode[]>,
  methodsByClass: Map<string, GraphNode[]>,
  lodLevel: number,
) {
  const props = { key: node.id, node, position };
  const hasNested = CONTAINER_TYPES.has(node.type) && nestedMap.has(node.id);
  const classMethods = methodsByClass.get(node.id);
  const methodProps = classMethods ? { methods: classMethods, lodLevel } : { lodLevel };

  let building: React.JSX.Element;
  switch (node.type) {
    case 'class':
      building = <ClassBuilding {...props} {...methodProps} />;
      break;
    case 'function':
      building = <FunctionShop {...props} />;
      break;
    case 'interface':
      building = <InterfaceBuilding {...props} {...methodProps} />;
      break;
    case 'abstract_class':
      building = <AbstractBuilding {...props} {...methodProps} />;
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
      {renderTypedBuildingInner(node, methodsByClass, lodLevel)}
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
function renderTypedBuildingInner(
  node: GraphNode,
  methodsByClass: Map<string, GraphNode[]>,
  lodLevel: number,
) {
  const origin = { x: 0, y: 0, z: 0 };
  const props = { key: `inner-${node.id}`, node, position: origin };
  const classMethods = methodsByClass.get(node.id);
  const methodProps = classMethods ? { methods: classMethods, lodLevel } : { lodLevel };
  switch (node.type) {
    case 'class':
      return <ClassBuilding {...props} {...methodProps} />;
    case 'abstract_class':
      return <AbstractBuilding {...props} {...methodProps} />;
    default:
      return <Building key={`inner-${node.id}`} node={node} position={origin} />;
  }
}

export function CityBlocks({ graph }: CityBlocksProps) {
  const isXRayMode = useCanvasStore((s) => s.isXRayMode);
  const xrayOpacity = useCanvasStore((s) => s.xrayOpacity);
  const cameraPosition = useCanvasStore((s) => s.camera.position);
  const lodLevel = useCanvasStore((s) => s.lodLevel);

  const { positions, districtArcs } = useCityLayout(graph);
  const { internalNodes, externalNodes, clusters, clusteredNodeIds, childrenByFile, methodsByClass } =
    useCityFiltering(graph, positions);
  const { nestedTypeMap } = useDistrictMap(graph.nodes);

  return (
    <>
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
      {internalNodes.map((node) => {
        const pos = positions.get(node.id);
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
            {renderTypedBuilding(node, pos, nestedTypeMap, methodsByClass, lodLevel)}
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

      {/* External library buildings — infrastructure landmarks or wireframe fallback */}
      {externalNodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;

        const landmark = renderInfrastructureLandmark(node, pos);
        if (landmark) return landmark;

        return <ExternalBuilding key={node.id} node={node} position={pos} />;
      })}
    </>
  );
}
