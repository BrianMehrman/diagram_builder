/**
 * FileTreeView Component
 *
 * 2D hierarchical tree view of files and classes
 */

import { useState } from 'react';
import type { GraphNode } from '../../shared/types';

interface FileTreeViewProps {
  nodes: GraphNode[];
  onNodeClick?: (nodeId: string) => void;
  selectedNodeId?: string | null;
}

interface TreeNode {
  id: string;
  label: string;
  type: GraphNode['type'];
  children: TreeNode[];
}

/**
 * Build tree structure from flat node list using parentId relationships.
 * Falls back to metadata.file / metadata.class if parentId is not set.
 * Nodes without a parent are placed at the root level.
 */
function buildTree(nodes: GraphNode[]): TreeNode[] {
  // Build a map of parentId -> children
  const childrenMap = new Map<string, GraphNode[]>();
  const rootNodes: GraphNode[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  for (const node of nodes) {
    // Determine parent: prefer parentId, fall back to metadata.file or metadata.class
    const parentId =
      node.parentId ??
      (node.metadata.file as string | undefined) ??
      (node.metadata.class as string | undefined) ??
      null;

    if (parentId && nodeIds.has(parentId)) {
      const siblings = childrenMap.get(parentId) ?? [];
      siblings.push(node);
      childrenMap.set(parentId, siblings);
    } else {
      rootNodes.push(node);
    }
  }

  // Extract a human-readable label: prefer metadata.label (IVM format), then top-level label, then id
  function getDisplayLabel(node: GraphNode): string {
    const raw = (node.metadata?.label as string) || node.label || node.id;
    return raw.includes('/') ? raw.split('/').pop()! : raw;
  }

  // Recursively convert to TreeNode
  function toTreeNode(node: GraphNode): TreeNode {
    const children = childrenMap.get(node.id) ?? [];
    return {
      id: node.id,
      label: getDisplayLabel(node),
      type: node.type,
      children: children.map(toTreeNode),
    };
  }

  // Sort roots: files first, then by label
  rootNodes.sort((a, b) => {
    if (a.type === 'file' && b.type !== 'file') return -1;
    if (a.type !== 'file' && b.type === 'file') return 1;
    return (a.label ?? '').localeCompare(b.label ?? '');
  });

  return rootNodes.map(toTreeNode);
}

/**
 * Tree node component
 */
function TreeNodeComponent({
  node,
  level = 0,
  onNodeClick,
  selectedNodeId,
}: {
  node: TreeNode;
  level?: number;
  onNodeClick?: (nodeId: string) => void;
  selectedNodeId?: string | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedNodeId === node.id;

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(node.id);
    }
    if (hasChildren) {
      setExpanded(!expanded);
    }
  };

  const getIcon = (type: GraphNode['type']) => {
    switch (type) {
      case 'file':
        return '📄';
      case 'class':
        return '🏛️';
      case 'function':
        return '⚡';
      case 'method':
        return '🔧';
      case 'variable':
        return '📦';
      default:
        return '•';
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-gray-100 rounded transition-colors ${
          isSelected ? 'bg-primary-100 text-primary-900' : 'text-gray-700'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren && (
          <span className="text-gray-400 text-xs">
            {expanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="w-3" />}
        <span className="text-sm">{getIcon(node.type)}</span>
        <span className="text-sm font-medium truncate">{node.label}</span>
      </div>
      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNodeComponent
            key={child.id}
            node={child}
            level={level + 1}
            {...(onNodeClick && { onNodeClick })}
            {...(selectedNodeId !== undefined && { selectedNodeId })}
          />
        ))}
    </div>
  );
}

/**
 * FileTreeView component
 */
export function FileTreeView({
  nodes,
  onNodeClick,
  selectedNodeId,
}: FileTreeViewProps) {
  const tree = buildTree(nodes);

  return (
    <div className="h-full overflow-y-auto">
      {tree.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-4">
          No files to display
        </div>
      ) : (
        <div className="py-2">
          {tree.map((node) => (
            <TreeNodeComponent
              key={node.id}
              node={node}
              {...(onNodeClick && { onNodeClick })}
              {...(selectedNodeId !== undefined && { selectedNodeId })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
