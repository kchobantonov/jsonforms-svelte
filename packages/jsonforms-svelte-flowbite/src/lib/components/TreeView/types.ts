import type { Snippet } from 'svelte';
import type { FilterMatchArrayMultiple } from './filter';

export interface TreeNode<T = unknown> {
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
export type FilterFunction = (value: unknown, query: string, item?: TreeNode) => FilterMatch;
export type FilterKeyFunctions = Record<string, FilterFunction>;

export interface TreeViewFilterOptions {
  customFilter?: FilterFunction;
  customKeyFilter?: FilterKeyFunctions;
  filterKeys?: string | string[];
  filterMode?: 'some' | 'every' | 'union' | 'intersection';
}

export interface NodeSnippetProps<T = unknown> {
  node: TreeNode<T>;
  onDelete: (event: MouseEvent) => void;
  active: boolean;
  matches?: Record<string, FilterMatchArrayMultiple | undefined>;
}

export interface IconSnippetProps {
  expanded: boolean;
  active: boolean;
}

export interface NodeIconSnippetProps<T = unknown> {
  node: TreeNode<T>;
  active: boolean;
}
export interface TreeNodeSnippetProps<T = unknown> {
  node: TreeNode<T>;
  nodeSnippet?: Snippet<[NodeSnippetProps<T>]>;
  nodeIconSnippet?: Snippet<[NodeIconSnippetProps<T>]>;
  collapseIcon?: Snippet<[IconSnippetProps]>;
  expandIcon?: Snippet<[IconSnippetProps]>;
  expanded: boolean;
  active: boolean;
  onToggle: () => void;
  onClick: () => void;
  onDelete: (event: MouseEvent) => void;
  onNodeClick: (node: TreeNode<T>) => void;
  onNodeDelete: (node: TreeNode<T>) => void;
  matches?: Record<string, FilterMatchArrayMultiple | undefined>;
  visible: boolean;
  depth?: number;
}

export interface TreeViewProps<T = unknown> {
  nodes: TreeNode<T>[];
  nodeSnippet?: Snippet<[NodeSnippetProps<T>]>;
  nodeIconSnippet?: Snippet<[NodeIconSnippetProps<T>]>;
  collapseIcon?: Snippet<[IconSnippetProps]>;
  expandIcon?: Snippet<[IconSnippetProps]>;
  onNodeClick?: (node: TreeNode<T>) => void;
  onNodeDelete?: (node: TreeNode<T>) => void;
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
