/**
 * Fuzzy Search
 *
 * Fuse.js-based fuzzy search for graph nodes
 */

import Fuse, { type IFuseOptions } from 'fuse.js';
import type { GraphNode } from '../../shared/types';

/**
 * Fuse.js configuration
 *
 * - keys: Fields to search with weights (higher weight = more important)
 * - threshold: 0 = exact match, 1 = match anything (0.4 is good balance)
 * - distance: Max character distance for fuzzy match
 * - minMatchCharLength: Minimum query length to start matching
 * - includeScore: For ranking results
 */
const fuseOptions: IFuseOptions<GraphNode> = {
  keys: [
    { name: 'label', weight: 0.4 }, // Primary match (node name)
    { name: 'id', weight: 0.3 }, // Secondary match (node ID)
    { name: 'type', weight: 0.2 }, // Tertiary match (node type)
    { name: 'metadata.path', weight: 0.1 }, // File path (if available)
  ],
  threshold: 0.4, // 0 = perfect match, 1 = match anything
  distance: 100, // Max char distance for fuzzy match
  minMatchCharLength: 1, // Minimum query length
  includeScore: true, // For ranking results
  ignoreLocation: true, // Search entire string, not just beginning
  findAllMatches: true, // Find all matches
};

/**
 * Search index - initialized once with graph nodes
 */
let fuseIndex: Fuse<GraphNode> | null = null;

/**
 * Initialize the search index with graph nodes
 *
 * Call this when the graph is loaded to pre-compute the search index
 * for instant lookups.
 *
 * @param nodes - Array of graph nodes to index
 */
export function initializeSearchIndex(nodes: GraphNode[]): void {
  fuseIndex = new Fuse(nodes, fuseOptions);
}

/**
 * Search nodes using fuzzy matching
 *
 * @param query - Search query string
 * @returns Array of matching graph nodes (max 10), sorted by relevance
 */
export function searchNodes(query: string): GraphNode[] {
  // Return empty for empty/whitespace query
  if (!query.trim()) {
    return [];
  }

  // Return empty if index not initialized
  if (!fuseIndex) {
    return [];
  }

  // Perform fuzzy search, limit to 10 results
  const results = fuseIndex.search(query, { limit: 10 });

  // Return just the items (Fuse returns { item, score, matches })
  return results.map((result) => result.item);
}

/**
 * Clear the search index
 *
 * Call this when switching codebases or cleaning up
 */
export function clearSearchIndex(): void {
  fuseIndex = null;
}
