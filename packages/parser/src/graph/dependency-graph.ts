/**
 * Types of nodes in the dependency graph
 */
export type DependencyNodeType = 'file' | 'class' | 'function' | 'interface' | 'module'

/**
 * Types of edges in the dependency graph
 */
export type DependencyEdgeType = 'imports' | 'extends' | 'implements' | 'calls' | 'exports' | 'contains'

/**
 * Represents a node in the dependency graph
 */
export interface DependencyNode {
  /** Unique identifier for the node */
  id: string
  /** Type of the node */
  type: DependencyNodeType
  /** Display name */
  name: string
  /** File path or location */
  path: string
  /** Additional metadata */
  metadata: Record<string, unknown>
}

/**
 * Represents an edge in the dependency graph
 */
export interface DependencyEdge {
  /** Source node ID */
  source: string
  /** Target node ID */
  target: string
  /** Type of relationship */
  type: DependencyEdgeType
  /** Additional metadata */
  metadata: Record<string, unknown>
}

/**
 * Dependency graph data structure for storing code relationships
 */
export class DependencyGraph {
  private nodes: Map<string, DependencyNode>
  private edges: DependencyEdge[]

  constructor() {
    this.nodes = new Map()
    this.edges = []
  }

  /**
   * Adds a node to the graph
   *
   * @param node - Node to add
   */
  addNode(node: DependencyNode): void {
    this.nodes.set(node.id, node)
  }

  /**
   * Adds an edge to the graph
   *
   * @param edge - Edge to add
   */
  addEdge(edge: DependencyEdge): void {
    this.edges.push(edge)
  }

  /**
   * Gets a node by ID
   *
   * @param id - Node ID
   * @returns Node or undefined
   */
  getNode(id: string): DependencyNode | undefined {
    return this.nodes.get(id)
  }

  /**
   * Gets all nodes in the graph
   *
   * @returns Array of all nodes
   */
  getNodes(): DependencyNode[] {
    return Array.from(this.nodes.values())
  }

  /**
   * Gets all edges in the graph
   *
   * @returns Array of all edges
   */
  getEdges(): DependencyEdge[] {
    return this.edges
  }

  /**
   * Gets outgoing edges from a node
   *
   * @param nodeId - Source node ID
   * @returns Array of outgoing edges
   */
  getOutgoingEdges(nodeId: string): DependencyEdge[] {
    return this.edges.filter(edge => edge.source === nodeId)
  }

  /**
   * Gets incoming edges to a node
   *
   * @param nodeId - Target node ID
   * @returns Array of incoming edges
   */
  getIncomingEdges(nodeId: string): DependencyEdge[] {
    return this.edges.filter(edge => edge.target === nodeId)
  }

  /**
   * Gets all dependencies of a node (outgoing edge targets)
   *
   * @param nodeId - Node ID
   * @returns Array of dependency node IDs
   */
  getDependencies(nodeId: string): string[] {
    return this.getOutgoingEdges(nodeId).map(edge => edge.target)
  }

  /**
   * Gets all dependents of a node (incoming edge sources)
   *
   * @param nodeId - Node ID
   * @returns Array of dependent node IDs
   */
  getDependents(nodeId: string): string[] {
    return this.getIncomingEdges(nodeId).map(edge => edge.source)
  }

  /**
   * Removes a node and all associated edges
   *
   * @param nodeId - Node ID to remove
   */
  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId)
    this.edges = this.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
  }

  /**
   * Gets the number of nodes in the graph
   *
   * @returns Node count
   */
  getNodeCount(): number {
    return this.nodes.size
  }

  /**
   * Gets the number of edges in the graph
   *
   * @returns Edge count
   */
  getEdgeCount(): number {
    return this.edges.length
  }

  /**
   * Serializes the graph to JSON
   *
   * @returns JSON representation
   */
  toJSON(): { nodes: DependencyNode[]; edges: DependencyEdge[] } {
    return {
      nodes: this.getNodes(),
      edges: this.edges,
    }
  }

  /**
   * Deserializes a graph from JSON
   *
   * @param json - JSON representation
   * @returns Dependency graph
   */
  static fromJSON(json: { nodes: DependencyNode[]; edges: DependencyEdge[] }): DependencyGraph {
    const graph = new DependencyGraph()

    for (const node of json.nodes) {
      graph.addNode(node)
    }

    for (const edge of json.edges) {
      graph.addEdge(edge)
    }

    return graph
  }
}
