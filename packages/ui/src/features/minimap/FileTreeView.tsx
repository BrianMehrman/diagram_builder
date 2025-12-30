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
 * Build tree structure from flat node list
 */
function buildTree(nodes: GraphNode[]): TreeNode[] {
  // For now, simple hierarchy: files > classes > functions > methods
  const files = nodes.filter((n) => n.type === 'file');

  return files.map((file) => {
    const classes = nodes.filter(
      (n) => n.type === 'class' && n.metadata.file === file.id
    );

    return {
      id: file.id,
      label: file.label,
      type: file.type,
      children: classes.map((cls) => {
        const methods = nodes.filter(
          (n) => n.type === 'method' && n.metadata.class === cls.id
        );

        return {
          id: cls.id,
          label: cls.label,
          type: cls.type,
          children: methods.map((method) => ({
            id: method.id,
            label: method.label,
            type: method.type,
            children: [],
          })),
        };
      }),
    };
  });
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
