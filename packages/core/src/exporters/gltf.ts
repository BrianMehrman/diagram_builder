/**
 * GLTF Exporter
 *
 * Exports IVM graphs to GLTF (GL Transmission Format) for 3D model viewing.
 * Produces .gltf files compatible with Three.js, Babylon.js, and other 3D viewers.
 *
 * GLTF 2.0 Specification: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
 */

import type { IVMGraph, IVMNode, IVMEdge, NodeType, EdgeType, Position3D } from '../ivm/types.js';
import type {
  Exporter,
  BaseExportOptions,
  ExportResult,
  ExportStyling,
  ColorScheme,
} from './types.js';
import { DEFAULT_COLOR_SCHEME, DEFAULT_EXPORT_STYLING } from './types.js';
import { filterGraphByLOD } from '../layout/lod.js';

// =============================================================================
// GLTF Types (subset of full spec)
// =============================================================================

/**
 * GLTF Asset metadata
 */
interface GLTFAsset {
  version: string;
  generator: string;
  copyright?: string;
}

/**
 * GLTF Scene
 */
interface GLTFScene {
  name?: string;
  nodes?: number[];
}

/**
 * GLTF Node (transform node in scene graph)
 */
interface GLTFNode {
  name?: string;
  mesh?: number;
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
  children?: number[];
  extras?: Record<string, unknown>;
}

/**
 * GLTF Mesh
 */
interface GLTFMesh {
  name?: string;
  primitives: GLTFPrimitive[];
}

/**
 * GLTF Primitive (geometry + material)
 */
interface GLTFPrimitive {
  attributes: {
    POSITION: number;
    NORMAL?: number;
    COLOR_0?: number;
  };
  indices?: number;
  material?: number;
  mode?: number; // 4 = TRIANGLES (default)
}

/**
 * GLTF Accessor (typed view into buffer)
 */
interface GLTFAccessor {
  bufferView: number;
  byteOffset?: number;
  componentType: number;
  count: number;
  type: string;
  max?: number[];
  min?: number[];
}

/**
 * GLTF Buffer View
 */
interface GLTFBufferView {
  buffer: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
  target?: number;
}

/**
 * GLTF Buffer
 */
interface GLTFBuffer {
  uri?: string;
  byteLength: number;
}

/**
 * GLTF Material (PBR metallic-roughness)
 */
interface GLTFMaterial {
  name?: string;
  pbrMetallicRoughness?: {
    baseColorFactor?: [number, number, number, number];
    metallicFactor?: number;
    roughnessFactor?: number;
  };
  emissiveFactor?: [number, number, number];
  alphaMode?: 'OPAQUE' | 'MASK' | 'BLEND';
  alphaCutoff?: number;
  doubleSided?: boolean;
}

/**
 * Complete GLTF document
 */
interface GLTFDocument {
  asset: GLTFAsset;
  scene?: number;
  scenes?: GLTFScene[];
  nodes?: GLTFNode[];
  meshes?: GLTFMesh[];
  accessors?: GLTFAccessor[];
  bufferViews?: GLTFBufferView[];
  buffers?: GLTFBuffer[];
  materials?: GLTFMaterial[];
}

// =============================================================================
// GLTF-Specific Export Types
// =============================================================================

/**
 * Node shape for 3D representation
 */
export type GLTFNodeShape = 'sphere' | 'cube' | 'cylinder' | 'cone' | 'octahedron';

/**
 * GLTF export options
 */
export interface GLTFExportOptions extends BaseExportOptions {
  /** Scale factor for the entire scene */
  sceneScale?: number;

  /** Default node size */
  nodeSize?: number;

  /** Whether to include edges as line geometry */
  includeEdges?: boolean;

  /** Edge thickness (cylinder radius) */
  edgeThickness?: number;

  /** Whether to embed buffer data as base64 URI */
  embedBuffers?: boolean;

  /** Metallic factor for materials (0-1) */
  metallicFactor?: number;

