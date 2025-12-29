/**
 * IVM Validation Functions
 *
 * Provides validation for IVM graphs, nodes, and edges to ensure
 * data integrity before rendering or export.
 */

import {
  IVMGraph,
  IVMNode,
  IVMEdge,
  NodeType,
  EdgeType,
  LODLevel,
  Position3D,
  NodeMetadata,
  GraphMetadata,
  IVM_SCHEMA_VERSION,
} from './types.js';

// =============================================================================
// Validation Result Types
// =============================================================================

/**
 * A single validation error
 */
export interface ValidationError {
  /** Error code for programmatic handling */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Path to the invalid field (e.g., 'nodes[0].metadata.label') */
  path: string;

  /** The invalid value */
  value?: unknown;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;

  /** List of validation errors (empty if valid) */
  errors: ValidationError[];

  /** List of validation warnings (non-fatal issues) */
  warnings: ValidationError[];
}

/**
 * Creates a successful validation result
 */
function success(): ValidationResult {
  return { valid: true, errors: [], warnings: [] };
}

/**
 * Creates a failed validation result
 */
function failure(errors: ValidationError[], warnings: ValidationError[] = []): ValidationResult {
  return { valid: false, errors, warnings };
}

/**
 * Merges multiple validation results
 */
function mergeResults(...results: ValidationResult[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  for (const result of results) {
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// Type Guards
// =============================================================================

const VALID_NODE_TYPES: readonly NodeType[] = [
  'file',
  'directory',
  'module',
  'class',
  'interface',
  'function',
  'method',
  'variable',
  'type',
  'enum',
  'namespace',
  'package',
  'repository',
];

const VALID_EDGE_TYPES: readonly EdgeType[] = [
  'imports',
  'exports',
  'extends',
  'implements',
  'calls',
  'uses',
  'contains',
  'depends_on',
  'type_of',
  'returns',
  'parameter_of',
];

const VALID_LOD_LEVELS: readonly LODLevel[] = [0, 1, 2, 3, 4, 5];

/**
 * Checks if a value is a valid NodeType
 */
export function isValidNodeType(value: unknown): value is NodeType {
  return typeof value === 'string' && VALID_NODE_TYPES.includes(value as NodeType);
}

/**
 * Checks if a value is a valid EdgeType
 */
export function isValidEdgeType(value: unknown): value is EdgeType {
  return typeof value === 'string' && VALID_EDGE_TYPES.includes(value as EdgeType);
}

/**
 * Checks if a value is a valid LOD level
 */
export function isValidLODLevel(value: unknown): value is LODLevel {
  return typeof value === 'number' && VALID_LOD_LEVELS.includes(value as LODLevel);
}

/**
 * Checks if a value is a valid Position3D
 */
export function isValidPosition(value: unknown): value is Position3D {
  if (typeof value !== 'object' || value === null) return false;
  const pos = value as Record<string, unknown>;
  return (
    typeof pos['x'] === 'number' &&
    typeof pos['y'] === 'number' &&
    typeof pos['z'] === 'number' &&
    Number.isFinite(pos['x']) &&
    Number.isFinite(pos['y']) &&
    Number.isFinite(pos['z'])
  );
}

// =============================================================================
// Position Validation
// =============================================================================

/**
 * Validates a Position3D object
 */
export function validatePosition(position: unknown, path: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isValidPosition(position)) {
    errors.push({
      code: 'INVALID_POSITION',
      message: 'Position must have finite x, y, z number properties',
      path,
      value: position,
    });
  }

  return errors.length > 0 ? failure(errors) : success();
}

// =============================================================================
// Node Validation
// =============================================================================

/**
 * Validates node metadata
 */
export function validateNodeMetadata(
  metadata: unknown,
  path: string
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (typeof metadata !== 'object' || metadata === null) {
    errors.push({
      code: 'INVALID_METADATA',
      message: 'Metadata must be an object',
      path,
      value: metadata,
    });
    return failure(errors);
  }

  const meta = metadata as Record<string, unknown>;

  // Required: label
  if (typeof meta['label'] !== 'string' || meta['label'].length === 0) {
    errors.push({
      code: 'MISSING_LABEL',
      message: 'Node metadata must have a non-empty label',
      path: `${path}.label`,
      value: meta['label'],
    });
  }

  // Required: path
  if (typeof meta['path'] !== 'string' || meta['path'].length === 0) {
    errors.push({
      code: 'MISSING_PATH',
      message: 'Node metadata must have a non-empty path',
      path: `${path}.path`,
      value: meta['path'],
    });
  }

  // Optional: loc (if present, must be non-negative integer)
  if (meta['loc'] !== undefined) {
    if (typeof meta['loc'] !== 'number' || meta['loc'] < 0 || !Number.isInteger(meta['loc'])) {
      warnings.push({
        code: 'INVALID_LOC',
        message: 'Lines of code should be a non-negative integer',
        path: `${path}.loc`,
        value: meta['loc'],
      });
    }
  }

  // Optional: complexity (if present, must be non-negative)
  if (meta['complexity'] !== undefined) {
    if (typeof meta['complexity'] !== 'number' || meta['complexity'] < 0) {
      warnings.push({
        code: 'INVALID_COMPLEXITY',
        message: 'Complexity should be a non-negative number',
        path: `${path}.complexity`,
        value: meta['complexity'],
      });
    }
  }

  return errors.length > 0 ? failure(errors, warnings) : { valid: true, errors: [], warnings };
}

/**
 * Validates a single IVM node
 */
export function validateNode(node: unknown, path: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (typeof node !== 'object' || node === null) {
    errors.push({
      code: 'INVALID_NODE',
      message: 'Node must be an object',
      path,
      value: node,
    });
    return failure(errors);
  }

  const n = node as Record<string, unknown>;

  // Required: id
  if (typeof n['id'] !== 'string' || n['id'].length === 0) {
    errors.push({
      code: 'MISSING_ID',
      message: 'Node must have a non-empty id',
      path: `${path}.id`,
      value: n['id'],
    });
  }

  // Required: type
  if (!isValidNodeType(n['type'])) {
    errors.push({
      code: 'INVALID_NODE_TYPE',
      message: `Node type must be one of: ${VALID_NODE_TYPES.join(', ')}`,
      path: `${path}.type`,
      value: n['type'],
    });
  }

  // Required: position
  const positionResult = validatePosition(n['position'], `${path}.position`);
  errors.push(...positionResult.errors);
  warnings.push(...positionResult.warnings);

  // Required: lod
  if (!isValidLODLevel(n['lod'])) {
    errors.push({
      code: 'INVALID_LOD',
      message: `LOD level must be one of: ${VALID_LOD_LEVELS.join(', ')}`,
      path: `${path}.lod`,
      value: n['lod'],
    });
  }

  // Required: metadata
  const metadataResult = validateNodeMetadata(n['metadata'], `${path}.metadata`);
  errors.push(...metadataResult.errors);
  warnings.push(...metadataResult.warnings);

  // Optional: parentId (if present, must be string)
  if (n['parentId'] !== undefined && typeof n['parentId'] !== 'string') {
    errors.push({
      code: 'INVALID_PARENT_ID',
      message: 'Parent ID must be a string',
      path: `${path}.parentId`,
      value: n['parentId'],
    });
  }

  return errors.length > 0 ? failure(errors, warnings) : { valid: true, errors: [], warnings };
}

// =============================================================================
// Edge Validation
// =============================================================================

/**
 * Validates a single IVM edge
 */
export function validateEdge(
  edge: unknown,
  path: string,
  nodeIds: Set<string>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (typeof edge !== 'object' || edge === null) {
    errors.push({
      code: 'INVALID_EDGE',
      message: 'Edge must be an object',
      path,
      value: edge,
    });
    return failure(errors);
  }

  const e = edge as Record<string, unknown>;

  // Required: id
  if (typeof e['id'] !== 'string' || e['id'].length === 0) {
    errors.push({
      code: 'MISSING_ID',
      message: 'Edge must have a non-empty id',
      path: `${path}.id`,
      value: e['id'],
    });
  }

  // Required: source
  if (typeof e['source'] !== 'string' || e['source'].length === 0) {
    errors.push({
      code: 'MISSING_SOURCE',
      message: 'Edge must have a non-empty source',
      path: `${path}.source`,
      value: e['source'],
    });
  } else if (!nodeIds.has(e['source'])) {
    errors.push({
      code: 'INVALID_SOURCE',
      message: `Edge source references non-existent node: ${e['source']}`,
      path: `${path}.source`,
      value: e['source'],
    });
  }

  // Required: target
  if (typeof e['target'] !== 'string' || e['target'].length === 0) {
    errors.push({
      code: 'MISSING_TARGET',
      message: 'Edge must have a non-empty target',
      path: `${path}.target`,
      value: e['target'],
    });
  } else if (!nodeIds.has(e['target'])) {
    errors.push({
      code: 'INVALID_TARGET',
      message: `Edge target references non-existent node: ${e['target']}`,
      path: `${path}.target`,
      value: e['target'],
    });
  }

  // Required: type
  if (!isValidEdgeType(e['type'])) {
    errors.push({
      code: 'INVALID_EDGE_TYPE',
      message: `Edge type must be one of: ${VALID_EDGE_TYPES.join(', ')}`,
      path: `${path}.type`,
      value: e['type'],
    });
  }

  // Required: lod
  if (!isValidLODLevel(e['lod'])) {
    errors.push({
      code: 'INVALID_LOD',
      message: `LOD level must be one of: ${VALID_LOD_LEVELS.join(', ')}`,
      path: `${path}.lod`,
      value: e['lod'],
    });
  }

  // Warning: self-referential edge
  if (e['source'] === e['target']) {
    warnings.push({
      code: 'SELF_REFERENCE',
      message: 'Edge references the same node as source and target',
      path,
    });
  }

  return errors.length > 0 ? failure(errors, warnings) : { valid: true, errors: [], warnings };
}

// =============================================================================
// Graph Validation
// =============================================================================

/**
 * Validates graph metadata
 */
export function validateGraphMetadata(
  metadata: unknown,
  path: string
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (typeof metadata !== 'object' || metadata === null) {
    errors.push({
      code: 'INVALID_METADATA',
      message: 'Graph metadata must be an object',
      path,
      value: metadata,
    });
    return failure(errors);
  }

  const meta = metadata as Record<string, unknown>;

  // Required: name
  if (typeof meta['name'] !== 'string' || meta['name'].length === 0) {
    errors.push({
      code: 'MISSING_NAME',
      message: 'Graph metadata must have a non-empty name',
      path: `${path}.name`,
      value: meta['name'],
    });
  }

  // Required: schemaVersion
  if (typeof meta['schemaVersion'] !== 'string') {
    errors.push({
      code: 'MISSING_SCHEMA_VERSION',
      message: 'Graph metadata must have a schemaVersion',
      path: `${path}.schemaVersion`,
      value: meta['schemaVersion'],
    });
  } else if (meta['schemaVersion'] !== IVM_SCHEMA_VERSION) {
    warnings.push({
      code: 'VERSION_MISMATCH',
      message: `Schema version ${meta['schemaVersion']} differs from current version ${IVM_SCHEMA_VERSION}`,
      path: `${path}.schemaVersion`,
      value: meta['schemaVersion'],
    });
  }

  // Required: generatedAt
  if (typeof meta['generatedAt'] !== 'string') {
    errors.push({
      code: 'MISSING_GENERATED_AT',
      message: 'Graph metadata must have a generatedAt timestamp',
      path: `${path}.generatedAt`,
      value: meta['generatedAt'],
    });
  }

  // Required: rootPath
  if (typeof meta['rootPath'] !== 'string' || meta['rootPath'].length === 0) {
    errors.push({
      code: 'MISSING_ROOT_PATH',
      message: 'Graph metadata must have a non-empty rootPath',
      path: `${path}.rootPath`,
      value: meta['rootPath'],
    });
  }

  // Required: stats
  if (typeof meta['stats'] !== 'object' || meta['stats'] === null) {
    errors.push({
      code: 'MISSING_STATS',
      message: 'Graph metadata must have stats',
      path: `${path}.stats`,
      value: meta['stats'],
    });
  }

  return errors.length > 0 ? failure(errors, warnings) : { valid: true, errors: [], warnings };
}

/**
 * Validates a complete IVM graph
 */
export function validateGraph(graph: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (typeof graph !== 'object' || graph === null) {
    errors.push({
      code: 'INVALID_GRAPH',
      message: 'Graph must be an object',
      path: '',
      value: graph,
    });
    return failure(errors);
  }

  const g = graph as Record<string, unknown>;

  // Validate nodes array
  if (!Array.isArray(g['nodes'])) {
    errors.push({
      code: 'INVALID_NODES',
      message: 'Graph must have a nodes array',
      path: 'nodes',
      value: g['nodes'],
    });
  } else {
    // Collect node IDs for edge validation
    const nodeIds = new Set<string>();
    const duplicateIds = new Set<string>();

    for (let i = 0; i < g['nodes'].length; i++) {
      const node = g['nodes'][i] as Record<string, unknown>;
      const nodeResult = validateNode(node, `nodes[${i}]`);
      errors.push(...nodeResult.errors);
      warnings.push(...nodeResult.warnings);

      if (typeof node['id'] === 'string') {
        if (nodeIds.has(node['id'])) {
          duplicateIds.add(node['id']);
        }
        nodeIds.add(node['id']);
      }
    }

    // Check for duplicate node IDs
    if (duplicateIds.size > 0) {
      errors.push({
        code: 'DUPLICATE_NODE_IDS',
        message: `Duplicate node IDs found: ${[...duplicateIds].join(', ')}`,
        path: 'nodes',
        value: [...duplicateIds],
      });
    }

    // Validate edges array
    if (!Array.isArray(g['edges'])) {
      errors.push({
        code: 'INVALID_EDGES',
        message: 'Graph must have an edges array',
        path: 'edges',
        value: g['edges'],
      });
    } else {
      const edgeIds = new Set<string>();
      const duplicateEdgeIds = new Set<string>();

      for (let i = 0; i < g['edges'].length; i++) {
        const edge = g['edges'][i] as Record<string, unknown>;
        const edgeResult = validateEdge(edge, `edges[${i}]`, nodeIds);
        errors.push(...edgeResult.errors);
        warnings.push(...edgeResult.warnings);

        if (typeof edge['id'] === 'string') {
          if (edgeIds.has(edge['id'])) {
            duplicateEdgeIds.add(edge['id']);
          }
          edgeIds.add(edge['id']);
        }
      }

      // Check for duplicate edge IDs
      if (duplicateEdgeIds.size > 0) {
        errors.push({
          code: 'DUPLICATE_EDGE_IDS',
          message: `Duplicate edge IDs found: ${[...duplicateEdgeIds].join(', ')}`,
          path: 'edges',
          value: [...duplicateEdgeIds],
        });
      }
    }

    // Validate parent references
    const nodes = g['nodes'] as IVMNode[];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node?.parentId !== undefined && !nodeIds.has(node.parentId)) {
        errors.push({
          code: 'INVALID_PARENT_REFERENCE',
          message: `Node references non-existent parent: ${node.parentId}`,
          path: `nodes[${i}].parentId`,
          value: node.parentId,
        });
      }
    }
  }

  // Validate metadata
  const metadataResult = validateGraphMetadata(g['metadata'], 'metadata');
  errors.push(...metadataResult.errors);
  warnings.push(...metadataResult.warnings);

  // Validate bounds
  if (typeof g['bounds'] !== 'object' || g['bounds'] === null) {
    errors.push({
      code: 'MISSING_BOUNDS',
      message: 'Graph must have bounds',
      path: 'bounds',
      value: g['bounds'],
    });
  } else {
    const bounds = g['bounds'] as Record<string, unknown>;
    const minResult = validatePosition(bounds['min'], 'bounds.min');
    const maxResult = validatePosition(bounds['max'], 'bounds.max');
    errors.push(...minResult.errors, ...maxResult.errors);
    warnings.push(...minResult.warnings, ...maxResult.warnings);
  }

  return errors.length > 0 ? failure(errors, warnings) : { valid: true, errors: [], warnings };
}

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Validates a graph and throws if invalid
 */
export function assertValidGraph(graph: unknown): asserts graph is IVMGraph {
  const result = validateGraph(graph);
  if (!result.valid) {
    const errorMessages = result.errors.map((e) => `${e.path}: ${e.message}`).join('\n');
    throw new Error(`Invalid IVM graph:\n${errorMessages}`);
  }
}

/**
 * Validates a node and throws if invalid
 */
export function assertValidNode(node: unknown): asserts node is IVMNode {
  const result = validateNode(node, 'node');
  if (!result.valid) {
    const errorMessages = result.errors.map((e) => `${e.path}: ${e.message}`).join('\n');
    throw new Error(`Invalid IVM node:\n${errorMessages}`);
  }
}

/**
 * Validates an edge and throws if invalid
 */
export function assertValidEdge(edge: unknown, nodeIds: Set<string>): asserts edge is IVMEdge {
  const result = validateEdge(edge, 'edge', nodeIds);
  if (!result.valid) {
    const errorMessages = result.errors.map((e) => `${e.path}: ${e.message}`).join('\n');
    throw new Error(`Invalid IVM edge:\n${errorMessages}`);
  }
}
