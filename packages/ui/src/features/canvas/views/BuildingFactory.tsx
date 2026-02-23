/**
 * BuildingFactory
 *
 * Provides factory functions that map a GraphNode's type to the appropriate
 * typed building component. Extracted from CityBlocks to eliminate the
 * duplicated switch(node.type) pattern.
 *
 * Extracted as part of the visualization renderer abstraction plan (Task 8).
 */

import {
  ClassBuilding,
  BaseClassBuilding,
  FunctionShop,
  InterfaceBuilding,
  AbstractBuilding,
  VariableCrate,
  EnumCrate,
  RooftopGarden,
} from '../components/buildings';
import { getBuildingConfig } from '../components/buildingGeometry';
import { Building } from './Building';
import type { Graph, GraphNode } from '../../../shared/types';
import type { EncodedHeightOptions } from './cityViewUtils';

/** Types that can contain nested type definitions */
const CONTAINER_TYPES = new Set(['class', 'abstract_class', 'file']);

/**
 * Renders just the building mesh at origin (used inside a positioned group
 * when there is a RooftopGarden). Mirrors the logic of renderTypedBuildingInner
 * from CityBlocks.tsx.
 */
export function createBuildingElementAtOrigin(
  node: GraphNode,
  methodsByClass: Map<string, GraphNode[]>,
  lodLevel: number,
  graph: Graph,
  encodingOptions?: EncodedHeightOptions,
  baseClassIds?: Set<string>,
): React.JSX.Element {
  const origin = { x: 0, y: 0, z: 0 };
  const props = { key: `inner-${node.id}`, node, position: origin };
  const classMethods = methodsByClass.get(node.id);
  const classExtras = encodingOptions ? { encodingOptions } : {};
  const nodeIsBase = baseClassIds?.has(node.id) ?? false;
  const methodProps = classMethods
    ? { methods: classMethods, lodLevel, isBaseClass: nodeIsBase, ...classExtras }
    : { lodLevel, isBaseClass: nodeIsBase, ...classExtras };
  switch (node.type) {
    case 'class':
      return nodeIsBase
        ? <BaseClassBuilding {...props} {...methodProps} graph={graph} />
        : <ClassBuilding {...props} {...methodProps} graph={graph} />;
    case 'abstract_class':
      return <AbstractBuilding {...props} {...methodProps} graph={graph} />;
    default:
      return <Building key={`inner-${node.id}`} node={node} position={origin} graph={graph} {...(encodingOptions ? { encodingOptions } : {})} />;
  }
}

/**
 * Renders the appropriate typed building component based on node.type.
 * Falls back to the generic Building component for unrecognized types.
 * Adds RooftopGarden for container types with nested children.
 * Routes base classes to BaseClassBuilding for distinct visual treatment (Story 11-6).
 *
 * Mirrors the logic of renderTypedBuilding from CityBlocks.tsx.
 */
export function createBuildingElement(
  node: GraphNode,
  position: { x: number; y: number; z: number },
  nestedMap: Map<string, GraphNode[]>,
  methodsByClass: Map<string, GraphNode[]>,
  lodLevel: number,
  graph: Graph,
  encodingOptions?: EncodedHeightOptions,
  baseClassIds?: Set<string>,
): React.JSX.Element {
  const props = { key: node.id, node, position };
  const hasNested = CONTAINER_TYPES.has(node.type) && nestedMap.has(node.id);
  const classMethods = methodsByClass.get(node.id);
  const classExtras = encodingOptions ? { encodingOptions } : {};
  const nodeIsBase = baseClassIds?.has(node.id) ?? false;
  const methodProps = classMethods
    ? { methods: classMethods, lodLevel, isBaseClass: nodeIsBase, ...classExtras }
    : { lodLevel, isBaseClass: nodeIsBase, ...classExtras };

  let building: React.JSX.Element;
  switch (node.type) {
    case 'class':
      building = nodeIsBase
        ? <BaseClassBuilding {...props} {...methodProps} graph={graph} />
        : <ClassBuilding {...props} {...methodProps} graph={graph} />;
      break;
    case 'function':
      building = <FunctionShop {...props} {...classExtras} graph={graph} />;
      break;
    case 'interface':
      building = <InterfaceBuilding {...props} {...methodProps} graph={graph} />;
      break;
    case 'abstract_class':
      building = <AbstractBuilding {...props} {...methodProps} graph={graph} />;
      break;
    case 'variable':
      building = <VariableCrate {...props} graph={graph} />;
      break;
    case 'enum':
      building = <EnumCrate {...props} graph={graph} />;
      break;
    default:
      building = <Building key={node.id} node={node} position={position} graph={graph} {...(encodingOptions ? { encodingOptions } : {})} />;
      break;
  }

  if (!hasNested) return building;

  const config = getBuildingConfig(node, encodingOptions);
  return (
    <group key={node.id} position={[position.x, position.y, position.z]}>
      {/* Re-render building at origin since group handles position */}
      {createBuildingElementAtOrigin(node, methodsByClass, lodLevel, graph, encodingOptions, baseClassIds)}
      <RooftopGarden
        parentNode={node}
        parentWidth={config.geometry.width}
        parentHeight={config.geometry.height}
        nestedMap={nestedMap}
      />
    </group>
  );
}
