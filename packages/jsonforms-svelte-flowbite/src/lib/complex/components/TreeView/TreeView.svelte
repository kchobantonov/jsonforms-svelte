<script lang="ts">
  import clsx from 'clsx';
  import { tick, untrack } from 'svelte';
  import type { FilterMatchArrayMultiple } from './filter';
  import { defaultFilter, highlightMatch } from './filter';
  import { treeNode, treeNodeChildren, treeNodeContent, treeToggleButton, treeView } from './theme';
  import type { FilterMatch, TreeNode, TreeNodeSnippetProps, TreeViewProps } from './types';

  let {
    nodes = [],
    nodeSnippet,
    nodeIconSnippet,
    collapseIcon,
    expandIcon,
    onNodeClick = () => {},
    onNodeDelete = () => {},
    expandedNodes = $bindable([]),
    activeNodeId = $bindable(undefined),
    scrollable = true,
    class: className,
    maxHeight = '600px',
    search = '',
    customFilter,
    customKeyFilter,
    filterKeys = 'label',
    filterMode = 'intersection',
    openAll = false,
  }: TreeViewProps = $props();

  const theme = $derived(treeView);
  const baseClass = $derived(treeView({ scrollable, class: clsx(theme, className) }));

  let treeViewElement: HTMLDivElement | undefined = $state();
  let nodeElements = new Map<string, HTMLElement>();

  // Helper functions
  function getPropertyFromItem(item: any, key: string): any {
    const keys = key.split('.');
    let value = item;

    for (const k of keys) {
      if (value == null) return undefined;
      value = value[k];
    }

    return value;
  }

  function normalizeMatch(match: FilterMatch, query: string): FilterMatchArrayMultiple | undefined {
    if (match == null || typeof match === 'boolean' || match === -1) return undefined;
    if (typeof match === 'number') return [[match, match + query.length]];
    if (Array.isArray(match[0])) return match as FilterMatchArrayMultiple;
    return [match] as FilterMatchArrayMultiple;
  }

  // Filter tree preserving structure
  const filteredTree = $derived.by(() => {
    if (!search || search.length === 0) {
      return nodes;
    }

    function filterNode(node: TreeNode): {
      node: TreeNode;
      matches: Record<string, any>;
      visible: boolean;
    } | null {
      const filter = customFilter ?? defaultFilter;
      const keys = filterKeys ? (Array.isArray(filterKeys) ? filterKeys : [filterKeys]) : ['label'];

      const customMatches: Record<string, any> = {};
      const defaultMatches: Record<string, any> = {};
      let nodeMatches = false;

      // Check if this node matches
      for (const key of keys) {
        const value = getPropertyFromItem(node, key);
        const keyFilter = customKeyFilter?.[key];

        const match = keyFilter ? keyFilter(value, search, node) : filter(value, search, node);

        if (match !== -1 && match !== false) {
          nodeMatches = true;
          if (keyFilter) {
            customMatches[key] = normalizeMatch(match, search);
          } else {
            defaultMatches[key] = normalizeMatch(match, search);
          }
        } else if (filterMode === 'every') {
          nodeMatches = false;
          break;
        }
      }

      // Process children recursively
      let filteredChildren: TreeNode[] = [];
      let hasVisibleChildren = false;

      if (node.children && node.children.length > 0) {
        const childResults = node.children
          .map((child) => filterNode(child))
          .filter(
            (result): result is NonNullable<typeof result> => result !== null && result.visible,
          );

        if (childResults.length > 0) {
          hasVisibleChildren = true;
          filteredChildren = childResults.map((r) => r.node);
        }
      }

      const visible = nodeMatches || hasVisibleChildren;

      if (!visible) {
        return null;
      }

      return {
        node: {
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children,
        },
        matches: { ...defaultMatches, ...customMatches },
        visible: true,
      };
    }

    return nodes
      .map((node) => filterNode(node))
      .filter((result): result is NonNullable<typeof result> => result !== null && result.visible)
      .map((r) => r.node);
  });

  // Collect all node IDs that should have matches highlighted
  const nodeMatchesMap = $derived.by(() => {
    const map = new Map<string, Record<string, any>>();

    function collectMatches(nodes: TreeNode[]) {
      nodes.forEach((node) => {
        if (search && search.length > 0) {
          const filter = customFilter ?? defaultFilter;
          const keys = filterKeys
            ? Array.isArray(filterKeys)
              ? filterKeys
              : [filterKeys]
            : ['label'];
          const matches: Record<string, any> = {};

          for (const key of keys) {
            const value = getPropertyFromItem(node, key);
            const keyFilter = customKeyFilter?.[key];
            const match = keyFilter ? keyFilter(value, search, node) : filter(value, search, node);

            if (match !== -1 && match !== false) {
              matches[key] = normalizeMatch(match, search);
            }
          }

          if (Object.keys(matches).length > 0) {
            map.set(node.id, matches);
          }
        }

        if (node.children) {
          collectMatches(node.children);
        }
      });
    }

    collectMatches(filteredTree);
    return map;
  });

  // Auto-expand when searching or openAll is true
  $effect(() => {
    if (search && search.length > 0) {
      untrack(() => {
        const allNodeIds: string[] = [];

        function collectAllIds(nodes: TreeNode[]) {
          nodes.forEach((node) => {
            if (node.children && node.children.length > 0) {
              allNodeIds.push(node.id);
              collectAllIds(node.children);
            }
          });
        }

        collectAllIds(filteredTree);
        expandedNodes = allNodeIds;
      });
    } else if (openAll) {
      untrack(() => {
        const allNodeIds: string[] = [];

        function collectAllIds(nodes: TreeNode[]) {
          nodes.forEach((node) => {
            if (node.children && node.children.length > 0) {
              allNodeIds.push(node.id);
              collectAllIds(node.children);
            }
          });
        }

        collectAllIds(nodes);
        expandedNodes = allNodeIds;
      });
    }
  });

  function toggleNode(nodeId: string): void {
    const index = expandedNodes.indexOf(nodeId);
    if (index > -1) {
      expandedNodes = expandedNodes.filter((id) => id !== nodeId);
    } else {
      expandedNodes = [...expandedNodes, nodeId];
    }
  }

  function isExpanded(nodeId: string): boolean {
    return expandedNodes.includes(nodeId);
  }

  function handleNodeClick(node: TreeNode): void {
    activeNodeId = node.id;
    onNodeClick(node);
  }

  function handleNodeDelete(node: TreeNode, event: MouseEvent): void {
    event.stopPropagation();
    onNodeDelete(node);
  }

  function handleKeyDown(event: KeyboardEvent, callback: () => void): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  }

  // Find path to a node
  function findPathToNode(
    nodes: TreeNode[],
    targetId: string,
    path: string[] = [],
  ): string[] | null {
    for (const node of nodes) {
      const currentPath = [...path, node.id];

      if (node.id === targetId) {
        return currentPath;
      }

      if (node.children) {
        const found = findPathToNode(node.children, targetId, currentPath);
        if (found) return found;
      }
    }
    return null;
  }

  // Expand path to node
  function expandPathToNode(nodeId: string): void {
    untrack(() => {
      const path = findPathToNode(nodes, nodeId);
      if (path) {
        const nodesToExpand = path.slice(0, -1);
        const newExpanded = new Set([...expandedNodes, ...nodesToExpand]);
        expandedNodes = Array.from(newExpanded);
      }
    });
  }

  // Scroll to node
  async function scrollToNode(nodeId: string): Promise<void> {
    expandPathToNode(nodeId);

    await tick();
    await tick();

    untrack(() => {
      const element = nodeElements.get(nodeId);
      if (element && treeViewElement) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    });
  }

  // Auto-scroll to active node
  $effect(() => {
    if (activeNodeId) {
      scrollToNode(activeNodeId);
    }
  });

  function registerNode(element: HTMLElement, nodeId: string) {
    nodeElements.set(nodeId, element);

    return {
      destroy() {
        nodeElements.delete(nodeId);
      },
    };
  }
