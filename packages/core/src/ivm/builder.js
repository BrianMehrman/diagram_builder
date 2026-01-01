import { IVM_SCHEMA_VERSION, DEFAULT_LOD, } from './types.js';
export function generateEdgeId(source, target, type) {
    return `${source}--${type}-->${target}`;
}
export function generateId(prefix = 'node') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
const NODE_TYPE_LOD = {
    repository: 0,
    package: 1,
    namespace: 1,
    directory: 2,
    module: 2,
    file: 3,
    class: 4,
    interface: 4,
    enum: 4,
    function: 4,
    type: 5,
    method: 5,
    variable: 5,
};
export function assignLOD(nodeType) {
    return NODE_TYPE_LOD[nodeType] ?? DEFAULT_LOD;
}
export function assignEdgeLOD(sourceLod, targetLod) {
    return Math.max(sourceLod, targetLod);
}
export function createDefaultPosition() {
    return { x: 0, y: 0, z: 0 };
}
export function assignInitialPositions(nodes, spacing = 100) {
    const gridSize = Math.ceil(Math.sqrt(nodes.length));
    nodes.forEach((node, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        node.position = {
            x: col * spacing - (gridSize * spacing) / 2,
            y: 0,
            z: row * spacing - (gridSize * spacing) / 2,
        };
    });
}
export function assignHierarchicalPositions(nodes, horizontalSpacing = 100, verticalSpacing = 50) {
    const rootNodes = nodes.filter((n) => !n.parentId);
    const processed = new Set();
    function positionNode(node, x, y, z) {
        if (processed.has(node.id))
            return;
        processed.add(node.id);
        node.position = { x, y, z };
        const children = nodes.filter((n) => n.parentId === node.id);
        const childWidth = children.length * horizontalSpacing;
        children.forEach((child, index) => {
            const childX = x - childWidth / 2 + index * horizontalSpacing + horizontalSpacing / 2;
            positionNode(child, childX, y - verticalSpacing, z);
        });
    }
    const rootWidth = rootNodes.length * horizontalSpacing * 2;
    rootNodes.forEach((root, index) => {
        const rootX = -rootWidth / 2 + index * horizontalSpacing * 2 + horizontalSpacing;
        positionNode(root, rootX, 0, 0);
    });
}
export function calculateBounds(nodes) {
    if (nodes.length === 0) {
        return {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 0, y: 0, z: 0 },
        };
    }
    const min = {
        x: Number.POSITIVE_INFINITY,
        y: Number.POSITIVE_INFINITY,
        z: Number.POSITIVE_INFINITY,
    };
    const max = {
        x: Number.NEGATIVE_INFINITY,
        y: Number.NEGATIVE_INFINITY,
        z: Number.NEGATIVE_INFINITY,
    };
    for (const node of nodes) {
        min.x = Math.min(min.x, node.position.x);
        min.y = Math.min(min.y, node.position.y);
        min.z = Math.min(min.z, node.position.z);
        max.x = Math.max(max.x, node.position.x);
        max.y = Math.max(max.y, node.position.y);
        max.z = Math.max(max.z, node.position.z);
    }
    return { min, max };
}
export function calculateStats(nodes, edges) {
    const nodesByType = {};
    const edgesByType = {};
    let totalLoc = 0;
    let complexitySum = 0;
    let complexityCount = 0;
    for (const node of nodes) {
        nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
        if (node.metadata.loc !== undefined) {
            totalLoc += node.metadata.loc;
        }
        if (node.metadata.complexity !== undefined) {
            complexitySum += node.metadata.complexity;
            complexityCount++;
        }
    }
    for (const edge of edges) {
        edgesByType[edge.type] = (edgesByType[edge.type] || 0) + 1;
    }
    return {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        nodesByType,
        edgesByType,
        ...(totalLoc > 0 && { totalLoc }),
        ...(complexityCount > 0 && { avgComplexity: complexitySum / complexityCount }),
    };
}
export function createNode(input) {
    return {
        id: input.id,
        type: input.type,
        position: createDefaultPosition(),
        lod: assignLOD(input.type),
        ...(input.parentId && { parentId: input.parentId }),
        metadata: input.metadata,
        ...(input.style && { style: input.style }),
    };
}
export function createNodes(inputs) {
    return inputs.map(createNode);
}
export function createEdge(input, nodeMap) {
    const sourceNode = nodeMap.get(input.source);
    const targetNode = nodeMap.get(input.target);
    const sourceLod = sourceNode?.lod ?? DEFAULT_LOD;
    const targetLod = targetNode?.lod ?? DEFAULT_LOD;
    const edge = {
        id: input.id ?? generateEdgeId(input.source, input.target, input.type),
        source: input.source,
        target: input.target,
        type: input.type,
        lod: assignEdgeLOD(sourceLod, targetLod),
        metadata: input.metadata ?? {},
    };
    if (input.style !== undefined) {
        edge.style = input.style;
    }
    return edge;
}
export function createEdges(inputs, nodeMap) {
    return inputs.map((input) => createEdge(input, nodeMap));
}
export function buildGraph(input, options = {}) {
    const { assignPositions = true, positionStrategy = 'grid', spacing = 100 } = options;
    const nodes = createNodes(input.nodes);
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    for (const edgeInput of input.edges) {
        const sourceNode = nodeMap.get(edgeInput.source);
        const targetNode = nodeMap.get(edgeInput.target);
        if (sourceNode) {
            sourceNode.metadata.dependencyCount = (sourceNode.metadata.dependencyCount ?? 0) + 1;
        }
        if (targetNode) {
            targetNode.metadata.dependentCount = (targetNode.metadata.dependentCount ?? 0) + 1;
        }
    }
    const edges = createEdges(input.edges, nodeMap);
    if (assignPositions) {
        if (positionStrategy === 'hierarchical') {
            assignHierarchicalPositions(nodes, spacing, spacing / 2);
        }
        else {
            assignInitialPositions(nodes, spacing);
        }
    }
    const bounds = calculateBounds(nodes);
    const stats = calculateStats(nodes, edges);
    const languages = [
        ...new Set(nodes.map((n) => n.metadata.language).filter((l) => l !== undefined)),
    ];
    const metadata = {
        ...input.metadata,
        schemaVersion: IVM_SCHEMA_VERSION,
        generatedAt: new Date().toISOString(),
        stats,
        languages,
    };
    return {
        nodes,
        edges,
        metadata,
        bounds,
    };
}
export function addNode(graph, input) {
    const node = createNode(input);
    const nodes = [...graph.nodes, node];
    const bounds = calculateBounds(nodes);
    const stats = calculateStats(nodes, graph.edges);
    return {
        ...graph,
        nodes,
        bounds,
        metadata: {
            ...graph.metadata,
            stats,
        },
    };
}
export function addEdge(graph, input) {
    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
    const edge = createEdge(input, nodeMap);
    const edges = [...graph.edges, edge];
    const stats = calculateStats(graph.nodes, edges);
    return {
        ...graph,
        edges,
        metadata: {
            ...graph.metadata,
            stats,
        },
    };
}
export function removeNode(graph, nodeId) {
    const nodes = graph.nodes.filter((n) => n.id !== nodeId);
    const edges = graph.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    const bounds = calculateBounds(nodes);
    const stats = calculateStats(nodes, edges);
    return {
        ...graph,
        nodes,
        edges,
        bounds,
        metadata: {
            ...graph.metadata,
            stats,
        },
    };
}
export function removeEdge(graph, edgeId) {
    const edges = graph.edges.filter((e) => e.id !== edgeId);
    const stats = calculateStats(graph.nodes, edges);
    return {
        ...graph,
        edges,
        metadata: {
            ...graph.metadata,
            stats,
        },
    };
}
export function updateNode(graph, nodeId, updates) {
    const nodes = graph.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n));
    const bounds = calculateBounds(nodes);
    const stats = calculateStats(nodes, graph.edges);
    return {
        ...graph,
        nodes,
        bounds,
        metadata: {
            ...graph.metadata,
            stats,
        },
    };
}
export class IVMBuilder {
    nodes = [];
    edges = [];
    graphMetadata;
    constructor(name, rootPath) {
        this.graphMetadata = {
            name,
            rootPath,
            languages: [],
        };
    }
    withRepository(url, branch, commit) {
        this.graphMetadata.repositoryUrl = url;
        if (branch !== undefined) {
            this.graphMetadata.branch = branch;
        }
        if (commit !== undefined) {
            this.graphMetadata.commit = commit;
        }
        return this;
    }
    withProperties(properties) {
        this.graphMetadata.properties = {
            ...this.graphMetadata.properties,
            ...properties,
        };
        return this;
    }
    addNode(input) {
        this.nodes.push(input);
        return this;
    }
    addNodes(inputs) {
        this.nodes.push(...inputs);
        return this;
    }
    addEdge(input) {
        this.edges.push(input);
        return this;
    }
    addEdges(inputs) {
        this.edges.push(...inputs);
        return this;
    }
    build(options) {
        return buildGraph({
            nodes: this.nodes,
            edges: this.edges,
            metadata: this.graphMetadata,
        }, options);
    }
}
export function createBuilder(name, rootPath) {
    return new IVMBuilder(name, rootPath);
}
//# sourceMappingURL=builder.js.map