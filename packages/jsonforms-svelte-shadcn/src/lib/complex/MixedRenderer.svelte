<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import { selectionAfterDelete, mixedPathIsReadOnly } from '@chobantonov/jsonforms-svelte';
  import ContainerValidationIndicator from './components/ContainerValidationIndicator.svelte';
  import ConfirmationDialog from './components/ConfirmationDialog.svelte';
  import MixedFrame from './components/MixedFrame.svelte';
  import JsonTypeIcon from '$lib/components/JsonTypeIcon.svelte';
  import Pane from '$lib/components/Pane.svelte';
  import SplitPane from '$lib/components/SplitPane.svelte';
  import ControlWrapper from '$lib/controls/ControlWrapper.svelte';
  import {
    resolveMixedStructuredLayout,
    useMixedFrameState,
    useConfirmation,
    usePendingControlAction,
    containerValidation,
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
    ChevronRightIcon,
    EyeIcon as EyeOutline,
    EyeOffIcon as EyeSlashOutline,
    PencilIcon as PenOutline,
    Trash2Icon as TrashBinOutline,
    XIcon,
  } from '$lib/components/icons';
  import * as Breadcrumb from '@jsonforms-svelte-shadcn-ui/breadcrumb';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Collapsible from '@jsonforms-svelte-shadcn-ui/collapsible';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import * as Select from '@jsonforms-svelte-shadcn-ui/select';
  import get from 'lodash/get';
  import isEqual from 'lodash/isEqual';
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
  import {
    createMixedRenderInfos,
    findPropertySchema,
    getArrayItemSchema,
    type SchemaRenderInfo,
  } from './util/schemaUtils';
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
    treeEnabled?: boolean;
    rootControl: TreeNodeControl;
    selectedPath: string;
    selectPath: (path: string) => void;
  }

  type RequireFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

  // ============================================================================
  // Props & Core Setup
  // ============================================================================

  const props: RendererProps<ControlElement> = $props();
  const parentSchema = $derived(props.schema);
  const binding = useCombinatorTranslations(useShadcnControl(useJsonFormsControl(props)));
  const path = $derived(binding.control.path);

  const jsonforms = useJsonForms();
  const t = useTranslator();

  // ============================================================================
  // Navigation Context
  // ============================================================================

  const parentNavContext = getContext<NavigationContext | undefined>(NavigationContextSymbol);
  const isRoot = $derived(!parentNavContext || parentNavContext.treeEnabled === false);
  const structuredLayout = $derived(
    resolveMixedStructuredLayout(binding.control.uischema.options, jsonforms.config),
  );

  function getExpandedPathsForSelection(targetPath: string): string[] {
    if (!targetPath.startsWith(binding.control.path)) {
      return [];
    }

    const segments = targetPath.replace(binding.control.path, '').split('.').filter(Boolean);

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
    get selectedPath() {
      return activeNodeId;
    },
    selectPath: (targetPath: string) => {
      activeNodeId = targetPath;

      if (
        isRoot &&
        showTreeView &&
        targetPath !== binding.control.path &&
        targetPath.startsWith(binding.control.path)
      ) {
        frame.expanded = true;
        expandedNodes = Array.from(
          new Set([...expandedNodes, ...getExpandedPathsForSelection(targetPath)]),
        );
      }
    },
  };

  // Forward an existing tree context; nested presentation starts independent children.
  setContext<NavigationContext>(NavigationContextSymbol, {
    get treeEnabled() {
      return isRoot ? structuredLayout === 'tree' : parentNavContext?.treeEnabled;
    },
    get rootControl() {
      return isRoot ? navContext.rootControl : parentNavContext!.rootControl;
    },
    get selectedPath() {
      return isRoot ? navContext.selectedPath : parentNavContext!.selectedPath;
    },
    selectPath(targetPath) {
      (isRoot ? navContext : parentNavContext!).selectPath(targetPath);
    },
  });

  // ============================================================================
  // State
  // ============================================================================

  let searchQuery = $state('');
  let expandedNodes = $state<string[]>([]);
  let activeNodeId = $state<string>(binding.control.path);
  const frame = useMixedFrameState(() => binding.control.uischema);
  let inputDataType = $state<JsonDataType | null>(
    getJsonDataType(untrack(() => binding.control.data)),
  );
  let treeRevision = $state(0);
  let selectedIndex = $state<number | null>(null);
  let treeNodes = $state.raw<TreeNode<TreeNodeData>[] | undefined>(undefined);
  let previousData = untrack(() => binding.control.data);

  // Rename state
  let renamingNodeId = $state<string | null>(null);
  let renameValue = $state('');
  let renameError = $state<string | null>(null);
  // Delete state
  const confirmation = useConfirmation();
  const prepareAction = usePendingControlAction();
  let preparingTypeChange = false;

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

  const numericError = $derived(
    jsonforms.core?.validationMode !== 'NoValidation' &&
      jsonforms.core?.validationMode !== 'ValidateAndHide' &&
      selectedIndex !== null &&
      selectedIndex !== undefined &&
      mixedRenderInfos[selectedIndex]?.resolvedSchema.type === 'integer' &&
      typeof binding.control.data === 'number' &&
      !Number.isInteger(binding.control.data)
      ? message('mixed.integerRequired')
      : '',
  );
  const mixedErrors = $derived(
    [binding.controlWrapper.errors, numericError].filter(Boolean).join('\n'),
  );

  const nullable = $derived(mixedRenderInfos.some((info) => info.resolvedSchema.type === 'null'));

  const showTreeView = $derived(
    isRoot &&
      structuredLayout === 'tree' &&
      (inputDataType === 'object' || inputDataType === 'array'),
  );

  const isNestedComplexType = $derived(
    !isRoot && (inputDataType === 'object' || inputDataType === 'array'),
  );

  const isSelectedComplexType = $derived(
    (isRoot &&
      structuredLayout === 'nested' &&
      (inputDataType === 'object' || inputDataType === 'array')) ||
      (isNestedComplexType && parentNavContext?.selectedPath === binding.control.path),
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
                i18n:
                  ('i18n' in valueUiSchema ? valueUiSchema.i18n : undefined) ??
                  binding.control.uischema.i18n,
                label:
                  ('label' in valueUiSchema ? valueUiSchema.label : undefined) ??
                  binding.control.uischema.label,
              }
            : undefined;
        })()
      : undefined,
  );

  const structuredUISchema = $derived(
    uischema?.type === 'Control' && 'scope' in uischema && uischema.scope === '#'
      ? { ...uischema, label: false }
      : uischema,
  );
  const validationAt = (nodePath: string) =>
    containerValidation(
      jsonforms.core,
      [...(binding.control.path ? binding.control.path.split('.') : []), ...nodeSegments(nodePath)],
      binding.control.uischema,
      jsonforms.config,
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
          label:
            node?.data.label ??
            (/^\d+$/.test(segment) ? message('mixed.item', { index: segment }) : segment),
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

  function handleSelectValueChange(value: string): void {
    if (!binding.control.enabled || binding.control.readonly) return;
    const selectedValue = value || null;
    const newIndex = selectedValue ? parseInt(selectedValue, 10) : null;

    requestTypeChange(newIndex);
  }

  async function requestTypeChange(newIndex: number | null) {
    if (preparingTypeChange || !binding.control.enabled || binding.control.readonly) return;
    const path = binding.control.path;
    const schema = binding.control.schema;
    const rootSchema = binding.control.rootSchema;
    preparingTypeChange = true;
    try {
      if (
        !(await prepareAction()) ||
        path !== binding.control.path ||
        !isEqual(schema, binding.control.schema) ||
        !isEqual(rootSchema, binding.control.rootSchema) ||
        !binding.control.visible
      )
        return;
      if (!binding.control.enabled || binding.control.readonly) return;
      if (newIndex !== null && (!Number.isFinite(newIndex) || !mixedRenderInfos[newIndex])) return;
      if (newIndex === selectedIndex || (newIndex === null && !canClearType)) return;
      const nextType =
        newIndex === null ? undefined : mixedRenderInfos[newIndex].resolvedSchema.type;
      const numericIntent =
        (nextType === 'integer' || nextType === 'number') &&
        typeof binding.control.data === 'number';
      const original = binding.control.data;
      const originalPath = binding.control.path;
      const originalSchema = binding.control.schema;
      confirmation.request({
        catalogId: 'mixed',
        operation: 'typeChange',
        options: binding.control.uischema.options,
        config: jsonforms.config,
        discarded: numericIntent ? [] : [original],
        perform: () => {
          if (
            !binding.control.enabled ||
            !binding.control.visible ||
            binding.control.readonly ||
            binding.control.path !== originalPath ||
            binding.control.data !== original ||
            !isEqual(binding.control.schema, originalSchema) ||
            !isEqual(binding.control.rootSchema, rootSchema) ||
            (newIndex === null && !canClearType)
          )
            return;
          commitTypeChange(newIndex);
        },
      });
    } finally {
      preparingTypeChange = false;
    }
  }

  function commitTypeChange(newIndex: number | null) {
    if (newIndex === null) {
      inputDataType = null;
    } else {
      const selectedType = mixedRenderInfos[newIndex].resolvedSchema.type;
      if (typeof selectedType === 'string') {
        inputDataType = selectedType as JsonDataType;
        if (isRoot && (selectedType === 'object' || selectedType === 'array')) {
          frame.expanded = true;
        }
      }
    }

    selectedIndex = newIndex;
    const nextType = newIndex === null ? undefined : mixedRenderInfos[newIndex].resolvedSchema.type;
    // Integer/Number are editing intents for the same JSON number value.
    if (
      (nextType === 'integer' || nextType === 'number') &&
      typeof binding.control.data === 'number'
    )
      return;

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
    requestTypeChange(null);
  }

  function handleNodeClick(node: TreeNode<TreeNodeData>) {
    if (node.data) {
      navContext.selectPath(node.data.path);
    }
  }

  function handleNodeDelete(node: TreeNode<TreeNodeData>) {
    if (isDeleteDisabled(node)) return;

    const original = readNodeValue(node.data!.path);
    const originalPath = binding.control.path;
    confirmation.request({
      catalogId: 'mixed',
      operation: 'delete',
      options: binding.control.uischema.options,
      config: jsonforms.config,
      discarded: [original],
      perform: () => {
        if (binding.control.path === originalPath && readNodeValue(node.data!.path) === original)
          commitDelete(node);
      },
    });
  }

  function commitDelete(node: TreeNode<TreeNodeData>) {
    if (isDeleteDisabled(node)) {
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
            ? message('mixed.nameRequired')
            : validation.error === 'already-defined'
              ? message('mixed.nameExists', { name: validation.name })
              : message('mixed.nameInvalid', { name: validation.name });
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
      frame.expanded = true;
      expandedNodes = Array.from(
        new Set([...expandedNodes, ...getExpandedPathsForSelection(targetPath)]),
      );
    });
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
        const keepNumericIntent =
          (inputDataType === 'number' || inputDataType === 'integer') &&
          (newType === 'number' || newType === 'integer');
        if (inputDataType !== newType && !keepNumericIntent) {
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
          (index) => message('mixed.item', { index }),
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

  // use the default value since all properties are dynamic so preserve the property key
  setIsDynamicProperty(true);

  const searchInputProps = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');

    return {
      ...shadcnProps,
      type: 'text',
      placeholder: message('mixed.searchTree'),
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

  const filteredTreeNodes = $derived(filterTreeNodes(visibleTreeNodes, searchQuery));
  const treeExpandedValue = $derived(
    searchQuery.trim() ? collectExpandedValues(filteredTreeNodes) : expandedNodes,
  );

  const selectedTypeValue = $derived(selectedIndex == null ? undefined : selectedIndex.toString());
  const selectedTypeLabel = $derived(
    selectItems.find((item) => item.value === selectedTypeValue)?.name,
  );
</script>

{#snippet typeSelector(stopPropagation: boolean)}
  <div class="group relative w-full">
    <Select.Root
      type="single"
      bind:value={() => selectedTypeValue ?? '', handleSelectValueChange}
      disabled={!binding.control.enabled}
      required={binding.control.required}
      {...binding.shadcnProps('Select')}
    >
      <Select.Trigger
        id={`${binding.control.id}-input-selector`}
        class={twMerge(
          binding.styles.control.input,
          'h-10 w-full data-[size=default]:h-10',
          selectedIndex != null ? 'pe-16' : '',
        )}
        aria-invalid={!!binding.control.errors}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
        onclick={stopPropagation ? (event: MouseEvent) => event.stopPropagation() : undefined}
        onmousedown={stopPropagation ? (event: MouseEvent) => event.stopPropagation() : undefined}
      >
        <span class={selectedTypeLabel ? '' : 'text-muted-foreground'}>
          {selectedTypeLabel ?? message('mixed.selectType')}
        </span>
      </Select.Trigger>
      <Select.Content portalProps={{ to: getPortalTarget() }}>
        {#each selectItems as item (item.value)}
          <Select.Item value={item.value} label={item.name}>{item.name}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    {#if canClearType && selectedIndex !== null && selectedIndex !== undefined}
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
        aria-label={message('mixed.clearType')}
      >
        <XIcon class="size-4 shrink-0" />
      </Button>
    {/if}
  </div>
{/snippet}

{#if binding.control.visible}
  {#each confirmation.pending ? [confirmation.pending] : [] as request (request)}
    <ConfirmationDialog
      operation={request.operation}
      onAccept={() => confirmation.accept(request)}
      onCancel={() => confirmation.cancel(request)}
    />
  {/each}
  {#if structuredLayout === 'code'}
    <ControlWrapper {...binding.controlWrapper} errors={mixedErrors}>
      <p role="status">{message('mixed.codeUnavailable')}</p>
    </ControlWrapper>
  {:else if showTreeView || (isRoot && isSelectedComplexType)}
    <MixedFrame
      expanded={frame.expanded}
      collapsible={frame.collapsible}
      label={binding.control.label || message('mixed.value')}
      onExpandedChange={(expanded) => {
        frame.expanded = expanded;
      }}
    >
      {#snippet selector()}<ControlWrapper {...binding.controlWrapper} errors={mixedErrors}
          >{@render typeSelector(true)}</ControlWrapper
        >{/snippet}
      {#snippet indicator()}<ContainerValidationIndicator
          {...validationAt(binding.control.path)}
        />{/snippet}
      {#if showTreeView}
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
              {#each selectedNode ? [selectedNode.data.control] : [] as detailControl (detailControl.path)}
                {#if breadcrumbSegments.length > 0}
                  <Breadcrumb.Root class="mb-3">
                    <Breadcrumb.List>
                      {#each breadcrumbSegments as segment, index (segment.path)}
                        <Breadcrumb.Item>
                          <Button
                            variant="link"
                            size="xs"
                            onclick={() => navContext.selectPath(segment.path)}
                            aria-label={segment.isRoot
                              ? message(
                                  segment.type === 'array' ? 'mixed.arrayRoot' : 'mixed.objectRoot',
                                )
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
                          </Button>
                        </Breadcrumb.Item>
                        {#if index < breadcrumbSegments.length - 1}
                          <Breadcrumb.Separator />
                        {/if}
                      {/each}
                    </Breadcrumb.List>
                  </Breadcrumb.Root>
                {/if}
                {#if detailControl.path === binding.control.path && schema && uischema}
                  <DispatchRenderer
                    {schema}
                    uischema={structuredUISchema!}
                    {path}
                    renderers={binding.control.renderers}
                    cells={binding.control.cells}
                    enabled={binding.control.enabled && detailControl.enabled}
                  />
                {:else if detailControl.path.includes('\0')}
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
      {:else if schema && uischema}
        <DispatchRenderer
          {schema}
          uischema={structuredUISchema!}
          {path}
          renderers={binding.control.renderers}
          cells={binding.control.cells}
          enabled={binding.control.enabled}
        />
      {/if}
    </MixedFrame>
  {:else if isSelectedComplexType}
    <!-- Selected complex tree node - show its renderer and a full-width selector unless it is the tree root -->
    <div class="flex flex-col gap-4">
      {#if !isTreeRootDetail}
        <div class="w-full">
          <ControlWrapper {...binding.controlWrapper} errors={mixedErrors}>
            {@render typeSelector(false)}
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
      <ControlWrapper {...binding.controlWrapper} errors={mixedErrors}>
        <div class="flex items-center gap-2">
          <div class="min-w-32 shrink-0">
            {@render typeSelector(false)}
          </div>
          <Button
            size="icon"
            onclick={() => parentNavContext?.selectPath(binding.control.path)}
            title={message('mixed.view', {
              label:
                binding.control.label ??
                message(inputDataType === 'object' ? 'mixed.object' : 'mixed.array'),
            })}
          >
            <EyeOutline class="h-4 w-4" />
          </Button>
        </div>
      </ControlWrapper>
    </div>
  {:else if inputDataType === 'boolean' && schema && booleanUiSchema}
    <ControlWrapper {...binding.controlWrapper} errors={mixedErrors}>
      <div
        class="flex items-center gap-2"
        data-mixed-boolean-row
        onfocusin={binding.handleFocus}
        onfocusout={binding.handleBlur}
      >
        <div class="min-w-32 shrink-0">
          {@render typeSelector(false)}
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
        <ControlWrapper {...binding.controlWrapper} errors={mixedErrors}>
          {@render typeSelector(false)}
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

{#snippet primitiveVisibilityToggle(active: boolean)}
  <Button
    variant="ghost"
    size="icon-xs"
    {...treeActionButtonProps(
      `rounded p-0.5 ${
        active
          ? showPrimitivesInTree
            ? 'text-foreground'
            : 'text-foreground opacity-60'
          : showPrimitivesInTree
            ? 'text-primary-500 dark:text-primary-400'
            : 'text-gray-400 dark:text-gray-500'
      }`,
      showPrimitivesInTree ? message('mixed.hidePrimitives') : message('mixed.showPrimitives'),
    )}
    title={showPrimitivesInTree ? message('mixed.hidePrimitives') : message('mixed.showPrimitives')}
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
{/snippet}

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
          active ? 'bg-accent text-foreground' : 'hover:bg-accent/60',
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
              <ContainerValidationIndicator {...validationAt(node.data!.path)} />
            {/if}

            {#if renamingNodeId !== node.id && binding.control.enabled}
              <div class="ms-auto flex shrink-0 items-center gap-0.5">
                <!-- Show primitives toggle - always visible, only on root node -->
                {#if node.data?.path === binding.control.path}
                  {@render primitiveVisibilityToggle(active)}
                {/if}

                <!-- Rename/delete - visible on hover for non-root nodes -->
                {#if node.data?.path !== binding.control.path}
                  <div
                    class="invisible flex items-center gap-0.5 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100"
                  >
                    {#if node.data?.canRename && canMutateNode(node)}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        {...treeActionButtonProps(
                          `rounded p-0.5 ${
                            active
                              ? 'text-foreground hover:bg-muted'
                              : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'
                          }`,
                          message('mixed.rename'),
                        )}
                        title={message('mixed.rename')}
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
                          'rounded p-0.5 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900',
                          message('mixed.delete'),
                        )}
                        title={message('mixed.delete')}
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
        active ? 'bg-accent text-foreground' : 'hover:bg-accent/60',
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
            <ContainerValidationIndicator {...validationAt(node.data!.path)} />
          {/if}

          {#if renamingNodeId !== node.id && binding.control.enabled}
            <div
              class={node.data?.path === binding.control.path
                ? 'ms-auto flex shrink-0 items-center gap-0.5'
                : 'invisible ms-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100'}
            >
              {#if node.data?.path === binding.control.path}
                {@render primitiveVisibilityToggle(active)}
              {:else}
                {#if node.data?.canRename && canMutateNode(node)}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    {...treeActionButtonProps(
                      `rounded p-0.5 ${
                        active
                          ? 'text-foreground hover:bg-muted'
                          : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'
                      }`,
                      message('mixed.rename'),
                    )}
                    title={message('mixed.rename')}
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
                      'rounded p-0.5 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900',
                      message('mixed.delete'),
                    )}
                    title={message('mixed.delete')}
                    onclick={(e: MouseEvent) => {
                      e.stopPropagation();
                      handleNodeDelete(node);
                    }}
                  >
                    <TrashBinOutline class="h-3 w-3" />
                  </Button>
                {/if}
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
{/snippet}
