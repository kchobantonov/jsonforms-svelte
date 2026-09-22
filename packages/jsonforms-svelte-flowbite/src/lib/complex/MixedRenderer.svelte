<script lang="ts">
  import { selectionAfterDelete, mixedPathIsReadOnly } from '@chobantonov/jsonforms-svelte';
  import JsonTypeIcon from '$lib/components/JsonTypeIcon.svelte';
  import TreeView from '$lib/components/TreeView/TreeView.svelte';
  import type { FilterFunction, TreeNode } from '$lib/components/TreeView/types';
  import ControlWrapper from '$lib/controls/ControlWrapper.svelte';
  import {
    DispatchRenderer,
    MixedLiteralDetail,
    encodeMixedSegment,
    decodeMixedSegment,
    mixedValueAt,
    replaceMixedValue,
    useJsonForms,
    useJsonFormsControl,
    useTranslator,
    validateAdditionalPropertyName,
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
    Span,
    SplitPane,
    ToolbarButton,
    Tooltip,
  } from 'flowbite-svelte';
  import { EyeOutline, EyeSlashOutline, PenOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import get from 'lodash/get';
  import isEqual from 'lodash/isEqual';
  import { getContext, setContext, untrack } from 'svelte';
  import { twMerge } from 'tailwind-merge';
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
  import {
    createMixedRenderInfos,
    findPropertySchema,
    getArrayItemSchema,
    type SchemaRenderInfo,
  } from './util/schemaUtils';
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
    selectedPath: string;
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
    get selectedPath() {
      return activeNodeId;
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
  let treeRevision = $state(0);
  let selectedIndex = $state<number | null>(null);
  let treeNodes = $state<TreeNode<TreeNodeData>[] | undefined>(undefined);
  let previousData = $state(untrack(() => binding.control.data));

  // Rename state
  let renamingNodeId = $state<string | null>(null);
  let renameValue = $state('');
  let renameError = $state<string | null>(null);
  let renameInputRef = $state<HTMLInputElement | undefined>(undefined);

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

  const isSelectedComplexType = $derived(
    isNestedComplexType && parentNavContext?.selectedPath === binding.control.path,
  );

  const isTreeRootDetail = $derived(
    isSelectedComplexType && parentNavContext?.rootControl.path === binding.control.path,
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
      ? (() => {
          const valueUiSchema = mixedRenderInfos[selectedIndex]?.uischema;
          return valueUiSchema
            ? {
                ...valueUiSchema,
                label:
                  binding.control.uischema.label ??
                  ('label' in valueUiSchema ? valueUiSchema.label : undefined),
              }
            : undefined;
        })()
      : undefined,
  );

  const booleanUiSchema = $derived(
    uischema && {
      ...uischema,
      label: binding.control.label,
      options: { ...uischema.options, hideControlWrapper: true },
    },
  );

  const selectedNode = $derived(showTreeView ? findNodeByPath(treeNodes, activeNodeId) : undefined);

  const breadcrumbSegments = $derived.by(() => {
    if (!showTreeView) return [];

    const segments = activeNodeId.replace(binding.control.path, '').split('.').filter(Boolean);

    return [
      {
        label: binding.control.label,
        path: binding.control.path,
        type: inputDataType,
        isRoot: true,
      },
      ...segments.map((segment, index) => {
        const pathSegments = segments.slice(0, index + 1);
        let reconstructedPath = binding.control.path;
        pathSegments.forEach((seg) => {
          reconstructedPath = compose(reconstructedPath, seg);
        });
        const node = findNodeByPath(treeNodes, reconstructedPath);
        return {
          label: node?.data.label ?? (/^\d+$/.test(segment) ? `Item ${segment}` : segment),
          path: reconstructedPath,
          type: node?.data.type ?? null,
          isRoot: false,
        };
      }),
    ];
  });

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const customFilter: FilterFunction = (value, query, _item) => {
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
      if (node.children) {
        const found = findNodeByPath(node.children, targetPath);
        if (found) return found;
      }
    }
    return undefined;
  }

  function getParentPath(nodePath: string): string {
    const lastDot = nodePath.lastIndexOf('.');
    const lastSeparator = lastDot;
    return lastSeparator > 0 ? nodePath.substring(0, lastSeparator) : binding.control.path;
  }

  function getRelativePath(nodePath: string): string | null {
    if (nodePath === binding.control.path) return null;
    // Strip the root control path prefix + the dot separator
    return nodePath.startsWith(binding.control.path + '.')
      ? nodePath.slice(binding.control.path.length + 1)
      : nodePath;
  }

  function nodeSegments(path: string): string[] {
    const relative = getRelativePath(path);
    return relative === null ? [] : relative.split('.').map(decodeMixedSegment);
  }
  function readNodeValue(path: string): any {
    return mixedValueAt(binding.control.data, nodeSegments(path));
  }
  function writeNodeValue(path: string, value: any): void {
    if (
      !binding.control.enabled ||
      binding.control.readonly ||
      mixedPathIsReadOnly(
        binding.control.schema,
        binding.control.rootSchema,
        binding.control.data,
        nodeSegments(path),
      )
    )
      return;
    if (isEqual(readNodeValue(path), value)) return;
    binding.handleChange(
      binding.control.path,
      replaceMixedValue(binding.control.data, nodeSegments(path), value),
    );
  }

  function getParentSchema(parentPath: string): JsonSchema | undefined {
    const parentRelativePath = getRelativePath(parentPath);
    if (parentRelativePath === null) return binding.control.schema;

    const segments = parentRelativePath.split('.').map(decodeMixedSegment);
    let currentSchema: JsonSchema = binding.control.schema;

    let currentData = binding.control.data;
    for (const segment of segments) {
      currentSchema = resolveSchema(currentSchema, binding.control.rootSchema);
      currentSchema = Array.isArray(currentData)
        ? (getArrayItemSchema(currentSchema, Number(segment), binding.control.rootSchema) ?? {})
        : (findPropertySchema(currentSchema, segment, binding.control.rootSchema) ?? {});
      currentData = mixedValueAt(currentData, [segment]);
    }

    return currentSchema;
  }
  function isNodeNonEmpty(node: TreeNode<TreeNodeData>): boolean {
    if (node.data?.path) {
      const relativePath = getRelativePath(node.data.path);
      const data =
        relativePath === null
          ? binding.control.data
          : mixedValueAt(binding.control.data, relativePath.split('.').map(decodeMixedSegment));

      if (Array.isArray(data)) {
        return data.length > 0;
      }

      return typeof data === 'object' && data != null ? Object.keys(data).length > 0 : false;
    }
    return false;
  }

  function canMutateNode(node: TreeNode<TreeNodeData>): boolean {
    if (!node.data || !binding.control.enabled || binding.control.readonly) return false;
    const relative = getRelativePath(node.data.path);
    return !mixedPathIsReadOnly(
      binding.control.schema,
      binding.control.rootSchema,
      binding.control.data,
      relative === null ? [] : relative.split('.').map(decodeMixedSegment),
    );
  }

  function isDeleteDisabled(node: TreeNode<TreeNodeData>): boolean {
    if (!canMutateNode(node) || !node.data?.canDelete) return true;
    if (!binding.control.enabled) return true;
    if (binding.appliedOptions?.restrict === false) return false;

    const nodePath = node.data!.path;
    const parentPath = getParentPath(nodePath);
    const relativePath = getRelativePath(parentPath);
    const parentData =
      relativePath === null
        ? binding.control.data
        : mixedValueAt(binding.control.data, relativePath.split('.').map(decodeMixedSegment));
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

    if (newIndex !== null && (!Number.isFinite(newIndex) || !mixedRenderInfos[newIndex])) {
      return;
    }

    if (newIndex === null && !canClearType) return;

    if (newIndex === null) {
      inputDataType = null;
    } else {
      const selectedType = mixedRenderInfos[newIndex].resolvedSchema.type;
      if (typeof selectedType === 'string') {
        inputDataType = selectedType as JsonDataType;
        if (isRoot && (selectedType === 'object' || selectedType === 'array')) {
          currentlyExpanded = true;
        }
      }
    }

    selectedIndex = newIndex;

    const newData =
      newIndex !== null
        ? createDefaultValue(mixedRenderInfos[newIndex].resolvedSchema, binding.control.rootSchema)
        : undefined;

    binding.handleChange(binding.control.path, newData);
  }

  const isArrayItem = $derived.by(() => {
    const path = binding.control.path;
    if (!path) return false;
    const separator = path.lastIndexOf('.');
    const parent =
      separator < 0
        ? jsonforms.core?.data
        : get(jsonforms.core?.data, path.slice(0, separator).split('.'));
    return Array.isArray(parent);
  });
  const canClearType = $derived(
    !isArrayItem &&
      binding.control.enabled &&
      !binding.control.readonly &&
      binding.appliedOptions.clearable !== false,
  );

  function handleClearSelection(): void {
    if (!canClearType) return;
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
    if (isDeleteDisabled(node)) {
      pendingDeleteNode = null;
      return;
    }
    const nodePath = node.data!.path;
    const parentPath = getParentPath(nodePath);
    const key = decodeMixedSegment(nodePath.slice(parentPath ? parentPath.length + 1 : 0));
    const relativePath = getRelativePath(parentPath);
    const parentData =
      relativePath === null
        ? binding.control.data
        : mixedValueAt(binding.control.data, relativePath.split('.').map(decodeMixedSegment));

    if (Array.isArray(parentData)) {
      // Remove item from array
      const index = parseInt(key);
      const updated = [...parentData];
      updated.splice(index, 1);
      writeNodeValue(parentPath, updated);
    } else if (typeof parentData === 'object' && parentData !== null) {
      // Remove key from object
      const updated = { ...parentData };
      delete updated[key];
      writeNodeValue(parentPath, updated);
    }

    navContext.selectPath(
      selectionAfterDelete(
        activeNodeId,
        nodePath,
        parentPath,
        Array.isArray(parentData) ? Number(key) : undefined,
      ),
    );

    pendingDeleteNode = null;
  }

  function handleRename(node: TreeNode<TreeNodeData>) {
    if (!canMutateNode(node) || !node.data?.canRename) return;
    renamingNodeId = node.id;
    renameValue = nodeSegments(node.data!.path).at(-1) ?? '';
    renameError = null;
  }

  function commitRename(node: TreeNode<TreeNodeData>) {
    if (!canMutateNode(node) || !node.data?.canRename) {
      cancelRename();
      return;
    }
    const trimmed = renameValue;

    if (trimmed === (nodeSegments(node.data!.path).at(-1) ?? '')) {
      cancelRename();
      return;
    }

    const nodePath = node.data!.path;
    const parentPath = getParentPath(nodePath);
    const oldKey = nodeSegments(node.data!.path).at(-1) ?? '';
    const relativePath = getRelativePath(parentPath);
    const parentData =
      relativePath === null
        ? binding.control.data
        : mixedValueAt(binding.control.data, relativePath.split('.').map(decodeMixedSegment));

    if (typeof parentData === 'object' && parentData !== null && !Array.isArray(parentData)) {
      let parentSchema = getParentSchema(parentPath);
      if (parentSchema) {
        parentSchema = resolveSchema(parentSchema, binding.control.rootSchema);
      }

      const validation = validateAdditionalPropertyName({
        allowEmptyPropertyNames: binding.appliedOptions.allowEmptyPropertyNames === true,
        allowLiteralNames: true,
        name: renameValue,
        currentName: oldKey,
        schema: parentSchema ?? {},
        rootSchema: binding.control.rootSchema,
        data: parentData,
        ajv: jsonforms.core?.ajv,
      });
      if (!validation.valid) {
        renameError =
          validation.error === 'required'
            ? 'Property name is required'
            : validation.error === 'already-defined'
              ? `Property "${validation.name}" already exists`
              : `Property name "${validation.name}" is invalid`;
        return;
      }

      renameError = null;
      const renamedProperty = validation.name;

      // Preserve key order by rebuilding the object
      const updated = Object.fromEntries(
        Object.entries(parentData).map(([k, v]) => [k === oldKey ? renamedProperty : k, v]),
      );
      writeNodeValue(parentPath, updated);

      // Navigate to the renamed node's new path
      const newPath = compose(parentPath, encodeMixedSegment(renamedProperty));
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

  // Watch control data for changes
  $effect(() => {
    const newData = binding.control.data;

    if (newData !== previousData) {
      untrack(() => {
        const structuralChange = hasStructuralChange(previousData, newData, true);
        previousData = newData;

        if (structuralChange) {
          treeRevision += 1;
        }

        const newType = getJsonDataType(newData);
        if (inputDataType !== newType) {
          inputDataType = newType;
        }
      });
    }
  });

  // Stable projections avoid rebuilding when only an unrelated control changes.
  let previousTreeSchemas: { schema: JsonSchema; rootSchema: JsonSchema } | undefined;
  const treeSchemas = $derived.by(() => {
    const next = { schema: binding.control.schema, rootSchema: binding.control.rootSchema };
    // Bindings may supply equivalent new schema objects after unrelated edits.
    // Retain only their references, not cloned snapshots or prepared node schemas.
    if (!isEqual(next, previousTreeSchemas)) previousTreeSchemas = next;
    return previousTreeSchemas!;
  });
  const treePath = $derived(binding.control.path);
  const treeLabel = $derived(binding.control.label);

  // Rebuild on relevant data changes and schema-only updates.
  $effect(() => {
    void treeRevision;
    const { schema, rootSchema } = treeSchemas;
    const path = treePath;
    const label = treeLabel;
    treeNodes = showTreeView
      ? buildTreeFromData(
          untrack(() => binding.control.data),
          schema,
          rootSchema,
          path,
          label,
          true,
        )
      : undefined;
  });

  // Selection and detail editing use the complete tree. The primitive toggle
  // affects only displayed rows, just like search; it must not discard a target.
  function complexTreeNodes(nodes: TreeNode<TreeNodeData>[]): TreeNode<TreeNodeData>[] {
    return nodes
      .filter((node) => node.data?.type === 'object' || node.data?.type === 'array')
      .map((node) => ({ ...node, children: complexTreeNodes(node.children ?? []) }));
  }
  const visibleTreeNodes = $derived(
    showPrimitivesInTree ? (treeNodes ?? []) : complexTreeNodes(treeNodes ?? []),
  );

  $effect(() => {
    if (renamingNodeId && renameInputRef) {
      renameInputRef.focus();
    }
  });
  // use the default value since all properties are dynamic so preserve the property key
  setIsDynamicProperty(true);

  const searchInputProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');

    return {
      ...flowbiteProps,
      type: 'text',
      placeholder: 'Search tree...',
      class: twMerge('mb-4', flowbiteProps.class),
    };
  });

  const renameInputProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');

    return {
      ...flowbiteProps,
      type: 'text',
      class: twMerge(
        'min-w-0 flex-1 text-sm',
        renameError ? 'border-red-500' : 'border-primary-500',
        flowbiteProps.class,
      ),
    };
  });

  const treeActionButtonProps = (color: string, className: string, ariaLabel: string) => {
    const flowbiteProps = binding.flowbiteProps('ToolbarButton');

    return {
      ...flowbiteProps,
      color: flowbiteProps.color ?? color,
      'aria-label': ariaLabel,
      class: twMerge(className, flowbiteProps.class),
    };
  };

  const modalProps = $derived(binding.flowbiteProps('Modal'));
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
                  clearable={canClearType}
                  onClear={handleClearSelection}
                  onfocus={binding.handleFocus}
                  onblur={binding.handleBlur}
                  required={binding.control.required}
                  aria-invalid={!!binding.control.errors}
                  class="w-full"
                />
              </ControlWrapper>
            </div>
            <div class="flex-1">
              <Span>{binding.control.label}</Span>
            </div>
          </div>
        {/snippet}

        <SplitPane initialSizes={[25, 75]}>
          <Pane>
            <div class="pointer-events-auto flex flex-col ps-1 pe-4 pt-1 select-text">
              <Input bind:value={searchQuery} {...searchInputProps}></Input>
              {#if treeNodes}
                <TreeView
                  nodes={visibleTreeNodes}
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
                  {#snippet nodeSnippet({ node, active })}
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
                          <Input
                            {...renameInputProps}
                            bind:elementRef={renameInputRef}
                            bind:value={renameValue}
                            onclick={(e) => e.stopPropagation()}
                            onkeydown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter') commitRename(node);
                              if (e.key === 'Escape') cancelRename();
                            }}
                            onblur={() => commitRename(node)}
                          />
                          {#if renameError}
                            <Span class="mt-0.5 text-xs text-red-500">{renameError}</Span>
                          {/if}
                        </div>
                      {:else}
                        <Span class="min-w-0 flex-1 truncate text-start text-sm">
                          {node.label}
                        </Span>
                      {/if}

                      <!-- Action buttons -->
                      {#if renamingNodeId !== node.id && binding.control.enabled}
                        <div class="ms-auto flex shrink-0 items-center gap-0.5">
                          <!-- Show primitives toggle - always visible, only on root node -->
                          {#if node.data?.path === binding.control.path}
                            <ToolbarButton
                              {...treeActionButtonProps(
                                'default',
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
                            </ToolbarButton>
                          {/if}

                          <!-- Rename/delete - visible on hover for non-root nodes -->
                          {#if node.data?.path !== binding.control.path}
                            <div
                              class="invisible flex items-center gap-0.5 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100"
                            >
                              {#if node.data?.canRename && canMutateNode(node)}
                                <ToolbarButton
                                  {...treeActionButtonProps(
                                    'default',
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
                                </ToolbarButton>
                              {/if}
                              {#if node.data?.canDelete && !isDeleteDisabled(node)}
                                <ToolbarButton
                                  {...treeActionButtonProps(
                                    'red',
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
                                </ToolbarButton>
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
              {#each selectedNode ? [selectedNode.data.control] : [] as detailControl (detailControl.path)}
                {#if breadcrumbSegments.length > 0}
                  <Breadcrumb aria-label="Navigation path" class="mb-0">
                    {#each breadcrumbSegments as segment}
                      <BreadcrumbItem
                        home={false}
                        onclick={() => navContext.selectPath(segment.path)}
                        class="cursor-pointer"
                      >
                        <Span
                          class="hover:text-primary-600 dark:hover:text-primary-400 text-sm"
                          aria-label={segment.isRoot
                            ? `${segment.type === 'array' ? 'Array' : 'Object'} root`
                            : segment.label}
                        >
                          {#if segment.isRoot && (segment.type === 'object' || segment.type === 'array')}
                            <JsonTypeIcon
                              type={segment.type}
                              active={activeNodeId === segment.path}
                            />
                          {:else}
                            {segment.label}
                          {/if}
                        </Span>
                      </BreadcrumbItem>
                    {/each}
                  </Breadcrumb>
                {/if}
                {#if detailControl.path.includes('\0')}
                  <MixedLiteralDetail
                    navigationKey={NavigationContextSymbol}
                    nodePath={detailControl.path}
                    rootSchema={binding.control.rootSchema}
                    data={readNodeValue(detailControl.path)}
                    schema={detailControl.schema}
                    uischema={{
                      ...detailControl.uischema,
                      type: 'Control',
                      scope: '#',
                      options: { ...detailControl.uischema.options, clearable: false },
                    }}
                    renderers={binding.control.renderers}
                    cells={binding.control.cells}
                    config={binding.control.config}
                    uischemas={jsonforms.uischemas}
                    readonly={!binding.control.enabled ||
                      binding.control.readonly ||
                      !detailControl.enabled}
                    i18n={jsonforms.i18n}
                    ajv={jsonforms.core?.ajv}
                    validationMode={jsonforms.core?.validationMode}
                    onchange={(event) => writeNodeValue(detailControl.path, event.data)}
                  />
                {:else}
                  <DispatchRenderer
                    schema={detailControl.schema}
                    uischema={detailControl.uischema}
                    path={detailControl.path}
                    renderers={binding.control.renderers}
                    cells={binding.control.cells}
                    enabled={detailControl.enabled}
                  />
                {/if}
              {/each}
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
        {...modalProps}
      >
        <P class="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete <strong>{pendingDeleteNode.data?.label}</strong>?
          {#if pendingDeleteNode.data?.type === 'object' || pendingDeleteNode.data?.type === 'array'}
            This will permanently remove all nested content.
          {/if}
        </P>
        {#snippet footer()}
          <Button color="red" onclick={() => commitDelete(pendingDeleteNode!)}>Delete</Button>
          <Button color="alternative" onclick={() => (pendingDeleteNode = null)}>Cancel</Button>
        {/snippet}
      </Modal>
    {/if}
  {:else if isSelectedComplexType}
    <!-- Selected complex tree node - show its renderer and a full-width selector unless it is the tree root -->
    <div class="flex flex-col gap-4">
      {#if !isTreeRootDetail}
        <div class="w-full">
          <ControlWrapper {...binding.controlWrapper}>
            <Select
              id={binding.control.id + '-input-selector'}
              disabled={!binding.control.enabled}
              items={selectItems}
              value={selectedIndex?.toString() ?? ''}
              placeholder="Select type..."
              onchange={handleSelectChange}
              clearable={canClearType}
              onClear={handleClearSelection}
              onfocus={binding.handleFocus}
              onblur={binding.handleBlur}
              required={binding.control.required}
              aria-invalid={!!binding.control.errors}
              class="w-full"
            />
          </ControlWrapper>
        </div>
      {/if}
      {#if schema && uischema}
        <DispatchRenderer
          {schema}
          {uischema}
          {path}
          renderers={binding.control.renderers}
          cells={binding.control.cells}
          enabled={binding.control.enabled}
        />
      {/if}
    </div>
  {:else if isNestedComplexType}
    <!-- Nested complex type - show type selector with view button -->
    <div class="w-full">
      <ControlWrapper {...binding.controlWrapper}>
        <div class="flex items-center gap-2">
          <div class="min-w-32 shrink-0">
            <Select
              id={binding.control.id + '-input-selector'}
              disabled={!binding.control.enabled}
              items={selectItems}
              value={selectedIndex?.toString() ?? ''}
              placeholder="Select type..."
              onchange={handleSelectChange}
              clearable={canClearType}
              onClear={handleClearSelection}
              onfocus={binding.handleFocus}
              onblur={binding.handleBlur}
              required={binding.control.required}
              aria-invalid={!!binding.control.errors}
              class="w-full"
            />
          </div>
          <ToolbarButton
            color="primary"
            onclick={() => parentNavContext?.selectPath(binding.control.path)}
            title={`View ${binding.control.label ?? (inputDataType === 'object' ? 'Object' : 'Array')}`}
          >
            <EyeOutline class="h-4 w-4" />
            <Tooltip>
              View {binding.control.label ?? (inputDataType === 'object' ? 'Object' : 'Array')}
            </Tooltip>
          </ToolbarButton>
        </div>
      </ControlWrapper>
    </div>
  {:else if inputDataType === 'boolean' && schema && booleanUiSchema}
    <ControlWrapper {...binding.controlWrapper}>
      <div
        class="flex items-center gap-2"
        data-mixed-boolean-row
        onfocusin={binding.handleFocus}
        onfocusout={binding.handleBlur}
      >
        <div class="min-w-32 shrink-0">
          <Select
            id={binding.control.id + '-input-selector'}
            disabled={!binding.control.enabled}
            items={selectItems}
            value={selectedIndex?.toString() ?? ''}
            placeholder="Select type..."
            onchange={handleSelectChange}
            clearable={canClearType}
            onClear={handleClearSelection}
            onfocus={binding.handleFocus}
            onblur={binding.handleBlur}
            required={binding.control.required}
            aria-invalid={!!binding.control.errors}
            class="w-full"
          />
        </div>
        <DispatchRenderer
          {schema}
          uischema={booleanUiSchema}
          {path}
          renderers={binding.control.renderers}
          cells={binding.control.cells}
          enabled={binding.control.enabled}
        />
      </div>
    </ControlWrapper>
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
            clearable={canClearType}
            onClear={handleClearSelection}
            onfocus={binding.handleFocus}
            onblur={binding.handleBlur}
            required={binding.control.required}
            aria-invalid={!!binding.control.errors}
            class="w-full"
          />
        </ControlWrapper>
      </div>
      {#if schema && uischema && !(nullable && binding.control.data === null)}
        <div class="flex-1">
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
