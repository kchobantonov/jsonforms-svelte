<script lang="ts">
  import JsonTypeIcon from '$lib/complex/components/JsonTypeIcon.svelte';
  import TreeView from '$lib/complex/components/TreeView/TreeView.svelte';
  import type { FilterFunction, TreeNode } from '$lib/complex/components/TreeView/types';
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
    Accordion,
    AccordionItem,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Input,
    Modal,
    P,
    Pane,
    Select,
    SplitPane,
    ToolbarButton,
    Tooltip,
  } from 'flowbite-svelte';
  import { EyeOutline, EyeSlashOutline, PenOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import get from 'lodash/get';
  import { getContext, setContext, untrack } from 'svelte';
  import {
    NavigationContextSymbol,
    setIsDynamicProperty,
    useCombinatorTranslations,
    useFlowbiteControl,
  } from '../util';
  import {
    getJsonDataType,
    hasStructuralChange,
    resolveSchema,
    type JsonDataType,
  } from './util/jsonTypeUtils';
  import { createMixedRenderInfos, type SchemaRenderInfo } from './util/schemaUtils';
  import { buildTreeFromData, type TreeNodeData } from './util/treeBuilder.svelte';

  // ============================================================================
  // Types
  // ============================================================================

  interface TreeNodeControl {
    id: string;
    schema: JsonSchema;
    uischema: ControlElement;
    path: string;
    label: string;
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
  const binding = useCombinatorTranslations(useFlowbiteControl(useJsonFormsControl(props)));

  const jsonforms = useJsonForms();
  const t = useTranslator();

  // ============================================================================
  // Navigation Context
  // ============================================================================

  const parentNavContext = getContext<NavigationContext | undefined>(NavigationContextSymbol);
  const isRoot = !parentNavContext;

  const navContext: NavigationContext = {
    get rootControl() {
      return binding.control;
    },
    selectPath: (path: string) => {
      activeNodeId = path;
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

  const customFilter: FilterFunction = (value, query, item) => {
    return value?.toLowerCase().includes(query.toLowerCase()) ?? false;
  };

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

  function handleSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newIndex = target.value ? parseInt(target.value) : null;

    const newData =
      newIndex !== null
        ? createDefaultValue(mixedRenderInfos[newIndex].resolvedSchema, binding.control.rootSchema)
        : undefined;

    binding.handleChange(binding.control.path, newData);
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

  function focusOnMount(element: HTMLElement) {
    element.focus();
  }
</script>

{#if binding.control.visible}
  {#if showTreeView}
    <!-- Root level with tree view -->
    <Accordion flush>
      <AccordionItem
        open={currentlyExpanded}
        class="border-b last:border-b-0"
        classes={{ button: 'p-0' }}
      >
        {#snippet header()}
          <div class="flex flex-row items-baseline gap-4">
            <div class="min-w-32 shrink-0">
              <ControlWrapper {...binding.controlWrapper}>
                <Select
                  id={binding.control.id + '-input-selector'}
                  disabled={!binding.control.enabled}
                  items={selectItems}
                  value={selectedIndex?.toString() ?? ''}
                  placeholder="Select type..."
                  onclick={(e: Event) => e.stopPropagation()}
                  onchange={handleSelectChange}
                  clearable={binding.control.enabled}
                  onClear={() => binding.handleChange(binding.control.path, undefined)}
                  onfocus={binding.handleFocus}
                  onblur={binding.handleBlur}
                  required={binding.control.required}
                  aria-invalid={!!binding.control.errors}
                  class="w-full"
                />
              </ControlWrapper>
            </div>
            <div class="flex-1">
              <P>{binding.control.label}</P>
            </div>
          </div>
        {/snippet}

        <SplitPane initialSizes={[25, 75]}>
          <Pane>
            <div class="pointer-events-auto flex flex-col pe-4 select-text">
              <Input type="text" bind:value={searchQuery} placeholder="Search tree..." class="mb-4"
              ></Input>
              {#if treeNodes}
                <TreeView
                  nodes={treeNodes}
                  bind:expandedNodes
                  bind:activeNodeId
                  search={searchQuery}
                  {customFilter}
                  filterKeys={['label', 'data.description']}
                  filterMode="intersection"
                  onNodeClick={handleNodeClick}
                  onNodeDelete={handleNodeDelete}
                  scrollable={true}
                  maxHeight="calc(100vh - 300px)"
                >
                  {#snippet nodeSnippet({ node, active, onDelete })}
                    <div class="group flex min-w-0 flex-1 items-center gap-1">
                      <!-- Type icon -->
                      {#if node.data?.type}
                        <JsonTypeIcon type={node.data.type} {active} />
                      {:else}
                        <svg
                          class="h-4 w-4 shrink-0 {active
                            ? 'text-white dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'}"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                          />
                        </svg>
                      {/if}

                      <!-- Label or rename input -->
                      {#if renamingNodeId === node.id}
                        <div class="flex min-w-0 flex-1 flex-col">
                          <input
                            type="text"
                            bind:value={renameValue}
                            class="min-w-0 flex-1 rounded border px-1 py-0.5 text-sm text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white
                              {renameError ? 'border-red-500' : 'border-primary-500'}"
                            onclick={(e) => e.stopPropagation()}
                            onkeydown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter') commitRename(node);
                              if (e.key === 'Escape') cancelRename();
                            }}
                            onblur={() => commitRename(node)}
                            use:focusOnMount
                          />
                          {#if renameError}
                            <span class="mt-0.5 text-xs text-red-500">{renameError}</span>
                          {/if}
                        </div>
                      {:else}
                        <span class="min-w-0 flex-1 truncate text-start text-sm">
                          {node.label}
                        </span>
                      {/if}

                      <!-- Action buttons -->
                      {#if renamingNodeId !== node.id && binding.control.enabled}
                        <div class="ms-auto flex shrink-0 items-center gap-0.5">
                          <!-- Show primitives toggle - always visible, only on root node -->
                          {#if node.data?.path === binding.control.path}
                            <button
                              type="button"
                              title={showPrimitivesInTree ? 'Hide primitives' : 'Show primitives'}
                              onclick={(e) => {
                                e.stopPropagation();
                                showPrimitivesInTree = !showPrimitivesInTree;
                              }}
                              class="rounded p-0.5 {active
                                ? showPrimitivesInTree
                                  ? 'text-white'
                                  : 'text-white opacity-50'
                                : showPrimitivesInTree
                                  ? 'text-primary-500 dark:text-primary-400'
                                  : 'text-gray-400 dark:text-gray-500'}"
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
                            <div class="hidden items-center gap-0.5 group-hover:flex">
                              {#if node.data?.canRename}
                                <button
                                  type="button"
                                  class="rounded p-0.5 {active
                                    ? 'hover:bg-primary-800 text-white'
                                    : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'}"
                                  title="Rename"
                                  onclick={(e) => {
                                    e.stopPropagation();
                                    handleRename(node);
                                  }}
                                >
                                  <PenOutline class="h-3 w-3" />
                                </button>
                              {/if}
                              {#if node.data?.canDelete && !isDeleteDisabled(node)}
                                <button
                                  type="button"
                                  class="rounded p-0.5 {active
                                    ? 'text-white hover:bg-red-600'
                                    : 'text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900'}"
                                  title="Delete"
                                  onclick={(e) => {
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
                  {/snippet}
                </TreeView>
              {/if}
            </div>
          </Pane>
          <Pane>
            <div class="pointer-events-auto ps-4 pe-4 select-text">
              {#if selectedNode}
                {#if breadcrumbSegments.length > 0}
                  <Breadcrumb aria-label="Navigation path" class="mb-0">
                    {#each breadcrumbSegments as segment, index}
                      <BreadcrumbItem
                        home={index === 0}
                        onclick={() => navContext.selectPath(segment.path)}
                        class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <P class="text-sm">{segment.label}</P>
                      </BreadcrumbItem>
                    {/each}
                  </Breadcrumb>
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
      </AccordionItem>
    </Accordion>

    <!-- Delete confirmation modal -->
    {#if pendingDeleteNode}
      <Modal
        title="Confirm Delete"
        open={pendingDeleteNode !== null}
        onclose={() => (pendingDeleteNode = null)}
      >
        <p class="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete <strong>{pendingDeleteNode.data?.label}</strong>?
          {#if pendingDeleteNode.data?.type === 'object' || pendingDeleteNode.data?.type === 'array'}
            This will permanently remove all nested content.
          {/if}
        </p>
        {#snippet footer()}
          <Button color="red" onclick={() => commitDelete(pendingDeleteNode!)}>Delete</Button>
          <Button color="alternative" onclick={() => (pendingDeleteNode = null)}>Cancel</Button>
        {/snippet}
      </Modal>
    {/if}
  {:else if isNestedComplexType}
    <!-- Nested complex type - show type selector with view button -->
    <div class="flex flex-row items-center gap-2">
      <div class="min-w-32 shrink-0">
        <ControlWrapper {...binding.controlWrapper}>
          <Select
            id={binding.control.id + '-input-selector'}
            disabled={!binding.control.enabled}
            items={selectItems}
            value={selectedIndex?.toString() ?? ''}
            placeholder="Select type..."
            onchange={handleSelectChange}
            clearable={binding.control.enabled}
            onClear={() => binding.handleChange(binding.control.path, undefined)}
            onfocus={binding.handleFocus}
            onblur={binding.handleBlur}
            required={binding.control.required}
            aria-invalid={!!binding.control.errors}
            class="w-full"
          />
        </ControlWrapper>
      </div>
      <div class="flex-1">
        <ToolbarButton
          color="primary"
          onclick={() => parentNavContext?.selectPath(binding.control.path)}
        >
          <EyeOutline class="h-4 w-4" />
          <Tooltip>
            View {binding.control.label ?? (inputDataType === 'object' ? 'Object' : 'Array')}
          </Tooltip>
        </ToolbarButton>
      </div>
    </div>
  {:else}
    <!-- Primitive type -->
    <div class="flex flex-row items-start">
      <div
        class={`${schema && uischema && !(nullable && binding.control.data === null) ? 'min-w-32 shrink-0' : 'w-full'}`}
      >
        <ControlWrapper {...binding.controlWrapper}>
          <Select
            id={binding.control.id + '-input-selector'}
            disabled={!binding.control.enabled}
            items={selectItems}
            value={selectedIndex?.toString() ?? ''}
            placeholder="Select type..."
            onchange={handleSelectChange}
            clearable={binding.control.enabled}
            onClear={() => binding.handleChange(binding.control.path, undefined)}
            onfocus={binding.handleFocus}
            onblur={binding.handleBlur}
            required={binding.control.required}
            aria-invalid={!!binding.control.errors}
            class="w-full"
          />
        </ControlWrapper>
      </div>
      {#if schema && uischema && !(nullable && binding.control.data === null)}
        <div class={`flex-1 ${inputDataType === 'boolean' ? 'ps-2' : ''}`}>
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
