import { compose } from '@jsonforms/core';
import type { TreeNode, TreeNodeData } from './treeBuilder.svelte';
import type { JsonDataType } from './jsonTypeUtils';

export function filterMixedTree(
  nodes: TreeNode<TreeNodeData>[] | undefined,
  query: string,
): TreeNode<TreeNodeData>[] {
  if (!nodes) return [];

  const normalized = query.trim();
  if (!normalized) return nodes;

  return nodes.flatMap((node) => {
    const filteredChildren = filterMixedTree(node.children, normalized);
    const includeNode =
      node.label.toLowerCase().includes(normalized.toLowerCase()) || filteredChildren.length > 0;

    return includeNode
      ? [
          {
            ...node,
            children: filteredChildren,
          },
        ]
      : [];
  });
}

export function mixedTreeBranchIds(nodes: TreeNode<TreeNodeData>[] | undefined): string[] {
  if (!nodes) return [];

  return nodes.flatMap((node) => {
    const childValues = mixedTreeBranchIds(node.children);
    return node.children && node.children.length > 0 ? [node.id, ...childValues] : childValues;
  });
}

export function complexMixedTreeNodes(nodes: TreeNode<TreeNodeData>[]): TreeNode<TreeNodeData>[] {
  return nodes
    .filter((node) => node.data?.type === 'object' || node.data?.type === 'array')
    .map((node) => ({ ...node, children: complexMixedTreeNodes(node.children ?? []) }));
}

export function findMixedNodeByPath(
  nodes: TreeNode<TreeNodeData>[] | undefined,
  targetPath: string,
): (TreeNode<TreeNodeData> & { data: TreeNodeData }) | undefined {
  if (!nodes) return undefined;

  for (const node of nodes) {
    if (node.data?.path === targetPath) {
      return node as TreeNode<TreeNodeData> & { data: TreeNodeData };
    }
    if (node.children) {
      const found = findMixedNodeByPath(node.children, targetPath);
      if (found) return found;
    }
  }
  return undefined;
}

export function mixedTreeAncestorPaths(rootPath: string, targetPath: string): string[] {
  if (!targetPath.startsWith(rootPath)) {
    return [];
  }

  const segments = targetPath.replace(rootPath, '').split('.').filter(Boolean);

  const expandedPaths: string[] = [];
  let currentPath = rootPath;

  for (let index = 0; index < segments.length - 1; index += 1) {
    currentPath = compose(currentPath, segments[index]);
    expandedPaths.push(currentPath);
  }

  return expandedPaths;
}

export function mixedTreeBreadcrumbs(
  nodes: TreeNode<TreeNodeData>[] | undefined,
  activePath: string,
  root: { path: string; label: string },
  rootType: JsonDataType | null,
  itemLabel: (index: string) => string,
) {
  const segments = activePath.replace(root.path, '').split('.').filter(Boolean);

  return [
    {
      label: root.label,
      path: root.path,
      type: rootType,
      isRoot: true,
    },
    ...segments.map((segment, index) => {
      const pathSegments = segments.slice(0, index + 1);
      let reconstructedPath = root.path;
      pathSegments.forEach((seg) => {
        reconstructedPath = compose(reconstructedPath, seg);
      });
      const node = findMixedNodeByPath(nodes, reconstructedPath);
      return {
        label: node?.data.label ?? (/^\d+$/.test(segment) ? itemLabel(segment) : segment),
        path: reconstructedPath,
        type: node?.data.type ?? null,
        isRoot: false,
      };
    }),
  ];
}
