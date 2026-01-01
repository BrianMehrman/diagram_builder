export interface Position3D {
    x: number;
    y: number;
    z: number;
}
export interface Position2D {
    x: number;
    y: number;
}
export type NodeType = 'file' | 'directory' | 'module' | 'class' | 'interface' | 'function' | 'method' | 'variable' | 'type' | 'enum' | 'namespace' | 'package' | 'repository';
export type LODLevel = 0 | 1 | 2 | 3 | 4 | 5;
export interface NodeMetadata {
    label: string;
    path: string;
    language?: string;
    loc?: number;
    complexity?: number;
    dependencyCount?: number;
    dependentCount?: number;
    location?: {
        startLine: number;
        endLine: number;
        startColumn?: number;
        endColumn?: number;
    };
    properties?: Record<string, unknown>;
}
export interface IVMNode {
    id: string;
    type: NodeType;
    position: Position3D;
    lod: LODLevel;
    parentId?: string;
    metadata: NodeMetadata;
    style?: NodeStyle;
}
export interface NodeStyle {
    color?: string;
    size?: number;
    shape?: 'circle' | 'rectangle' | 'diamond' | 'hexagon' | 'ellipse';
    opacity?: number;
    highlighted?: boolean;
    selected?: boolean;
}
export type EdgeType = 'imports' | 'exports' | 'extends' | 'implements' | 'calls' | 'uses' | 'contains' | 'depends_on' | 'type_of' | 'returns' | 'parameter_of';
export interface EdgeMetadata {
    label?: string;
    weight?: number;
    circular?: boolean;
    reference?: string;
    properties?: Record<string, unknown>;
}
export interface IVMEdge {
    id: string;
    source: string;
    target: string;
    type: EdgeType;
    lod: LODLevel;
    metadata: EdgeMetadata;
    style?: EdgeStyle;
}
export interface EdgeStyle {
    color?: string;
    width?: number;
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    arrow?: boolean;
    arrowPosition?: number;
    opacity?: number;
    highlighted?: boolean;
}
export interface GraphMetadata {
    name: string;
    schemaVersion: string;
    generatedAt: string;
    rootPath: string;
    repositoryUrl?: string;
    branch?: string;
    commit?: string;
    stats: GraphStats;
    languages: string[];
    properties?: Record<string, unknown>;
}
export interface GraphStats {
    totalNodes: number;
    totalEdges: number;
    nodesByType: Record<NodeType, number>;
    edgesByType: Record<EdgeType, number>;
    totalLoc?: number;
    avgComplexity?: number;
}
export interface BoundingBox {
    min: Position3D;
    max: Position3D;
}
export interface IVMGraph {
    nodes: IVMNode[];
    edges: IVMEdge[];
    metadata: GraphMetadata;
    bounds: BoundingBox;
}
export interface NodeInput {
    id: string;
    type: NodeType;
    parentId?: string;
    metadata: NodeMetadata;
    style?: NodeStyle;
}
export interface EdgeInput {
    id?: string;
    source: string;
    target: string;
    type: EdgeType;
    metadata?: EdgeMetadata;
    style?: EdgeStyle;
}
export interface GraphInput {
    nodes: NodeInput[];
    edges: EdgeInput[];
    metadata: Omit<GraphMetadata, 'stats' | 'schemaVersion' | 'generatedAt'>;
}
export interface GraphFilter {
    nodeTypes?: NodeType[];
    edgeTypes?: EdgeType[];
    maxLod?: LODLevel;
    parentId?: string;
    pathPattern?: string;
    languages?: string[];
    bounds?: BoundingBox;
}
export interface LODOptions {
    level: LODLevel;
    includeAncestors?: boolean;
    filterEdges?: boolean;
}
export declare const IVM_SCHEMA_VERSION = "1.0.0";
export declare const DEFAULT_LOD: LODLevel;
export declare const LOD_DESCRIPTIONS: Record<LODLevel, string>;
//# sourceMappingURL=types.d.ts.map