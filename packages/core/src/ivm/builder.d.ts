import { IVMGraph, IVMNode, IVMEdge, GraphInput, NodeInput, EdgeInput, GraphStats, BoundingBox, Position3D, NodeType, EdgeType, LODLevel } from './types.js';
export declare function generateEdgeId(source: string, target: string, type: EdgeType): string;
export declare function generateId(prefix?: string): string;
export declare function assignLOD(nodeType: NodeType): LODLevel;
export declare function assignEdgeLOD(sourceLod: LODLevel, targetLod: LODLevel): LODLevel;
export declare function createDefaultPosition(): Position3D;
export declare function assignInitialPositions(nodes: IVMNode[], spacing?: number): void;
export declare function assignHierarchicalPositions(nodes: IVMNode[], horizontalSpacing?: number, verticalSpacing?: number): void;
export declare function calculateBounds(nodes: IVMNode[]): BoundingBox;
export declare function calculateStats(nodes: IVMNode[], edges: IVMEdge[]): GraphStats;
export declare function createNode(input: NodeInput): IVMNode;
export declare function createNodes(inputs: NodeInput[]): IVMNode[];
export declare function createEdge(input: EdgeInput, nodeMap: Map<string, IVMNode>): IVMEdge;
export declare function createEdges(inputs: EdgeInput[], nodeMap: Map<string, IVMNode>): IVMEdge[];
export interface BuildOptions {
    assignPositions?: boolean;
    positionStrategy?: 'grid' | 'hierarchical';
    spacing?: number;
}
export declare function buildGraph(input: GraphInput, options?: BuildOptions): IVMGraph;
export declare function addNode(graph: IVMGraph, input: NodeInput): IVMGraph;
export declare function addEdge(graph: IVMGraph, input: EdgeInput): IVMGraph;
export declare function removeNode(graph: IVMGraph, nodeId: string): IVMGraph;
export declare function removeEdge(graph: IVMGraph, edgeId: string): IVMGraph;
export declare function updateNode(graph: IVMGraph, nodeId: string, updates: Partial<Omit<IVMNode, 'id'>>): IVMGraph;
export declare class IVMBuilder {
    private nodes;
    private edges;
    private graphMetadata;
    constructor(name: string, rootPath: string);
    withRepository(url: string, branch?: string, commit?: string): this;
    withProperties(properties: Record<string, unknown>): this;
    addNode(input: NodeInput): this;
    addNodes(inputs: NodeInput[]): this;
    addEdge(input: EdgeInput): this;
    addEdges(inputs: EdgeInput[]): this;
    build(options?: BuildOptions): IVMGraph;
}
export declare function createBuilder(name: string, rootPath: string): IVMBuilder;
//# sourceMappingURL=builder.d.ts.map