</script>

<div
  bind:this={treeViewElement}
  class={baseClass}
  style:max-height={scrollable ? maxHeight : undefined}
  role="tree"
>
  {#each filteredTree as node (node.id)}
    {@render TreeNodeSnippet({
      node,
      nodeSnippet,
      nodeIconSnippet,
      collapseIcon,
      expandIcon,
      expanded: isExpanded(node.id),
      active: activeNodeId === node.id,
      onToggle: () => toggleNode(node.id),
      onClick: () => handleNodeClick(node),
      onDelete: (e: MouseEvent) => handleNodeDelete(node, e),
      onNodeClick,
      onNodeDelete,
      matches: nodeMatchesMap.get(node.id),
      visible: true,
    })}
  {/each}
</div>

{#snippet TreeNodeSnippet({
  node,
  nodeSnippet,
  nodeIconSnippet,
  collapseIcon,
  expandIcon,
  expanded,
  active,
  onToggle,
  onClick,
  onDelete,
  onNodeClick,
  onNodeDelete,
  matches,
  visible,
}: TreeNodeSnippetProps)}
  {#if visible}
    <div
      class={treeNode()}
      role="treeitem"
      aria-expanded={node.children?.length ? expanded : undefined}
      aria-selected={active}
    >
      <button
        type="button"
        use:registerNode={node.id}
        class={treeNodeContent({ active })}
        onclick={onClick}
        onkeydown={(e) => handleKeyDown(e, onClick)}
      >
        {#if node.children && node.children.length > 0}
          <span
            class={treeToggleButton({ active })}
            onclick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onToggle();
            }}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onToggle();
              }
            }}
            role="button"
            tabindex="-1"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {#if expanded && collapseIcon}
              {@render collapseIcon({ expanded, active })}
            {:else if !expanded && expandIcon}
              {@render expandIcon({ expanded, active })}
            {:else}
              <svg
                class="h-3 w-3 transition-transform {expanded
                  ? 'ltr:rotate-90 rtl:-rotate-90'
                  : ''}"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            {/if}
          </span>
        {:else}
          <span class="w-5 shrink-0" aria-hidden="true"></span>
        {/if}

        {#if nodeSnippet}
          {@render nodeSnippet({ node, onDelete, active, matches })}
        {:else}
          {#if nodeIconSnippet}
            {@render nodeIconSnippet({ node, active })}
          {:else}
            <svg
              class="h-4 w-4 shrink-0 {active
                ? 'text-white dark:text-white'
                : 'text-gray-500 dark:text-gray-400'}"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
              ></path>
            </svg>
          {/if}
          <span class="flex-1 truncate text-start whitespace-nowrap">
            {#if matches?.label}
              {#each highlightMatch(node.label, matches.label as FilterMatchArrayMultiple) as segment}
                {#if segment.highlight}
                  <mark class="bg-yellow-200 dark:bg-yellow-600">{segment.text}</mark>
                {:else}
                  {segment.text}
                {/if}
              {/each}
            {:else}
              {node.label}
            {/if}
          </span>
        {/if}
      </button>

      {#if node.children && node.children.length > 0 && expanded}
        <div class={treeNodeChildren()} role="group">
          {#each node.children as childNode (childNode.id)}
            {@render TreeNodeSnippet({
              node: childNode,
              nodeSnippet,
              nodeIconSnippet,
              collapseIcon,
              expandIcon,
              expanded: isExpanded(childNode.id),
              active: activeNodeId === childNode.id,
              onToggle: () => toggleNode(childNode.id),
              onClick: () => {
                onNodeClick(childNode);
              },
              onDelete: (e: MouseEvent) => {
                e.stopPropagation();
                onNodeDelete(childNode);
              },
              onNodeClick,
              onNodeDelete,
              matches: nodeMatchesMap.get(childNode.id),
              visible: true,
            })}
          {/each}
        </div>
      {/if}
    </div>
  {/if}
{/snippet}
