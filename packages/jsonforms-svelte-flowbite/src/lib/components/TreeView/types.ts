import type { Snippet } from 'svelte';

export interface TreeNode<T = any> {
  id: string;
  label: string;
  children?: TreeNode<T>[];
  data?: T;
}

export type FilterMatch =
  | boolean
  | number
  | readonly [number, number]
  | readonly (readonly [number, number])[];
export type FilterFunction = (value: string, query: string, item?: TreeNode) => FilterMatch;
export type FilterKeyFunctions = Record<string, FilterFunction>;

export interface TreeViewFilterOptions {
  customFilter?: FilterFunction;
  customKeyFilter?: FilterKeyFunctions;
  filterKeys?: string | string[];
  filterMode?: 'some' | 'every' | 'union' | 'intersection';
}
export interface TreeNode<T = any> {
  id: string;
  label: string;
  children?: TreeNode<T>[];
  data?: T;
}

export interface NodeSnippetProps {
  node: TreeNode;
  onDelete: (event: MouseEvent) => void;
  active: boolean;
  matches?: Record<string, any>;
}

export interface IconSnippetProps {
  expanded: boolean;
  active: boolean;
}

export interface NodeIconSnippetProps {
  node: TreeNode;
  active: boolean;
}
export interface TreeNodeSnippetProps {
  node: TreeNode;
  nodeSnippet?: Snippet<[NodeSnippetProps]>;
  nodeIconSnippet?: Snippet<[NodeIconSnippetProps]>;
  collapseIcon?: Snippet<[IconSnippetProps]>;
  expandIcon?: Snippet<[IconSnippetProps]>;
  expanded: boolean;
  active: boolean;
  onToggle: () => void;
  onClick: () => void;
  onDelete: (event: MouseEvent) => void;
  onNodeClick: (node: TreeNode) => void;
  onNodeDelete: (node: TreeNode) => void;
  matches?: Record<string, any>;
  visible: boolean;
  depth?: number;
}

export interface TreeViewProps {
  nodes: TreeNode[];
  nodeSnippet?: Snippet<[NodeSnippetProps]>;
  nodeIconSnippet?: Snippet<[NodeIconSnippetProps]>;
  collapseIcon?: Snippet<[IconSnippetProps]>;
  expandIcon?: Snippet<[IconSnippetProps]>;
  onNodeClick?: (node: TreeNode) => void;
  onNodeDelete?: (node: TreeNode) => void;
  expandedNodes?: string[];
  activeNodeId?: string;
  scrollable?: boolean;
  class?: string;
  maxHeight?: string;
  search?: string;
  customFilter?: FilterFunction;
  customKeyFilter?: FilterKeyFunctions;
  filterKeys?: string | string[];
  filterMode?: 'some' | 'every' | 'union' | 'intersection';
  openAll?: boolean;
}
