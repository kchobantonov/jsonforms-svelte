import type { Component, Snippet } from 'svelte';
import type { RecursiveTreeNode } from './recursiveTree';

export interface RecursiveTreeLinkProps {
  onclick: () => void;
  children: Snippet;
}
export interface RecursiveTreeViewProps {
  root: RecursiveTreeNode;
  selected: RecursiveTreeNode;
  select: (node: RecursiveTreeNode) => void;
  canDelete: (node: RecursiveTreeNode) => boolean;
  canRename: (node: RecursiveTreeNode) => boolean;
  remove: (node: RecursiveTreeNode) => void;
  rename: (node: RecursiveTreeNode, name: string) => void;
  validateRename: (node: RecursiveTreeNode, name: string) => string | undefined;
  validation: (node: RecursiveTreeNode) => { show: boolean; count?: number };
}
export interface RecursiveTreeNavigation {
  selectPath: (path: string) => void;
  labelProperty: string;
  Link: Component<RecursiveTreeLinkProps>;
}
export const RecursiveTreeNavigationSymbol = Symbol.for(
  'jsonforms-svelte/recursive-tree-navigation',
);
