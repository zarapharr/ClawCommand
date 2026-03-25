import React, { useState } from "react";

/**
 * CollapsibleTree Component
 * Hierarchical project/workflow tree with expand/collapse
 * @example
 * <CollapsibleTree
 *   root={{ id: "1", label: "ClawCommand", icon: "📦" }}
 *   items={[
 *     { id: "1-1", parentId: "1", label: "Phase 3A", children: true },
 *     { id: "1-1-1", parentId: "1-1", label: "Core" }
 *   ]}
 * />
 */
interface TreeNode {
  id: string;
  parentId?: string;
  label: string;
  icon?: string;
  children?: boolean;
  count?: number;
}

interface CollapsibleTreeProps {
  root: TreeNode;
  items: TreeNode[];
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}

export const CollapsibleTree: React.FC<CollapsibleTreeProps> = ({
  root,
  items,
  onNodeClick,
  className = "",
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([root.id]));

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const getChildren = (parentId: string): TreeNode[] => {
    return items.filter((item) => item.parentId === parentId);
  };

  const TreeNodeComponent: React.FC<{ node: TreeNode; depth: number }> = ({
    node,
    depth,
  }) => {
    const children = getChildren(node.id);
    const isExpanded = expanded.has(node.id);

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-neutral-700/50 cursor-pointer group"
          style={{ marginLeft: `${depth * 16}px` }}
          onClick={() => {
            if (node.children || children.length > 0) {
              toggleNode(node.id);
            }
            onNodeClick?.(node.id);
          }}
          role="treeitem"
          aria-expanded={node.children || children.length > 0 ? isExpanded : undefined}
        >
          {(node.children || children.length > 0) && (
            <button
              className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-neutral-400"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              aria-label={`Toggle ${node.label}`}
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          )}
          {!(node.children || children.length > 0) && (
            <div className="flex-shrink-0 w-4" />
          )}
          {node.icon && <span className="text-lg">{node.icon}</span>}
          <span className="text-sm text-neutral-300 group-hover:text-neutral-100 transition-colors">
            {node.label}
          </span>
          {node.count !== undefined && (
            <span className="text-xs text-neutral-500 ml-auto">{node.count}</span>
          )}
        </div>
        {isExpanded &&
          children.map((child) => (
            <TreeNodeComponent key={child.id} node={child} depth={depth + 1} />
          ))}
      </div>
    );
  };

  return (
    <div
      className={`rounded-lg border border-neutral-700 bg-neutral-800/30 p-2 font-mono ${className}`}
      role="tree"
    >
      <TreeNodeComponent node={root} depth={0} />
    </div>
  );
};
