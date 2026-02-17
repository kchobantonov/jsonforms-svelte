import type { TreeNode, FilterMatch, FilterFunction, FilterKeyFunctions } from './types';

export type FilterMatchArraySingle = readonly [number, number];
export type FilterMatchArrayMultiple = readonly FilterMatchArraySingle[];

export const defaultFilter: FilterFunction = (value, query, item) => {
  if (value == null || query == null) return -1;
  if (!query.length) return true;

  value = value.toString().toLocaleLowerCase();
  query = query.toString().toLocaleLowerCase();

  const result: FilterMatchArraySingle[] = [];
  let idx = value.indexOf(query);
  
  while (idx !== -1) {
    result.push([idx, idx + query.length] as const);
    idx = value.indexOf(query, idx + query.length);
  }

  return result.length ? result : -1;
};

function normalizeMatch(match: FilterMatch, query: string): FilterMatchArrayMultiple | undefined {
  if (match == null || typeof match === 'boolean' || match === -1) return undefined;
  if (typeof match === 'number') return [[match, match + query.length]];
  if (Array.isArray(match[0])) return match as FilterMatchArrayMultiple;
  return [match] as FilterMatchArrayMultiple;
}

export interface FilterResult<T = any> {
  node: TreeNode<T>;
  matches: Record<string, FilterMatchArrayMultiple | undefined>;
  visible: boolean;
}

function getPropertyFromItem(item: any, key: string): any {
  const keys = key.split('.');
  let value = item;
  
  for (const k of keys) {
    if (value == null) return undefined;
    value = value[k];
  }
  
  return value;
}

export function filterTreeNodes<T = any>(
  nodes: TreeNode<T>[],
  query: string,
  options?: {
    customFilter?: FilterFunction;
    customKeyFilter?: FilterKeyFunctions;
    filterKeys?: string | string[];
    filterMode?: 'some' | 'every' | 'union' | 'intersection';
  }
): FilterResult<T>[] {
  const results: FilterResult<T>[] = [];
  const filter = options?.customFilter ?? defaultFilter;
  const keys = options?.filterKeys ? (Array.isArray(options.filterKeys) ? options.filterKeys : [options.filterKeys]) : ['label'];
  const customFiltersLength = Object.keys(options?.customKeyFilter ?? {}).length;

  function processNode(node: TreeNode<T>): FilterResult<T> {
    const customMatches: Record<string, FilterMatchArrayMultiple | undefined> = {};
    const defaultMatches: Record<string, FilterMatchArrayMultiple | undefined> = {};
    let nodeMatches = false;

    if (query && query.length > 0) {
      for (const key of keys) {
        const value = getPropertyFromItem(node, key);
        const keyFilter = options?.customKeyFilter?.[key];

        const match = keyFilter
          ? keyFilter(value, query, node)
          : filter(value, query, node);

        if (match !== -1 && match !== false) {
          nodeMatches = true;
          if (keyFilter) {
            customMatches[key] = normalizeMatch(match, query);
          } else {
            defaultMatches[key] = normalizeMatch(match, query);
          }
        } else if (options?.filterMode === 'every') {
          nodeMatches = false;
          break;
        }
      }

      // Check filter mode requirements
      const defaultMatchesLength = Object.keys(defaultMatches).length;
      const customMatchesLength = Object.keys(customMatches).length;

      if (options?.filterMode === 'union') {
        nodeMatches = defaultMatchesLength > 0 || customMatchesLength > 0;
      } else if (options?.filterMode === 'intersection') {
        nodeMatches = (customFiltersLength === 0 || customMatchesLength === customFiltersLength) && 
                     (keys.length === customFiltersLength || defaultMatchesLength > 0);
      }
    } else {
      // No query means show all
      nodeMatches = true;
    }

    // Process children recursively
    let childResults: FilterResult<T>[] = [];
    let hasVisibleChildren = false;

    if (node.children && node.children.length > 0) {
      childResults = node.children.map(child => processNode(child));
      hasVisibleChildren = childResults.some(result => result.visible);
    }

    // Node is visible if it matches OR has visible children
    const visible = nodeMatches || hasVisibleChildren;

    return {
      node,
      matches: { ...defaultMatches, ...customMatches },
      visible,
    };
  }

  function flattenResults(result: FilterResult<T>): void {
    if (result.visible) {
      results.push(result);
      
      if (result.node.children) {
        result.node.children.forEach(child => {
          const childResult = processNode(child);
          flattenResults(childResult);
        });
      }
    }
  }

  nodes.forEach(node => {
    const result = processNode(node);
    flattenResults(result);
  });

  return results;
}

export function highlightMatch(text: string, matches: FilterMatchArrayMultiple | undefined): Array<{ text: string; highlight: boolean }> {
  if (!matches || matches.length === 0) {
    return [{ text, highlight: false }];
  }

  const result: Array<{ text: string; highlight: boolean }> = [];
  let lastIndex = 0;

  matches.forEach((match, i) => {
    const [start, end] = match;
    
    // Add non-highlighted text before match
    if (start > lastIndex) {
      result.push({ text: text.slice(lastIndex, start), highlight: false });
    }
    
    // Add highlighted match
    result.push({ text: text.slice(start, end), highlight: true });
    
    lastIndex = end;
  });

  // Add remaining non-highlighted text
  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), highlight: false });
  }

  return result;
}