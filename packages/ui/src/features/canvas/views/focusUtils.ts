export function getNodeFocusOpacity(
  nodeId: string,
  selectedNodeId: string | null,
  directNodeIds: Set<string>,
  secondHopNodeIds: Set<string>,
): number {
  if (!selectedNodeId) return 1.0;
  if (nodeId === selectedNodeId) return 1.0;
  if (directNodeIds.has(nodeId)) return 1.0;
  if (secondHopNodeIds.has(nodeId)) return 0.5;
  return 0.15;
}