  /** Roughness factor for materials (0-1) */
  roughnessFactor?: number;

  /** Whether to use emissive colors for highlighted nodes */
  useEmissive?: boolean;
}

/**
 * Default GLTF export options
 */
export const DEFAULT_GLTF_OPTIONS: Required<GLTFExportOptions> = {
  title: '',
  lodLevel: 5,
  includeLegend: false,
  includeMetadata: true,
  styling: DEFAULT_EXPORT_STYLING,
  sceneScale: 1.0,
  nodeSize: 0.5,
  includeEdges: true,
  edgeThickness: 0.05,
  embedBuffers: true,
  metallicFactor: 0.1,
  roughnessFactor: 0.8,
  useEmissive: true,
};

// =============================================================================
// Shape Mapping
// =============================================================================

/**
 * Maps IVM node types to 3D shapes
 */
const NODE_TYPE_TO_SHAPE: Record<NodeType, GLTFNodeShape> = {
  repository: 'octahedron',
  package: 'cube',
  namespace: 'cube',
  directory: 'cube',
  module: 'cube',
  file: 'cylinder',
  class: 'sphere',
  interface: 'octahedron',
  function: 'cone',
  method: 'cone',
  variable: 'cylinder',
  type: 'octahedron',
  enum: 'octahedron',
};

// =============================================================================
// Geometry Generation
// =============================================================================

/**
 * Generates sphere geometry data
 */
