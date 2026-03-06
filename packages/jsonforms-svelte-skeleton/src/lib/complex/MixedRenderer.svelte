<script lang="ts">
  import JsonTypeIcon from '$lib/components/JsonTypeIcon.svelte';
  import Pane from '$lib/components/Pane.svelte';
  import SplitPane from '$lib/components/SplitPane.svelte';
  import ControlWrapper from '$lib/controls/ControlWrapper.svelte';
  import {
    DispatchRenderer,
    useJsonForms,
    useJsonFormsControl,
    useTranslator,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    compose,
    createDefaultValue,
    type ControlElement,
    type JsonSchema,
  } from '@jsonforms/core';
  import {
    ChevronDownIcon as ChevronDownOutline,
    ChevronRightIcon,
    ChevronUpIcon as ChevronUpOutline,
    EyeIcon as EyeOutline,
    EyeOffIcon as EyeSlashOutline,
    PencilIcon as PenOutline,
    Trash2Icon as TrashBinOutline,
    XIcon,
  } from '@lucide/svelte';
  import {
    Accordion,
    Combobox,
    Dialog,
    Portal,
    TreeView,
    createTreeViewCollection,
    useListCollection,
  } from '@skeletonlabs/skeleton-svelte';
  import get from 'lodash/get';
  import { getContext, setContext, untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    getPortalRootNodeGetter,
    getPortalTarget,
    NavigationContextSymbol,
    setIsDynamicProperty,
    useCombinatorTranslations,
    useSkeletonControl,
  } from '../util';
  import {
    getJsonDataType,
    hasStructuralChange,
    resolveSchema,
    type JsonDataType,
  } from './util/jsonTypeUtils';
  import { createMixedRenderInfos, type SchemaRenderInfo } from './util/schemaUtils';
  import { buildTreeFromData, type TreeNode, type TreeNodeData } from './util/treeBuilder.svelte';

  // ============================================================================
  // Types
  // ============================================================================

  interface TreeNodeControl {
    id: string;
    schema: JsonSchema;
    uischema: ControlElement;
    path: string;
    label: string;
    description?: string;
    required: boolean;
    enabled: boolean;
  }

  interface NavigationContext {
    rootControl: TreeNodeControl;
    selectPath: (path: string) => void;
  }

  type RequireFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

  // ============================================================================
  // Props & Core Setup
  // ============================================================================

  const props: RendererProps<ControlElement> = $props();
  const path = props.path;
  const parentSchema = props.schema;
  const binding = useCombinatorTranslations(useSkeletonControl(useJsonFormsControl(props)));
  const getRootNode = getPortalRootNodeGetter();

  const jsonforms = useJsonForms();
  const t = useTranslator();

  // ============================================================================
  // Navigation Context
  // ============================================================================

  const parentNavContext = getContext<NavigationContext | undefined>(NavigationContextSymbol);
  const isRoot = !parentNavContext;

  function getExpandedPathsForSelection(targetPath: string): string[] {
    if (!targetPath.startsWith(binding.control.path)) {
      return [];
    }

    const segments = targetPath
      .replace(binding.control.path, '')
      .split(/[.\[\]]/)
      .filter(Boolean);

    const expandedPaths: string[] = [];
    let currentPath = binding.control.path;

    for (let index = 0; index < segments.length - 1; index += 1) {
      currentPath = compose(currentPath, segments[index]);
      expandedPaths.push(currentPath);
    }

    return expandedPaths;
  }

  const navContext: NavigationContext = {
    get rootControl() {
      return binding.control;
    },
    selectPath: (targetPath: string) => {
      activeNodeId = targetPath;

      if (
        isRoot &&
        showTreeView &&
        targetPath !== binding.control.path &&
        targetPath.startsWith(binding.control.path)
      ) {
        currentlyExpanded = true;
        expandedNodes = Array.from(
          new Set([...expandedNodes, ...getExpandedPathsForSelection(targetPath)]),
        );
      }
    },
  };

  if (isRoot) {
    setContext(NavigationContextSymbol, navContext);
  }

  // ============================================================================
  // State
  // ============================================================================

  let searchQuery = $state('');
  let expandedNodes = $state<string[]>([]);
  let activeNodeId = $state<string>(binding.control.path);
  let currentlyExpanded = $state<boolean>(false);
  let inputDataType = $state<JsonDataType | null>(
    getJsonDataType(untrack(() => binding.control.data)),
  );
  let shouldRebuildTree = $state<boolean>(false);
  let selectedIndex = $state<number | null>(null);
  let treeNodes = $state<TreeNode<TreeNodeData>[] | undefined>(undefined);
  let previousData = $state(untrack(() => binding.control.data));

  // Rename state
  let renamingNodeId = $state<string | null>(null);
  let renameValue = $state('');
  let renameError = $state<string | null>(null);
  // Delete state
  let pendingDeleteNode = $state<TreeNode<TreeNodeData> | null>(null);

  let showPrimitivesInTree = $state<boolean>(false);

  // ============================================================================
  // Derived Values
  // ============================================================================

  const mixedRenderInfos = $derived.by((): (SchemaRenderInfo & { index: number })[] => {
    const result = createMixedRenderInfos(
      parentSchema,
      binding.control.schema,
      binding.control.rootSchema,
      binding.control.uischema,
      binding.control.path,
      jsonforms.uischemas || [],
    );

    return result.filter((info) => info.uischema).map((info, index) => ({ ...info, index }));
  });

  const nullable = $derived(mixedRenderInfos.some((info) => info.resolvedSchema.type === 'null'));

  const showTreeView = $derived(
    isRoot && (inputDataType === 'object' || inputDataType === 'array'),
  );

  const isNestedComplexType = $derived(
    !isRoot && (inputDataType === 'object' || inputDataType === 'array'),
  );

  const selectItems = $derived(
    mixedRenderInfos.map((item) => ({
      value: item.index.toString(),
      name: t.value(item.label, item.label),
    })),
  );

  const collection = $derived(
    useListCollection({
      items: selectItems,
      itemToString: (item) => item.name,
      itemToValue: (item) => item.value,
    }),
  );

  const schema = $derived(
    selectedIndex !== null && selectedIndex !== undefined
      ? mixedRenderInfos[selectedIndex]?.schema
      : undefined,
  );

  const uischema = $derived(
    selectedIndex !== null && selectedIndex !== undefined
      ? mixedRenderInfos[selectedIndex]?.uischema
      : undefined,
  );

  const selectedNode = $derived(showTreeView ? findNodeByPath(treeNodes, activeNodeId) : undefined);

  const breadcrumbSegments = $derived.by(() => {
    if (!showTreeView) return [];

    const segments = activeNodeId
      .replace(binding.control.path, '')
      .split(/[.\[\]]/)
      .filter(Boolean);

    return [
      { label: binding.control.label, path: binding.control.path },
      ...segments.map((segment, index) => {
        const pathSegments = segments.slice(0, index + 1);
        let reconstructedPath = binding.control.path;
        pathSegments.forEach((seg) => {
          reconstructedPath = compose(reconstructedPath, seg);
        });
        return { label: segment, path: reconstructedPath };
      }),
    ];
  });

  // ============================================================================
  // Utility Functions
  // ============================================================================

  function matchesTreeNode(node: TreeNode<TreeNodeData>, query: string): boolean {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return true;

    return node.label.toLowerCase().includes(normalized);
  }

  function filterTreeNodes(
    nodes: TreeNode<TreeNodeData>[] | undefined,
    query: string,
  ): TreeNode<TreeNodeData>[] {
    if (!nodes) return [];

    const normalized = query.trim();
    if (!normalized) return nodes;

    return nodes.flatMap((node) => {
      const filteredChildren = filterTreeNodes(node.children, normalized);
      const includeNode = matchesTreeNode(node, normalized) || filteredChildren.length > 0;

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

  function collectExpandedValues(nodes: TreeNode<TreeNodeData>[] | undefined): string[] {
    if (!nodes) return [];

    return nodes.flatMap((node) => {
      const childValues = collectExpandedValues(node.children);
      return node.children && node.children.length > 0 ? [node.id, ...childValues] : childValues;
    });
  }

  function findNodeByPath(
    nodes: TreeNode<TreeNodeData>[] | undefined,
    targetPath: string,
  ): RequireFields<TreeNode<TreeNodeData>, 'data'> | undefined {
    if (!nodes) return undefined;

    for (const node of nodes) {
      if (node.data?.path === targetPath) {
        return node as RequireFields<TreeNode<TreeNodeData>, 'data'>;
      }
      if (node.children && node.data && targetPath.startsWith(node.data.path)) {
        const found = findNodeByPath(node.children, targetPath);
        if (found) return found;
      }
    }
    return undefined;
  }

  function getParentPath(nodePath: string): string {
    const lastDot = nodePath.lastIndexOf('.');
    const lastBracket = nodePath.lastIndexOf('[');
    const lastSeparator = Math.max(lastDot, lastBracket);
    return lastSeparator > 0 ? nodePath.substring(0, lastSeparator) : binding.control.path;
  }

  function getRelativePath(nodePath: string): string | null {
    if (nodePath === binding.control.path) return null;
    // Strip the root control path prefix + the dot separator
    return nodePath.startsWith(binding.control.path + '.')
      ? nodePath.slice(binding.control.path.length + 1)
      : nodePath;
  }

  function getParentSchema(parentPath: string): JsonSchema | undefined {
    const parentRelativePath = getRelativePath(parentPath);
    if (parentRelativePath === null) return binding.control.schema;

    const segments = parentRelativePath.split('.');
    let currentSchema: JsonSchema = binding.control.schema;

    for (const segment of segments) {
      if (currentSchema.type === 'array') {
        // Only use items schema if the current schema is actually an array
        currentSchema = (currentSchema.items as JsonSchema) ?? {};
      } else {
        // Object property (key could be any string including numeric ones)
        currentSchema = currentSchema.properties?.[segment] ?? {};
      }
    }

    return currentSchema;
  }
  function isNodeNonEmpty(node: TreeNode<TreeNodeData>): boolean {
    if (node.data?.path) {
      const relativePath = getRelativePath(node.data.path);
      const data =
        relativePath === null ? binding.control.data : get(binding.control.data, relativePath);

      if (Array.isArray(data)) {
        return data.length > 0;
      }

      return typeof data === 'object' && data != null ? Object.keys(data).length > 0 : false;
    }
    return false;
  }

  function isDeleteDisabled(node: TreeNode<TreeNodeData>): boolean {
    if (!binding.control.enabled) return true;
    if (!binding.appliedOptions?.restrict) return false;

    const nodePath = node.data!.path;
    const parentPath = getParentPath(nodePath);
    const relativePath = getRelativePath(parentPath);
    const parentData =
      relativePath === null ? binding.control.data : get(binding.control.data, relativePath);
    let parentSchema = getParentSchema(parentPath);

    if (!parentSchema) return false;

    parentSchema = resolveSchema(parentSchema, binding.control.rootSchema);

    if (Array.isArray(parentData)) {
      // Array constraint: cannot delete below minItems
      return parentSchema.minItems !== undefined && parentData.length <= parentSchema.minItems;
    }

    if (typeof parentData === 'object' && parentData !== null) {
      // Object constraint: cannot delete below minProperties
      return (
        parentSchema.minProperties !== undefined &&
        Object.keys(parentData).length <= parentSchema.minProperties
      );
    }

    return false;
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  function handleSelectValueChange(details: { value: string[] }): void {
    const newIndex = details.value[0] ? parseInt(details.value[0]) : null;

    const newData =
      newIndex !== null
        ? createDefaultValue(mixedRenderInfos[newIndex].resolvedSchema, binding.control.rootSchema)
        : undefined;

    binding.handleChange(binding.control.path, newData);
  }

  function handleClearSelection(): void {
    binding.handleChange(binding.control.path, undefined);
  }

  function handleNodeClick(node: TreeNode<TreeNodeData>) {
    if (node.data) {
      navContext.selectPath(node.data.path);
    }
  }

  function handleNodeDelete(node: TreeNode<TreeNodeData>) {
    if (isDeleteDisabled(node)) return;

    if ((node.children && node.children.length > 0) || isNodeNonEmpty(node)) {
      // Show confirmation modal for non-empty nodes
      pendingDeleteNode = node;
    } else {
      commitDelete(node);
    }
  }

  function commitDelete(node: TreeNode<TreeNodeData>) {
    const nodePath = node.data!.path;
    const parentPath = getParentPath(nodePath);
    const key = nodePath
      .substring(parentPath.length)
      .replace(/^[.\[]/, '')
      .replace(/\]$/, '');
    const relativePath = getRelativePath(parentPath);
    const parentData =
      relativePath === null ? binding.control.data : get(binding.control.data, relativePath);

    if (Array.isArray(parentData)) {
      // Remove item from array
      const index = parseInt(key);
      const updated = [...parentData];
      updated.splice(index, 1);
      binding.handleChange(parentPath, updated);
    } else if (typeof parentData === 'object' && parentData !== null) {
      // Remove key from object
      const updated = { ...parentData };
      delete updated[key];
      binding.handleChange(parentPath, updated);
    }

    // Navigate to parent if we deleted the active node
    if (activeNodeId === nodePath || activeNodeId.startsWith(nodePath)) {
      navContext.selectPath(parentPath);
    }

    pendingDeleteNode = null;
  }

  function handleRename(node: TreeNode<TreeNodeData>) {
    renamingNodeId = node.id;
    renameValue = node.data!.label;
    renameError = null;
  }

  function commitRename(node: TreeNode<TreeNodeData>) {
    const trimmed = renameValue.trim();

    if (!trimmed || trimmed === node.data!.label) {
      cancelRename();
      return;
    }

    const nodePath = node.data!.path;
    const parentPath = getParentPath(nodePath);
    const oldKey = node.data!.label;
    const relativePath = getRelativePath(parentPath);
    const parentData =
      relativePath === null ? binding.control.data : get(binding.control.data, relativePath);

    if (typeof parentData === 'object' && parentData !== null && !Array.isArray(parentData)) {
      // 1. Check for duplicate key
      if (trimmed in parentData && trimmed !== oldKey) {
        renameError = `Property "${trimmed}" already exists`;
        return;
      }

      // 2. Get parent schema and resolve $ref
      let parentSchema = getParentSchema(parentPath);
      if (parentSchema) {
        parentSchema = resolveSchema(parentSchema, binding.control.rootSchema);
      }

      // 3. Check patternProperties constraints
      if (parentSchema?.patternProperties) {
        const hasMatchingPattern = Object.keys(parentSchema.patternProperties).some((pattern) =>
          new RegExp(pattern).test(trimmed),
        );
        const hadMatchingPattern = Object.keys(parentSchema.patternProperties).some((pattern) =>
          new RegExp(pattern).test(oldKey),
        );
        if (hadMatchingPattern && !hasMatchingPattern) {
          renameError = `Property name must match pattern: ${Object.keys(parentSchema.patternProperties).join(', ')}`;
          return;
        }
      }

      // 4. Check propertyNames schema
      const propertyNames = (parentSchema as any)?.propertyNames as JsonSchema;
      if (propertyNames?.pattern) {
        const pattern = new RegExp(propertyNames.pattern!);
        if (!pattern.test(trimmed)) {
          renameError = `Property name must match pattern: ${propertyNames.pattern}`;
          return;
        }
      }

      renameError = null;

      // Preserve key order by rebuilding the object
      const updated = Object.fromEntries(
        Object.entries(parentData).map(([k, v]) => [k === oldKey ? trimmed : k, v]),
      );
      binding.handleChange(parentPath, updated);

      // Navigate to the renamed node's new path
      const newPath = compose(parentPath, trimmed);
      navContext.selectPath(newPath);
    }

    renamingNodeId = null;
  }

  function cancelRename() {
    renamingNodeId = null;
    renameValue = '';
    renameError = null;
  }

  // ============================================================================
  // Effects
  // ============================================================================

  // Initialize selectedIndex based on current data type
  $effect(() => {
    let matchingInfo = mixedRenderInfos.find(
      (entry) => entry.resolvedSchema.type === inputDataType,
    );
    if (!matchingInfo) {
      // special case: integer is a subtype of number
      matchingInfo = mixedRenderInfos.find(
        (entry) => entry.resolvedSchema.type === 'number' && inputDataType === 'integer',
      );
    }

    const newIndex = matchingInfo ? matchingInfo.index : null;

    if (selectedIndex !== newIndex) {
      untrack(() => {
        selectedIndex = newIndex;
      });
    }
  });

  $effect(() => {
    const targetPath = activeNodeId;
    const treeVisible = showTreeView;

    if (
      !isRoot ||
      !treeVisible ||
      !targetPath ||
      targetPath === binding.control.path ||
      !targetPath.startsWith(binding.control.path)
    ) {
      return;
    }

    untrack(() => {
      currentlyExpanded = true;
      expandedNodes = Array.from(
        new Set([...expandedNodes, ...getExpandedPathsForSelection(targetPath)]),
      );
    });
  });

  // Watch control data for changes
  $effect(() => {
    shouldRebuildTree = false;
    const newData = binding.control.data;

    if (newData !== previousData) {
      untrack(() => {
        const structuralChange = hasStructuralChange(previousData, newData, showPrimitivesInTree);
        previousData = newData;

        if (structuralChange) {
          shouldRebuildTree = true;
        }

        const newType = getJsonDataType(newData);
        if (inputDataType !== newType) {
          inputDataType = newType;
        }
      });
    }
  });

  // Rebuild tree when structure changes
  $effect(() => {
    if (showTreeView) {
      if (shouldRebuildTree || treeNodes === undefined) {
        untrack(() => {
          treeNodes = buildTreeFromData(
            binding.control.data,
            binding.control.schema,
            binding.control.rootSchema,
            binding.control.path,
            binding.control.label,
            showPrimitivesInTree,
          );
          shouldRebuildTree = false;
        });
      }
    } else {
      untrack(() => {
        treeNodes = undefined;
      });
    }
  });

  // Rebuild tree when showPrimitivesInTree toggles
  $effect(() => {
    const primitives = showPrimitivesInTree; // tracked
    untrack(() => {
      if (showTreeView && treeNodes !== undefined) {
        treeNodes = buildTreeFromData(
          binding.control.data,
          binding.control.schema,
          binding.control.rootSchema,
          binding.control.path,
          binding.control.label,
          primitives,
        );
      }
    });
  });

  // use the default value since all properties are dynamic so preserve the property key
  setIsDynamicProperty(true);

  const searchInputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');

    return {
      ...skeletonProps,
      type: 'text',
      placeholder: 'Search tree...',
      class: twMerge('mb-4', skeletonProps.class),
    };
  });

  const renameInputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');

    return {
      ...skeletonProps,
      type: 'text',
      class: twMerge(
        'input min-w-0 flex-1 text-sm',
        renameError ? 'border-red-500' : 'border-primary-500',
        skeletonProps.class,
      ),
    };
  });

  const treeActionButtonProps = (className: string, ariaLabel: string) => {
    const skeletonProps = binding.skeletonProps('button');

    return {
      ...skeletonProps,
      'aria-label': ariaLabel,
      class: twMerge('btn btn-sm p-1', className, skeletonProps.class),
    };
  };

  const filteredTreeNodes = $derived(filterTreeNodes(treeNodes, searchQuery));
  const treeCollection = $derived(
    createTreeViewCollection<TreeNode<TreeNodeData>>({
      nodeToValue: (node) => node.id,
      nodeToString: (node) => node.label,
      nodeToChildren: (node) => node.children ?? [],
      rootNode: {
        id: '__root__',
        label: binding.control.label,
        children: filteredTreeNodes,
      },
    }),
  );
  const treeExpandedValue = $derived(
    searchQuery.trim() ? collectExpandedValues(filteredTreeNodes) : expandedNodes,
  );
  const selectorRowOffsetClass = $derived(binding.control.label ? 'pt-6' : '');

  const typeSelectorComboboxProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Combobox');

    return {
      ...skeletonProps,
      collection,
      value:
        selectedIndex === null || selectedIndex === undefined ? [] : [selectedIndex.toString()],
      allowCustomValue: false,
      closeOnSelect: true,
      selectionBehavior: 'replace' as const,
      getRootNode,
      disabled: !binding.control.enabled,
      invalid: !!binding.control.errors,
      required: binding.control.required,
      placeholder: 'Select type...',
      onValueChange: handleSelectValueChange,
    };
  });

  const typeSelectorInputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Combobox.Input');

    return {
      ...skeletonProps,
      id: `${binding.control.id}-input-selector`,
      class: twMerge(binding.styles.control.input, skeletonProps.class, 'w-full pe-20'),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
    };
  });
