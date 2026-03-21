/**
 * useFocusedConnections Hook
 *
 * Derives the 1-hop and 2-hop connection sets for the currently selected node.
 * Used to drive focus-mode opacity and edge highlighting in CityView.
 */
import { useMemo } from 'react'
import { useCanvasStore } from '../store'
import type { IVMGraph, IVMEdge } from '../../../shared/types'

export interface FocusedConnectionsResult {
  /** IDs of nodes directly connected to the selected node (1 hop). */
  directNodeIds: Set<string>
  /** IDs of nodes connected via a direct node (2 hops, excluding selected + direct). */
  secondHopNodeIds: Set<string>
  /** Edges between the selected node and direct nodes. */
  directEdges: IVMEdge[]
  /** Edges between direct nodes and second-hop nodes. */
  secondHopEdges: IVMEdge[]
}

export function useFocusedConnections(graph: IVMGraph): FocusedConnectionsResult {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)

  return useMemo(() => {
    if (!selectedNodeId) {
      return {
        directNodeIds: new Set<string>(),
        secondHopNodeIds: new Set<string>(),
        directEdges: [] as IVMEdge[],
        secondHopEdges: [] as IVMEdge[],
      }
    }

    const directEdges: IVMEdge[] = []
    const directNodeIds = new Set<string>()

    for (const graphEdge of graph.edges) {
      if (graphEdge.source === selectedNodeId) {
        directNodeIds.add(graphEdge.target)
        directEdges.push(graphEdge)
      } else if (graphEdge.target === selectedNodeId) {
        directNodeIds.add(graphEdge.source)
        directEdges.push(graphEdge)
      }
    }

    const secondHopEdges: IVMEdge[] = []
    const secondHopNodeIds = new Set<string>()

    for (const graphEdge of graph.edges) {
      const srcDirect = directNodeIds.has(graphEdge.source)
      const tgtDirect = directNodeIds.has(graphEdge.target)

      if (
        srcDirect &&
        graphEdge.target !== selectedNodeId &&
        !directNodeIds.has(graphEdge.target)
      ) {
        secondHopNodeIds.add(graphEdge.target)
        secondHopEdges.push(graphEdge)
      } else if (
        tgtDirect &&
        graphEdge.source !== selectedNodeId &&
        !directNodeIds.has(graphEdge.source)
      ) {
        secondHopNodeIds.add(graphEdge.source)
        secondHopEdges.push(graphEdge)
      }
    }

    return { directNodeIds, secondHopNodeIds, directEdges, secondHopEdges }
  }, [graph.edges, selectedNodeId])
}
