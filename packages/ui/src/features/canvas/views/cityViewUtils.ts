/**
 * City View Utilities
 *
 * Pure utility functions for the CityView renderer.
 * Extracted for testability without React Three Fiber dependencies.
 */

// Re-export focused modules so all existing importers remain unaffected.
export * from './colorUtils';
export * from './inheritanceUtils';
export * from './heightUtils';
export * from './pipeUtils';
export * from './wireUtils';

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

const VISIBILITY_SORT_ORDER: Record<string, number> = {
  public: 0,
  protected: 1,
  private: 2,
};

export function sortMethodsByVisibility<T extends { visibility?: string }>(
  methods: readonly T[],
): T[] {
  return methods
    .map((m, i) => ({ m, i }))
    .sort((a, b) => {
      const aPri = VISIBILITY_SORT_ORDER[a.m.visibility ?? 'public'] ?? 0;
      const bPri = VISIBILITY_SORT_ORDER[b.m.visibility ?? 'public'] ?? 0;
      return aPri !== bPri ? aPri - bPri : a.i - b.i;
    })
    .map(({ m }) => m);
}
