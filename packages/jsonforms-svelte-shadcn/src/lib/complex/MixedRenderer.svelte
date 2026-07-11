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
    ChevronRightIcon,
    EyeIcon as EyeOutline,
    EyeOffIcon as EyeSlashOutline,
    PencilIcon as PenOutline,
    Trash2Icon as TrashBinOutline,
    XIcon,
  } from '@lucide/svelte';
  import * as Accordion from '$lib/components/ui/accordion';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb';
  import { Button } from '$lib/components/ui/button';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import get from 'lodash/get';
  import { getContext, setContext, untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    getPortalTarget,
    NavigationContextSymbol,
    setIsDynamicProperty,
    useCombinatorTranslations,
    useShadcnControl,
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
  const binding = useCombinatorTranslations(useShadcnControl(useJsonFormsControl(props)));

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
      .split(/[.[\]]/)
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
      .split(/[.[\]]/)
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

  function handleSelectValueChange(value: string): void {
    const selectedValue = value || null;
    const newIndex = selectedValue ? parseInt(selectedValue, 10) : null;

    if (newIndex !== null && (!Number.isFinite(newIndex) || !mixedRenderInfos[newIndex])) {
      return;
    }

    if (newIndex === null) {
      inputDataType = null;
    } else {
      const selectedType = mixedRenderInfos[newIndex].resolvedSchema.type;
      if (typeof selectedType === 'string') {
        inputDataType = selectedType as JsonDataType;
      }
    }

    selectedIndex = newIndex;

    const newData =
      newIndex !== null
        ? createDefaultValue(mixedRenderInfos[newIndex].resolvedSchema, binding.control.rootSchema)
        : undefined;

    binding.handleChange(binding.control.path, newData);
  }

  function handleClearSelection(): void {
    inputDataType = null;
    selectedIndex = null;
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
    const key = nodePath.substring(parentPath.length).replace(/^[.[]/, '').replace(/\]$/, '');
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

  function schemaSupportsInputType(
    schemaType: JsonSchema['type'] | undefined,
    dataType: JsonDataType | null,
  ): boolean {
    if (!dataType || typeof schemaType !== 'string') {
      return false;
    }

    // JSON Schema "number" accepts integer values as well.
    return schemaType === dataType || (schemaType === 'number' && dataType === 'integer');
  }

  // ============================================================================
  // Effects
  // ============================================================================

  // Initialize selectedIndex based on current data type
  $effect(() => {
    const currentlySelected =
      selectedIndex !== null && selectedIndex !== undefined
        ? mixedRenderInfos[selectedIndex]
        : undefined;

    if (
      currentlySelected &&
      schemaSupportsInputType(currentlySelected.resolvedSchema.type, inputDataType)
    ) {
      return;
    }

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
    const shadcnProps = binding.shadcnProps('input');

    return {
      ...shadcnProps,
      type: 'text',
      placeholder: 'Search tree...',
      class: twMerge('mb-4', shadcnProps.class),
    };
  });

  const renameInputProps = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');

    return {
      ...shadcnProps,
      type: 'text',
      class: twMerge(
        'input min-w-0 flex-1 text-sm',
        renameError ? 'border-red-500' : 'border-primary-500',
        shadcnProps.class,
      ),
    };
  });

  const treeActionButtonProps = (className: string, ariaLabel: string) => {
    const shadcnProps = binding.shadcnProps('button');

    return {
      ...shadcnProps,
      'aria-label': ariaLabel,
      class: twMerge(className, shadcnProps.class),
    };
  };

  const filteredTreeNodes = $derived(filterTreeNodes(treeNodes, searchQuery));
  const treeExpandedValue = $derived(
    searchQuery.trim() ? collectExpandedValues(filteredTreeNodes) : expandedNodes,
  );
  const selectorRowOffsetClass = $derived(binding.control.label ? 'pt-6' : '');

  const selectedTypeValue = $derived(selectedIndex == null ? undefined : selectedIndex.toString());
  const selectedTypeLabel = $derived(
    selectItems.find((item) => item.value === selectedTypeValue)?.name,
  );