</script>

{#snippet typeSelector(stopPropagation: boolean)}
  <Combobox {...typeSelectorComboboxProps}>
    <Combobox.Control
      class="group relative w-full"
      onclick={stopPropagation ? (e: Event) => e.stopPropagation() : undefined}
      onmousedown={stopPropagation ? (e: MouseEvent) => e.stopPropagation() : undefined}
    >
      <Combobox.Input {...typeSelectorInputProps} />
      {#if selectedIndex !== null && selectedIndex !== undefined}
        <Combobox.ClearTrigger
          class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
          style="position: absolute; inset-block: 0; inset-inline-end: 2.25rem; margin-block: auto;"
          onmousedown={(event: MouseEvent) => {
            event.preventDefault();
            if (stopPropagation) event.stopPropagation();
          }}
          onclick={(event: MouseEvent) => {
            if (stopPropagation) event.stopPropagation();
            handleClearSelection();
          }}
          disabled={!binding.control.enabled}
          aria-label="Clear value"
        >
          <XIcon class="size-4 shrink-0" />
        </Combobox.ClearTrigger>
      {/if}
      <Combobox.Trigger />
    </Combobox.Control>

    <Portal target={getPortalTarget()}>
      <Combobox.Positioner>
        <Combobox.Content>
          {#each selectItems as item (item.value)}
            <Combobox.Item {item}>
              <Combobox.ItemText>{item.name}</Combobox.ItemText>
              <Combobox.ItemIndicator />
            </Combobox.Item>
          {/each}
        </Combobox.Content>
      </Combobox.Positioner>
    </Portal>
  </Combobox>
{/snippet}

{#if binding.control.visible}
  {#if showTreeView}
    <!-- Root level with tree view -->
    <Accordion
      collapsible
      value={currentlyExpanded ? ['mixed-root'] : []}
      onValueChange={(details) => (currentlyExpanded = details.value.includes('mixed-root'))}
    >
      <Accordion.Item value="mixed-root">
        <Accordion.ItemTrigger
          class="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
          onclick={() => navContext.selectPath(binding.control.path)}
        >
          <div class="flex min-w-0 flex-1 flex-row items-start gap-4">
            <div class="min-w-32 shrink-0">
              <ControlWrapper {...binding.controlWrapper}>
                {@render typeSelector(true)}
              </ControlWrapper>
            </div>
            <div class="flex flex-1 items-center pt-6">
              <p class="truncate text-sm font-medium">{binding.control.label}</p>
            </div>
          </div>
          <Accordion.ItemIndicator class="group shrink-0">
            <ChevronDownOutline class="size-4 group-data-[state=open]:hidden" />
            <ChevronUpOutline class="hidden size-4 group-data-[state=open]:block" />
          </Accordion.ItemIndicator>
        </Accordion.ItemTrigger>

        <Accordion.ItemContent {...binding.skeletonProps('Accordion.ItemContent')}>
          <SplitPane initialSizes={[25, 75]}>
            <Pane>
              <div
                class="pointer-events-auto flex h-full min-h-0 flex-col ps-1 pe-4 pt-1 select-text"
              >
                <input
                  {...searchInputProps}
                  class={twMerge('input mb-4', searchInputProps.class)}
                  bind:value={searchQuery}
                />
                {#if treeNodes}
                  <div class="min-h-0 flex-1 overflow-auto">
                    <TreeView
                      collection={treeCollection}
                      expandedValue={treeExpandedValue}
                      selectedValue={activeNodeId ? [activeNodeId] : []}
                      onExpandedChange={(details) => {
                        if (!searchQuery.trim()) {
                          expandedNodes = details.expandedValue;
                        }
                      }}
                      onSelectionChange={(details) => {
                        const selectedValue = details.selectedValue[0];
                        if (selectedValue) {
                          navContext.selectPath(selectedValue);
                          const node = findNodeByPath(treeNodes, selectedValue);
                          if (node) handleNodeClick(node);
                        }
                      }}
                    >
                      <TreeView.Tree class="w-full space-y-1">
                        {#each treeCollection.rootNode.children || [] as node, index (node.id)}
                          {@render renderTreeNode(node, [index])}
                        {/each}
                      </TreeView.Tree>
                    </TreeView>
                  </div>
                {/if}
              </div>
            </Pane>
            <Pane>
              <div class="pointer-events-auto ps-4 pe-4 select-text">
                {#if selectedNode}
                  {#if breadcrumbSegments.length > 0}
                    <nav
                      aria-label="Navigation path"
                      class="mb-3 flex flex-wrap items-center gap-2 text-sm"
                    >
                      {#each breadcrumbSegments as segment, index}
                        <button
                          type="button"
                          onclick={() => navContext.selectPath(segment.path)}
                          class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {segment.label}
                        </button>
                        {#if index < breadcrumbSegments.length - 1}
                          <span>/</span>
                        {/if}
                      {/each}
                    </nav>
                  {/if}
                  <DispatchRenderer
                    schema={selectedNode.data.control.schema}
                    uischema={selectedNode.data.control.uischema}
                    path={selectedNode.data.control.path}
                    renderers={binding.control.renderers}
                    cells={binding.control.cells}
                    enabled={selectedNode.data.control.enabled}
                  />
                {/if}
              </div>
            </Pane>
          </SplitPane>
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion>

    <!-- Delete confirmation modal -->
    {#if pendingDeleteNode}
      <Dialog
        open={pendingDeleteNode !== null}
        getRootNode={getRootNode}
        onOpenChange={(e) => !e.open && (pendingDeleteNode = null)}
      >
        <Portal target={getPortalTarget()}>
          <Dialog.Backdrop class="bg-surface-950/40 fixed inset-0" />
          <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Content class="card preset-filled-surface-50-950 w-full max-w-md p-6">
              <Dialog.Title class="mb-3 text-lg font-semibold">Confirm Delete</Dialog.Title>
              <p class="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete <strong>{pendingDeleteNode.data?.label}</strong>?
                {#if pendingDeleteNode.data?.type === 'object' || pendingDeleteNode.data?.type === 'array'}
                  This will permanently remove all nested content.
                {/if}
              </p>
              <div class="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  class="btn preset-filled-error-500"
                  onclick={() => commitDelete(pendingDeleteNode!)}>Delete</button
                >
                <button
                  type="button"
                  class="btn preset-outlined"
                  onclick={() => (pendingDeleteNode = null)}>Cancel</button
                >
              </div>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog>
    {/if}
  {:else if isNestedComplexType}
    <!-- Nested complex type - show type selector with view button -->
    <div class="flex flex-row items-start gap-2">
      <div class="min-w-32 shrink-0">
        <ControlWrapper {...binding.controlWrapper}>
          {@render typeSelector(false)}
        </ControlWrapper>
      </div>
      <div class={twMerge('flex flex-1 items-center', selectorRowOffsetClass)}>
        <button
          type="button"
          class="btn preset-filled"
          onclick={() => parentNavContext?.selectPath(binding.control.path)}
          title={`View ${binding.control.label ?? (inputDataType === 'object' ? 'Object' : 'Array')}`}
        >
          <EyeOutline class="h-4 w-4" />
        </button>
      </div>
    </div>
  {:else}
    <!-- Primitive type -->
    <div class="flex flex-row items-start">
      <div
        class={`${schema && uischema && !(nullable && binding.control.data === null) ? 'min-w-32 shrink-0' : 'w-full'}`}
      >
        <ControlWrapper {...binding.controlWrapper}>
          {@render typeSelector(false)}
        </ControlWrapper>
      </div>
      {#if schema && uischema && !(nullable && binding.control.data === null)}
        <div
          class={twMerge(
            'flex-1',
            inputDataType === 'boolean' ? 'ps-2' : '',
            inputDataType === 'boolean' ? selectorRowOffsetClass : '',
          )}
        >
          <DispatchRenderer
            {schema}
            {uischema}
            {path}
            renderers={binding.control.renderers}
            cells={binding.control.cells}
            enabled={binding.control.enabled}
          />
        </div>
      {/if}
    </div>
  {/if}
{/if}

{#snippet renderTreeNode(node: TreeNode<TreeNodeData>, indexPath: number[])}
  <TreeView.NodeProvider value={{ node, indexPath }}>
    {@const active = activeNodeId === node.id}
    {#if node.children && node.children.length > 0}
      <TreeView.Branch class="w-full">
        <TreeView.BranchControl
          class={twMerge(
            'group rounded-container flex w-full items-center gap-2 text-left',
            active ? 'preset-filled-primary-500' : 'hover:preset-tonal',
          )}
          onclick={() => {
            if (node.data?.path === binding.control.path) {
              navContext.selectPath(node.data.path);
            }
          }}
        >
          <TreeView.BranchIndicator>
            <ChevronRightIcon class="size-4 transition-transform data-[state=open]:rotate-90" />
          </TreeView.BranchIndicator>
          <TreeView.BranchText class="flex min-w-0 flex-1 items-center gap-1">
            <div class="group flex min-w-0 flex-1 items-center gap-1">
              {#if node.data?.type}
                <JsonTypeIcon type={node.data.type} {active} />
              {/if}

              {#if renamingNodeId === node.id}
                <div class="flex min-w-0 flex-1 flex-col">
                  <input
                    {...renameInputProps}
                    bind:value={renameValue}
                    onclick={(e: MouseEvent) => e.stopPropagation()}
                    onkeydown={(e: KeyboardEvent) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') commitRename(node);
                      if (e.key === 'Escape') cancelRename();
                    }}
                    onblur={() => commitRename(node)}
                  />
                  {#if renameError}
                    <span class="mt-0.5 text-xs text-red-500">{renameError}</span>
                  {/if}
                </div>
              {:else}
                <span class="min-w-0 flex-1 truncate text-start text-sm">{node.label}</span>
              {/if}

              {#if renamingNodeId !== node.id && binding.control.enabled}
                <div class="ms-auto flex shrink-0 items-center gap-0.5">
                  <!-- Show primitives toggle - always visible, only on root node -->
                  {#if node.data?.path === binding.control.path}
                    <button
                      {...treeActionButtonProps(
                        `rounded p-0.5 ${
                          active
                            ? showPrimitivesInTree
                              ? 'text-white'
                              : 'text-white opacity-50'
                            : showPrimitivesInTree
                              ? 'text-primary-500 dark:text-primary-400'
                              : 'text-gray-400 dark:text-gray-500'
                        }`,
                        showPrimitivesInTree ? 'Hide primitives' : 'Show primitives',
                      )}
                      title={showPrimitivesInTree ? 'Hide primitives' : 'Show primitives'}
                      onclick={(e: MouseEvent) => {
                        e.stopPropagation();
                        showPrimitivesInTree = !showPrimitivesInTree;
                      }}
                    >
                      {#if showPrimitivesInTree}
                        <EyeOutline class="h-3 w-3" />
                      {:else}
                        <EyeSlashOutline class="h-3 w-3" />
                      {/if}
                    </button>
                  {/if}

                  <!-- Rename/delete - visible on hover for non-root nodes -->
                  {#if node.data?.path !== binding.control.path}
                    <div
                      class="invisible flex items-center gap-0.5 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100"
                    >
                      {#if node.data?.canRename}
                        <button
                          {...treeActionButtonProps(
                            `rounded p-0.5 ${
                              active
                                ? 'hover:bg-primary-800 text-white'
                                : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'
                            }`,
                            'Rename',
                          )}
                          title="Rename"
                          onclick={(e: MouseEvent) => {
                            e.stopPropagation();
                            handleRename(node);
                          }}
                        >
                          <PenOutline class="h-3 w-3" />
                        </button>
                      {/if}
                      {#if node.data?.canDelete && !isDeleteDisabled(node)}
                        <button
                          {...treeActionButtonProps(
                            `rounded p-0.5 ${
                              active
                                ? 'text-white hover:bg-red-600'
                                : 'text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900'
                            }`,
                            'Delete',
                          )}
                          title="Delete"
                          onclick={(e: MouseEvent) => {
                            e.stopPropagation();
                            handleNodeDelete(node);
                          }}
                        >
                          <TrashBinOutline class="h-3 w-3" />
                        </button>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          </TreeView.BranchText>
        </TreeView.BranchControl>
        <TreeView.BranchContent>
          <TreeView.BranchIndentGuide class="border-surface-200-800" />
          {#each node.children as childNode, childIndex (childNode.id)}
            {@render renderTreeNode(childNode, [...indexPath, childIndex])}
          {/each}
        </TreeView.BranchContent>
      </TreeView.Branch>
    {:else}
      <TreeView.Item
        class={twMerge(
          'group rounded-container flex w-full items-center gap-2 text-left',
          active ? 'preset-filled-primary-500' : 'hover:preset-tonal',
        )}
      >
        <div class="flex min-w-0 flex-1 items-center gap-1">
          <div class="group flex min-w-0 flex-1 items-center gap-1">
            {#if node.data?.type}
              <JsonTypeIcon type={node.data.type} {active} />
            {/if}
            {#if renamingNodeId === node.id}
              <div class="flex min-w-0 flex-1 flex-col">
                <input
                  {...renameInputProps}
                  bind:value={renameValue}
                  onclick={(e: MouseEvent) => e.stopPropagation()}
                  onkeydown={(e: KeyboardEvent) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') commitRename(node);
                    if (e.key === 'Escape') cancelRename();
                  }}
                  onblur={() => commitRename(node)}
                />
                {#if renameError}
                  <span class="mt-0.5 text-xs text-red-500">{renameError}</span>
                {/if}
              </div>
            {:else}
              <span class="min-w-0 flex-1 truncate text-start text-sm">{node.label}</span>
            {/if}

            {#if renamingNodeId !== node.id && binding.control.enabled && node.data?.path !== binding.control.path}
              <div
                class="invisible ms-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100"
              >
                {#if node.data?.canRename}
                  <button
                    {...treeActionButtonProps(
                      `rounded p-0.5 ${
                        active
                          ? 'hover:bg-primary-800 text-white'
                          : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'
                      }`,
                      'Rename',
                    )}
                    title="Rename"
                    onclick={(e: MouseEvent) => {
                      e.stopPropagation();
                      handleRename(node);
                    }}
                  >
                    <PenOutline class="h-3 w-3" />
                  </button>
                {/if}
                {#if node.data?.canDelete && !isDeleteDisabled(node)}
                  <button
                    {...treeActionButtonProps(
                      `rounded p-0.5 ${
                        active
                          ? 'text-white hover:bg-red-600'
                          : 'text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900'
                      }`,
                      'Delete',
                    )}
                    title="Delete"
                    onclick={(e: MouseEvent) => {
                      e.stopPropagation();
                      handleNodeDelete(node);
                    }}
                  >
                    <TrashBinOutline class="h-3 w-3" />
                  </button>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </TreeView.Item>
    {/if}
  </TreeView.NodeProvider>
{/snippet}