function generateSphereGeometry(
  radius: number,
  segments: number = 16
): { positions: number[]; normals: number[]; indices: number[] } {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Generate vertices
  for (let lat = 0; lat <= segments; lat++) {
    const theta = (lat * Math.PI) / segments;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= segments; lon++) {
      const phi = (lon * 2 * Math.PI) / segments;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;

      positions.push(radius * x, radius * y, radius * z);
      normals.push(x, y, z);
    }
  }

  // Generate indices
  for (let lat = 0; lat < segments; lat++) {
    for (let lon = 0; lon < segments; lon++) {
      const first = lat * (segments + 1) + lon;
      const second = first + segments + 1;

      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return { positions, normals, indices };
}

/**
 * Generates cube geometry data
 */
function generateCubeGeometry(
  size: number
): { positions: number[]; normals: number[]; indices: number[] } {
  const s = size / 2;
  
  // Positions for each face (6 faces * 4 vertices)
  const positions = [
    // Front face
    -s, -s, s, s, -s, s, s, s, s, -s, s, s,
    // Back face
    -s, -s, -s, -s, s, -s, s, s, -s, s, -s, -s,
    // Top face
    -s, s, -s, -s, s, s, s, s, s, s, s, -s,
    // Bottom face
    -s, -s, -s, s, -s, -s, s, -s, s, -s, -s, s,
    // Right face
    s, -s, -s, s, s, -s, s, s, s, s, -s, s,
    // Left face
    -s, -s, -s, -s, -s, s, -s, s, s, -s, s, -s,
  ];

  const normals = [
    // Front
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    // Back
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    // Top
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    // Bottom
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    // Right
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    // Left
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
  ];

  const indices: number[] = [];
  for (let i = 0; i < 6; i++) {
    const offset = i * 4;
    indices.push(
      offset, offset + 1, offset + 2,
      offset, offset + 2, offset + 3
    );
  }

  return { positions, normals, indices };
}

/**
 * Generates cylinder geometry data
 */
function generateCylinderGeometry(
  radius: number,
  height: number,
  segments: number = 16
): { positions: number[]; normals: number[]; indices: number[] } {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const halfHeight = height / 2;

  // Side vertices
  for (let i = 0; i <= segments; i++) {
    const angle = (i * 2 * Math.PI) / segments;
    const x = Math.cos(angle);
    const z = Math.sin(angle);

    // Bottom vertex
    positions.push(radius * x, -halfHeight, radius * z);
    normals.push(x, 0, z);

    // Top vertex
    positions.push(radius * x, halfHeight, radius * z);
    normals.push(x, 0, z);
  }

  // Side indices
  for (let i = 0; i < segments; i++) {
    const bottom1 = i * 2;
    const top1 = bottom1 + 1;
    const bottom2 = bottom1 + 2;
    const top2 = bottom1 + 3;

    indices.push(bottom1, bottom2, top1);
    indices.push(top1, bottom2, top2);
  }

  // Top cap center
  const topCenterIdx = positions.length / 3;
  positions.push(0, halfHeight, 0);
  normals.push(0, 1, 0);

  // Top cap vertices
  for (let i = 0; i <= segments; i++) {
    const angle = (i * 2 * Math.PI) / segments;
    positions.push(radius * Math.cos(angle), halfHeight, radius * Math.sin(angle));
    normals.push(0, 1, 0);
  }

  // Top cap indices
  for (let i = 0; i < segments; i++) {
    indices.push(topCenterIdx, topCenterIdx + i + 1, topCenterIdx + i + 2);
  }

  // Bottom cap center
  const bottomCenterIdx = positions.length / 3;
  positions.push(0, -halfHeight, 0);
  normals.push(0, -1, 0);

  // Bottom cap vertices
  for (let i = 0; i <= segments; i++) {
    const angle = (i * 2 * Math.PI) / segments;
    positions.push(radius * Math.cos(angle), -halfHeight, radius * Math.sin(angle));
    normals.push(0, -1, 0);
  }

  // Bottom cap indices (reversed winding)
  for (let i = 0; i < segments; i++) {
    indices.push(bottomCenterIdx, bottomCenterIdx + i + 2, bottomCenterIdx + i + 1);
  }

  return { positions, normals, indices };
}

/**
 * Generates cone geometry data
 */
function generateConeGeometry(
  radius: number,
  height: number,
  segments: number = 16
): { positions: number[]; normals: number[]; indices: number[] } {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const halfHeight = height / 2;

  // Apex
  const apexIdx = 0;
  positions.push(0, halfHeight, 0);
  normals.push(0, 1, 0);

  // Base vertices
  for (let i = 0; i <= segments; i++) {
    const angle = (i * 2 * Math.PI) / segments;
    const x = Math.cos(angle);
    const z = Math.sin(angle);

    positions.push(radius * x, -halfHeight, radius * z);
    // Approximate normal for cone side
    const nx = x;
    const ny = radius / height;
    const nz = z;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    normals.push(nx / len, ny / len, nz / len);
  }

  // Side indices
  for (let i = 0; i < segments; i++) {
    indices.push(apexIdx, i + 1, i + 2);
  }

  // Base cap center
  const baseCenterIdx = positions.length / 3;
  positions.push(0, -halfHeight, 0);
  normals.push(0, -1, 0);

  // Base cap vertices
  for (let i = 0; i <= segments; i++) {
    const angle = (i * 2 * Math.PI) / segments;
    positions.push(radius * Math.cos(angle), -halfHeight, radius * Math.sin(angle));
    normals.push(0, -1, 0);
  }

  // Base cap indices
  for (let i = 0; i < segments; i++) {
    indices.push(baseCenterIdx, baseCenterIdx + i + 2, baseCenterIdx + i + 1);
  }

  return { positions, normals, indices };
}

/**
 * Generates octahedron geometry data
 */
function generateOctahedronGeometry(
  size: number
): { positions: number[]; normals: number[]; indices: number[] } {
  const s = size;

  // 6 vertices
  const vertices = [
    [0, s, 0],   // top
    [s, 0, 0],   // right
    [0, 0, s],   // front
    [-s, 0, 0],  // left
    [0, 0, -s],  // back
    [0, -s, 0],  // bottom
  ];

  // 8 faces (indices into vertices)
  const faces = [
    [0, 2, 1], [0, 3, 2], [0, 4, 3], [0, 1, 4], // top 4
    [5, 1, 2], [5, 2, 3], [5, 3, 4], [5, 4, 1], // bottom 4
  ];

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  faces.forEach((face, faceIdx) => {
    const v0 = vertices[face[0]];
    const v1 = vertices[face[1]];
    const v2 = vertices[face[2]];

    // Calculate face normal
    const ax = v1[0] - v0[0], ay = v1[1] - v0[1], az = v1[2] - v0[2];
    const bx = v2[0] - v0[0], by = v2[1] - v0[1], bz = v2[2] - v0[2];
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

    const baseIdx = faceIdx * 3;
    face.forEach((vertIdx) => {
      const v = vertices[vertIdx];
      positions.push(v[0], v[1], v[2]);
      normals.push(nx / len, ny / len, nz / len);
    });

    indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
  });

  return { positions, normals, indices };
}

/**
 * Gets geometry for a shape
 */
function getShapeGeometry(
  shape: GLTFNodeShape,
  size: number
): { positions: number[]; normals: number[]; indices: number[] } {
  switch (shape) {
    case 'sphere':
      return generateSphereGeometry(size / 2, 12);
    case 'cube':
      return generateCubeGeometry(size);
    case 'cylinder':
      return generateCylinderGeometry(size / 2, size, 12);
    case 'cone':
      return generateConeGeometry(size / 2, size, 12);
    case 'octahedron':
      return generateOctahedronGeometry(size / 2);
    default:
      return generateSphereGeometry(size / 2, 12);
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Converts hex color to RGBA array (0-1 range)
 */
function hexToRGBA(hex: string, alpha: number = 1.0): [number, number, number, number] {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return [r, g, b, alpha];
}

/**
 * Gets the color for a node type
 */
function getNodeColor(type: NodeType, colors: ColorScheme): string {
  return colors.nodeColors[type] ?? '#FFFFFF';
}

/**
 * Gets the color for an edge type
 */
function getEdgeColor(type: EdgeType, colors: ColorScheme): string {
  return colors.edgeColors[type] ?? '#666666';
}

/**
 * Encodes a Float32Array as base64 data URI
 */
function encodeBufferAsDataURI(data: ArrayBuffer): string {
  const bytes = new Uint8Array(data);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:application/octet-stream;base64,${btoa(binary)}`;
}

/**
 * Creates an edge cylinder between two points
 */
function createEdgeCylinder(
  from: Position3D,
  to: Position3D,
  radius: number
): { positions: number[]; normals: number[]; indices: number[]; translation: [number, number, number]; rotation: [number, number, number, number] } {
  // Calculate direction and length
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (length < 0.001) {
    return { positions: [], normals: [], indices: [], translation: [0, 0, 0], rotation: [0, 0, 0, 1] };
  }

  // Generate cylinder geometry (along Y axis)
  const geometry = generateCylinderGeometry(radius, length, 8);

  // Calculate midpoint for translation
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const midZ = (from.z + to.z) / 2;

  // Calculate rotation quaternion to align Y-axis with direction
  const dirX = dx / length;
  const dirY = dy / length;
  const dirZ = dz / length;

  // Default up vector is Y (0, 1, 0)
  // We need to rotate from Y to direction vector
  const axis = [-dirZ, 0, dirX]; // Cross product of (0,1,0) and direction
  const axisLen = Math.sqrt(axis[0] * axis[0] + axis[2] * axis[2]);
  
  let rotation: [number, number, number, number];
  if (axisLen < 0.001) {
    // Direction is parallel to Y
    if (dirY > 0) {
      rotation = [0, 0, 0, 1]; // No rotation
    } else {
      rotation = [1, 0, 0, 0]; // 180 degree rotation around X
    }
  } else {
    const angle = Math.acos(dirY);
    const s = Math.sin(angle / 2);
    rotation = [
      (axis[0] / axisLen) * s,
      (axis[1] / axisLen) * s,
      (axis[2] / axisLen) * s,
      Math.cos(angle / 2),
    ];
  }

  return {
    ...geometry,
    translation: [midX, midY, midZ],
    rotation,
  };
}

// =============================================================================
// GLTF Builder
// =============================================================================

/**
 * Builds a GLTF document from IVM data
 */
function buildGLTFDocument(
  nodes: IVMNode[],
  edges: IVMEdge[],
  options: Required<GLTFExportOptions>,
  colors: ColorScheme,
  graphName: string
): GLTFDocument {
  const { sceneScale, nodeSize, includeEdges, edgeThickness, embedBuffers, metallicFactor, roughnessFactor, useEmissive } = options;

  const gltf: GLTFDocument = {
    asset: {
      version: '2.0',
      generator: 'diagram-builder GLTF Exporter',
    },
    scene: 0,
    scenes: [{ name: graphName, nodes: [] }],
    nodes: [],
    meshes: [],
    accessors: [],
    bufferViews: [],
    buffers: [],
    materials: [],
  };

  // Collect all buffer data
  const allPositions: number[] = [];
  const allNormals: number[] = [];
  const allIndices: number[] = [];
  let positionOffset = 0;
  let normalOffset = 0;
  let indexOffset = 0;

  // Material cache (by color)
  const materialCache = new Map<string, number>();

  function getOrCreateMaterial(color: string, highlighted: boolean = false): number {
    const key = `${color}-${highlighted}`;
    if (materialCache.has(key)) {
      return materialCache.get(key)!;
    }

    const rgba = hexToRGBA(color);
    const material: GLTFMaterial = {
      name: `material-${gltf.materials!.length}`,
      pbrMetallicRoughness: {
        baseColorFactor: rgba,
        metallicFactor,
        roughnessFactor,
      },
      doubleSided: true,
    };

    if (useEmissive && highlighted) {
      material.emissiveFactor = [rgba[0] * 0.3, rgba[1] * 0.3, rgba[2] * 0.3];
    }

    const idx = gltf.materials!.length;
    gltf.materials!.push(material);
    materialCache.set(key, idx);
    return idx;
  }

  // Process each node
  const nodeIdToGLTFIdx = new Map<string, number>();

  for (const node of nodes) {
    const shape = NODE_TYPE_TO_SHAPE[node.type];
    const size = (node.style?.size ?? 1) * nodeSize * sceneScale;
    const color = node.style?.color ?? getNodeColor(node.type, colors);
    const highlighted = node.style?.highlighted ?? false;

    // Generate geometry
    const geometry = getShapeGeometry(shape, size);
    
    // Record buffer offsets
    const posStart = allPositions.length / 3;
    const idxStart = allIndices.length;
    
    // Add geometry data
    allPositions.push(...geometry.positions);
    allNormals.push(...geometry.normals);
    
    // Offset indices
    const offsetIndices = geometry.indices.map(i => i + posStart);
    allIndices.push(...offsetIndices);

    // Create mesh
    const meshIdx = gltf.meshes!.length;
    gltf.meshes!.push({
      name: `mesh-${node.id}`,
      primitives: [{
        attributes: {
          POSITION: -1, // Will be set later
          NORMAL: -1,
        },
        indices: -1,
        material: getOrCreateMaterial(color, highlighted),
      }],
    });

    // Create GLTF node
    const gltfNodeIdx = gltf.nodes!.length;
    nodeIdToGLTFIdx.set(node.id, gltfNodeIdx);
    
    gltf.nodes!.push({
      name: node.metadata.label,
      mesh: meshIdx,
      translation: [
        node.position.x * sceneScale,
        node.position.y * sceneScale,
        node.position.z * sceneScale,
      ],
      extras: {
        ivmId: node.id,
        ivmType: node.type,
        lod: node.lod,
      },
    });

    gltf.scenes![0].nodes!.push(gltfNodeIdx);
  }

  // Process edges if enabled
  if (includeEdges) {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    for (const edge of edges) {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);
      
      if (!sourceNode || !targetNode) continue;

      const edgeColor = getEdgeColor(edge.type, colors);
      const edgeGeometry = createEdgeCylinder(
        {
          x: sourceNode.position.x * sceneScale,
          y: sourceNode.position.y * sceneScale,
          z: sourceNode.position.z * sceneScale,
        },
        {
          x: targetNode.position.x * sceneScale,
          y: targetNode.position.y * sceneScale,
          z: targetNode.position.z * sceneScale,
        },
        edgeThickness * sceneScale
      );

      if (edgeGeometry.positions.length === 0) continue;

      // Record buffer offsets
      const posStart = allPositions.length / 3;
      
      // Add geometry data
      allPositions.push(...edgeGeometry.positions);
      allNormals.push(...edgeGeometry.normals);
      
      const offsetIndices = edgeGeometry.indices.map(i => i + posStart);
      allIndices.push(...offsetIndices);

      // Create mesh for edge
      const meshIdx = gltf.meshes!.length;
      gltf.meshes!.push({
        name: `edge-${edge.id}`,
        primitives: [{
          attributes: {
            POSITION: -1,
            NORMAL: -1,
          },
          indices: -1,
          material: getOrCreateMaterial(edgeColor),
        }],
      });

      // Create GLTF node for edge
      const gltfNodeIdx = gltf.nodes!.length;
      gltf.nodes!.push({
        name: `edge-${edge.source}-${edge.target}`,
        mesh: meshIdx,
        translation: edgeGeometry.translation,
        rotation: edgeGeometry.rotation,
        extras: {
          ivmEdgeId: edge.id,
          ivmEdgeType: edge.type,
          source: edge.source,
          target: edge.target,
        },
      });

      gltf.scenes![0].nodes!.push(gltfNodeIdx);
    }
  }

  // Create combined buffer
  const positionData = new Float32Array(allPositions);
  const normalData = new Float32Array(allNormals);
  const indexData = new Uint16Array(allIndices);

  const positionBytes = positionData.byteLength;
  const normalBytes = normalData.byteLength;
  const indexBytes = indexData.byteLength;
  const totalBytes = positionBytes + normalBytes + indexBytes;

  // Create combined buffer
  const combinedBuffer = new ArrayBuffer(totalBytes);
  const combinedView = new Uint8Array(combinedBuffer);
  
  combinedView.set(new Uint8Array(positionData.buffer), 0);
  combinedView.set(new Uint8Array(normalData.buffer), positionBytes);
  combinedView.set(new Uint8Array(indexData.buffer), positionBytes + normalBytes);

  // Buffer
  gltf.buffers = [{
    byteLength: totalBytes,
    ...(embedBuffers ? { uri: encodeBufferAsDataURI(combinedBuffer) } : {}),
  }];

  // Buffer views
  gltf.bufferViews = [
    { buffer: 0, byteOffset: 0, byteLength: positionBytes, target: 34962 }, // ARRAY_BUFFER
    { buffer: 0, byteOffset: positionBytes, byteLength: normalBytes, target: 34962 },
    { buffer: 0, byteOffset: positionBytes + normalBytes, byteLength: indexBytes, target: 34963 }, // ELEMENT_ARRAY_BUFFER
  ];

  // Calculate bounds for position accessor
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < allPositions.length; i += 3) {
    minX = Math.min(minX, allPositions[i]);
    minY = Math.min(minY, allPositions[i + 1]);
    minZ = Math.min(minZ, allPositions[i + 2]);
    maxX = Math.max(maxX, allPositions[i]);
    maxY = Math.max(maxY, allPositions[i + 1]);
    maxZ = Math.max(maxZ, allPositions[i + 2]);
  }

  // Accessors
  gltf.accessors = [
    {
      bufferView: 0,
      componentType: 5126, // FLOAT
      count: allPositions.length / 3,
      type: 'VEC3',
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
    },
    {
      bufferView: 1,
      componentType: 5126, // FLOAT
      count: allNormals.length / 3,
      type: 'VEC3',
    },
    {
      bufferView: 2,
      componentType: 5123, // UNSIGNED_SHORT
      count: allIndices.length,
      type: 'SCALAR',
    },
  ];

  // Update mesh primitives with accessor indices
  for (const mesh of gltf.meshes!) {
    for (const primitive of mesh.primitives) {
      primitive.attributes.POSITION = 0;
      primitive.attributes.NORMAL = 1;
      primitive.indices = 2;
    }
  }

  return gltf;
}

// =============================================================================
// GLTFExporter Class
// =============================================================================

/**
 * GLTF 3D model exporter
 */
export class GLTFExporter implements Exporter<GLTFExportOptions> {
  readonly id = 'gltf';
  readonly name = 'GLTF';
  readonly extension = 'gltf';
  readonly mimeType = 'model/gltf+json';

  /**
   * Exports an IVM graph to GLTF format
   */
  export(graph: IVMGraph, options?: GLTFExportOptions): ExportResult {
    const startTime = Date.now();
    const opts = { ...DEFAULT_GLTF_OPTIONS, ...options };
    const styling = { ...DEFAULT_EXPORT_STYLING, ...opts.styling };
    const colors = { ...DEFAULT_COLOR_SCHEME, ...styling.colors };

    // Apply LOD filtering if needed
    let nodes = graph.nodes;
    let edges = graph.edges;

    if (opts.lodLevel !== undefined && opts.lodLevel < 5) {
      const filtered = filterGraphByLOD(graph, {
        currentLevel: opts.lodLevel,
        includeAncestors: true,
        collapseEdges: true,
        minNodesForLOD: 0,
      });
      nodes = filtered.visibleNodes;
      edges = filtered.visibleEdges;
    }

    // Filter edges to only include those where both source and target exist
    const nodeIds = new Set(nodes.map((n) => n.id));
    const validEdges = edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    // Build GLTF document
    const gltf = buildGLTFDocument(
      nodes,
      opts.includeEdges ? validEdges : [],
      opts,
      colors,
      opts.title || graph.metadata.name
    );

    // Serialize to JSON
    const content = JSON.stringify(gltf, null, 2);
    const duration = Date.now() - startTime;

    return {
      content,
      mimeType: this.mimeType,
      extension: this.extension,
      stats: {
        nodeCount: nodes.length,
        edgeCount: opts.includeEdges ? validEdges.length : 0,
        duration,
        size: Buffer.byteLength(content, 'utf-8'),
      },
    };
  }

  /**
   * Validates export options
   */
  validateOptions(options?: GLTFExportOptions): string[] {
    const errors: string[] = [];

    if (options) {
      if (options.lodLevel !== undefined && (options.lodLevel < 0 || options.lodLevel > 5)) {
        errors.push('lodLevel must be between 0 and 5');
      }

      if (options.sceneScale !== undefined && options.sceneScale <= 0) {
        errors.push('sceneScale must be greater than 0');
      }

      if (options.nodeSize !== undefined && options.nodeSize <= 0) {
        errors.push('nodeSize must be greater than 0');
      }

      if (options.edgeThickness !== undefined && options.edgeThickness <= 0) {
        errors.push('edgeThickness must be greater than 0');
      }

      if (options.metallicFactor !== undefined && (options.metallicFactor < 0 || options.metallicFactor > 1)) {
        errors.push('metallicFactor must be between 0 and 1');
      }

      if (options.roughnessFactor !== undefined && (options.roughnessFactor < 0 || options.roughnessFactor > 1)) {
        errors.push('roughnessFactor must be between 0 and 1');
      }
    }

    return errors;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Creates a new GLTFExporter instance
 */
export function createGLTFExporter(): GLTFExporter {
  return new GLTFExporter();
}

/**
 * Convenience function to export a graph to GLTF format
 */
export function exportToGLTF(graph: IVMGraph, options?: GLTFExportOptions): ExportResult {
  const exporter = new GLTFExporter();
  return exporter.export(graph, options);
}