</script>

{#snippet typeSelector(stopPropagation: boolean)}
  <div class="group relative w-full">
    <Select.Root
      type="single"
      value={selectedTypeValue}
      onValueChange={handleSelectValueChange}
      disabled={!binding.control.enabled}
      required={binding.control.required}
      {...binding.shadcnProps('Select')}
    >
      <Select.Trigger
        id={`${binding.control.id}-input-selector`}
        class={twMerge(
          binding.styles.control.input,
          'h-10 w-full',
          selectedIndex != null ? 'pe-16' : '',
        )}
        aria-invalid={!!binding.control.errors}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
        onclick={stopPropagation ? (event: MouseEvent) => event.stopPropagation() : undefined}
        onmousedown={stopPropagation ? (event: MouseEvent) => event.stopPropagation() : undefined}
      >
        <span class={selectedTypeLabel ? '' : 'text-muted-foreground'}>
          {selectedTypeLabel ?? 'Select type...'}
        </span>
      </Select.Trigger>
      <Select.Content portalProps={{ to: getPortalTarget() }}>
        {#each selectItems as item (item.value)}
          <Select.Item value={item.value} label={item.name}>{item.name}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if selectedIndex !== null && selectedIndex !== undefined}
      <Button
        variant="ghost"
        size="icon-xs"
        class="absolute inset-y-0 end-8 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
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
      </Button>
    {/if}
  </div>
{/snippet}

{#if binding.control.visible}
  {#if showTreeView}
    <!-- Root level with tree view -->
    <Accordion.Root
      type="single"
      value={currentlyExpanded ? 'mixed-root' : ''}
      onValueChange={(value) => (currentlyExpanded = value === 'mixed-root')}
    >
      <Accordion.Item value="mixed-root">
        <Accordion.Trigger
          class="flex w-full items-center justify-between gap-3 px-4 py-4 text-start"
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
        </Accordion.Trigger>

        <Accordion.Content {...binding.shadcnProps('Accordion.ItemContent')}>
          <SplitPane initialSizes={[25, 75]}>
            <Pane>
              <div
                class="pointer-events-auto flex h-full min-h-0 flex-col ps-1 pe-4 pt-1 select-text"
              >
                <Input
                  {...searchInputProps}
                  class={twMerge('input mb-4', searchInputProps.class)}
                  bind:value={searchQuery}
                />
                {#if treeNodes}
                  <div class="min-h-0 flex-1 overflow-auto">
                    <div role="tree" class="w-full space-y-1">
                      {#each filteredTreeNodes as node, index (node.id)}
                        {@render renderTreeNode(node, [index])}
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </Pane>
            <Pane>
              <div class="pointer-events-auto ps-4 pe-4 select-text">
                {#if selectedNode}
                  {#if breadcrumbSegments.length > 0}
                    <Breadcrumb.Root class="mb-3">
                      <Breadcrumb.List>
                        {#each breadcrumbSegments as segment, index (segment.path)}
                          <Breadcrumb.Item>
                            <Button
                              variant="link"
                              size="xs"
                              onclick={() => navContext.selectPath(segment.path)}
                            >
                              {segment.label}
                            </Button>
                          </Breadcrumb.Item>
                          {#if index < breadcrumbSegments.length - 1}
                            <Breadcrumb.Separator />
                          {/if}
                        {/each}
                      </Breadcrumb.List>
                    </Breadcrumb.Root>
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
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>

    <!-- Delete confirmation modal -->
    {#if pendingDeleteNode}
      <Dialog.Root
        open={pendingDeleteNode !== null}
        onOpenChange={(open) => !open && (pendingDeleteNode = null)}
      >
        <Dialog.Content portalProps={{ to: getPortalTarget() }} class="max-w-md">
          <Dialog.Title class="mb-3 text-lg font-semibold">Confirm Delete</Dialog.Title>
          <p class="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete <strong>{pendingDeleteNode.data?.label}</strong>?
            {#if pendingDeleteNode.data?.type === 'object' || pendingDeleteNode.data?.type === 'array'}
              This will permanently remove all nested content.
            {/if}
          </p>
          <div class="mt-4 flex justify-end gap-2">
            <Button variant="destructive" onclick={() => commitDelete(pendingDeleteNode!)}
              >Delete</Button
            >
            <Button variant="outline" onclick={() => (pendingDeleteNode = null)}>Cancel</Button>
          </div>
        </Dialog.Content>
      </Dialog.Root>
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
        <Button
          size="icon"
          onclick={() => parentNavContext?.selectPath(binding.control.path)}
          title={`View ${binding.control.label ?? (inputDataType === 'object' ? 'Object' : 'Array')}`}
        >
          <EyeOutline class="h-4 w-4" />
        </Button>
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
  {@const active = activeNodeId === node.id}
  {#if node.children && node.children.length > 0}
    <Collapsible.Root
      open={treeExpandedValue.includes(node.id)}
      onOpenChange={(open) => {
        if (!searchQuery.trim()) {
          expandedNodes = open
            ? [...new Set([...expandedNodes, node.id])]
            : expandedNodes.filter((value) => value !== node.id);
        }
      }}
      class="w-full"
    >
      <div
        role="treeitem"
        tabindex={0}
        aria-expanded={treeExpandedValue.includes(node.id)}
        aria-selected={active}
        class={twMerge(
          'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start',
          active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60',
        )}
        onclick={() => {
          navContext.selectPath(node.id);
          handleNodeClick(node);
        }}
        onkeydown={(event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navContext.selectPath(node.id);
            handleNodeClick(node);
          }
        }}
      >
        <Collapsible.Trigger
          class="hover:bg-muted inline-flex size-6 items-center justify-center rounded-md"
        >
          <ChevronRightIcon class="size-4 transition-transform group-data-[state=open]:rotate-90" />
        </Collapsible.Trigger>
        <div class="flex min-w-0 flex-1 items-center gap-1">
          <div class="group flex min-w-0 flex-1 items-center gap-1">
            {#if node.data?.type}
              <JsonTypeIcon type={node.data.type} {active} />
            {/if}

            {#if renamingNodeId === node.id}
              <div class="flex min-w-0 flex-1 flex-col">
                <Input
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
                  <Button
                    variant="ghost"
                    size="icon-xs"
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
                  </Button>
                {/if}

                <!-- Rename/delete - visible on hover for non-root nodes -->
                {#if node.data?.path !== binding.control.path}
                  <div
                    class="invisible flex items-center gap-0.5 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100"
                  >
                    {#if node.data?.canRename}
                      <Button
                        variant="ghost"
                        size="icon-xs"
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
                      </Button>
                    {/if}
                    {#if node.data?.canDelete && !isDeleteDisabled(node)}
                      <Button
                        variant="ghost"
                        size="icon-xs"
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
                      </Button>
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>
      <Collapsible.Content role="group" class="border-border ms-3 border-s ps-3">
        {#each node.children as childNode, childIndex (childNode.id)}
          {@render renderTreeNode(childNode, [...indexPath, childIndex])}
        {/each}
      </Collapsible.Content>
    </Collapsible.Root>
  {:else}
    <div
      role="treeitem"
      tabindex={0}
      aria-selected={active}
      class={twMerge(
        'group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-start',
        active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60',
      )}
      onclick={() => {
        navContext.selectPath(node.id);
        handleNodeClick(node);
      }}
      onkeydown={(event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navContext.selectPath(node.id);
          handleNodeClick(node);
        }
      }}
    >
      <div class="flex min-w-0 flex-1 items-center gap-1">
        <div class="group flex min-w-0 flex-1 items-center gap-1">
          {#if node.data?.type}
            <JsonTypeIcon type={node.data.type} {active} />
          {/if}
          {#if renamingNodeId === node.id}
            <div class="flex min-w-0 flex-1 flex-col">
              <Input
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
                <Button
                  variant="ghost"
                  size="icon-xs"
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
                </Button>
              {/if}
              {#if node.data?.canDelete && !isDeleteDisabled(node)}
                <Button
                  variant="ghost"
                  size="icon-xs"
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
                </Button>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
{/snippet}
