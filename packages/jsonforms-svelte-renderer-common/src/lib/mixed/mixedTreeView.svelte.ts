import { filterMixedTree, mixedTreeBranchIds } from './treeNavigation';
import { useJsonForms } from '@chobantonov/jsonforms-svelte';
import { Resolve } from '@jsonforms/core';
import { untrack } from 'svelte';
import type { ControlProps } from '../core/jsonFormsCompositions.svelte';
import { useMixedFrameState } from '../layout/groupState.svelte';
import { useRendererMessages } from '../locale/rendererMessages.svelte';
import { containerValidation } from '../validation/containerValidation';
import { summaryErrorsAt } from '../validation/errorSummary';
import { useMixedEditor } from './mixedEditor.svelte';
import { useMixedNavigation } from './mixedNavigation.svelte';
import { useMixedTreeActions } from './mixedTreeActions.svelte';
import {
  mixedTreeBreadcrumbs,
  complexMixedTreeNodes,
  findMixedNodeByPath,
  mixedTreeAncestorPaths,
} from './treeNavigation';
import type { TreeNode, TreeNodeData } from './treeBuilder.svelte';

export function useMixedTreeView(
  props: ControlProps,
  binding: Parameters<typeof useMixedTreeActions>[0] & Parameters<typeof useMixedEditor>[1],
  buildTreeFromData: Parameters<typeof useMixedEditor>[2],
  navigationKey: symbol,
  revealAncestors: boolean,
) {
  const message = useRendererMessages();
  const jsonforms = useJsonForms();

  function expandTo(targetPath: string) {
    frame.expanded = true;
    const ancestors = mixedTreeAncestorPaths(binding.control.path, targetPath);
    expandedNodes = [
      ...expandedNodes,
      ...ancestors.filter((path) => !expandedNodes.includes(path)),
    ];
  }

  const navigation = useMixedNavigation(navigationKey, binding, {
    get selectedPath() {
      return activeNodeId;
    },
    get nodes() {
      return treeNodes;
    },
    clearSearch() {
      searchQuery = '';
    },
    parentPath(path) {
      return actions.getParentPath(path);
    },
    selectPath(targetPath) {
      activeNodeId = targetPath;
      if (
        revealAncestors &&
        isRoot &&
        showTreeView &&
        targetPath !== binding.control.path &&
        targetPath.startsWith(binding.control.path)
      ) {
        expandTo(targetPath);
      }
    },
  });
  const { navContext, parentNavContext } = navigation;
  const { treeNodePath, isRoot, structuredLayout } = $derived(navigation);

  let searchQuery = $state('');
  let focusedNodeId = $state<string>();
  let expandedNodes = $state<string[]>([]);
  let activeNodeId = $state<string>(binding.control.path);
  const frame = useMixedFrameState(() => binding.control.uischema);
  const editor = useMixedEditor(props, binding, buildTreeFromData, {
    get clearable() {
      return canClearType;
    },
    get showTree() {
      return showTreeView;
    },
    expand() {
      if (isRoot) frame.expanded = true;
    },
  });
  const { requestTypeChange } = editor;
  const { inputDataType, treeNodes } = $derived(editor);
  const actions = useMixedTreeActions(binding, navContext);
  let showPrimitivesInTree = $state<boolean>(false);

  const showTreeView = $derived(
    isRoot &&
      structuredLayout === 'tree' &&
      (inputDataType === 'object' || inputDataType === 'array'),
  );

  const isNestedComplexType = $derived(
    !isRoot && (inputDataType === 'object' || inputDataType === 'array'),
  );
  const nestedViewLabel = $derived(
    message('mixed.view', {
      label:
        binding.control.label ||
        message(inputDataType === 'object' ? 'mixed.object' : 'mixed.array'),
    }),
  );

  const isSelectedComplexType = $derived(
    (isRoot &&
      structuredLayout === 'nested' &&
      (inputDataType === 'object' || inputDataType === 'array')) ||
      (isNestedComplexType && parentNavContext?.selectedPath === treeNodePath),
  );

  const isTreeRootDetail = $derived(
    isSelectedComplexType && parentNavContext?.rootControl.path === treeNodePath,
  );

  const validationAt = (nodePath: string) => {
    const segments = [
      ...(binding.control.path ? binding.control.path.split('.') : []),
      ...actions.nodeSegments(nodePath),
    ];
    return {
      ...containerValidation(jsonforms.core, segments, binding.control.uischema, jsonforms.config),
      errors: summaryErrorsAt(jsonforms.core, segments),
    };
  };

  const selectedNode = $derived(
    showTreeView ? findMixedNodeByPath(treeNodes, activeNodeId) : undefined,
  );

  const breadcrumbSegments = $derived(
    showTreeView
      ? mixedTreeBreadcrumbs(treeNodes, activeNodeId, binding.control, inputDataType, (index) =>
          message('mixed.item', { index }),
        ).map((segment) => ({
          ...segment,
          accessibleLabel: segment.isRoot
            ? message(segment.type === 'array' ? 'mixed.arrayRoot' : 'mixed.objectRoot')
            : segment.label,
          iconType:
            segment.isRoot && (segment.type === 'object' || segment.type === 'array')
              ? segment.type
              : null,
        }))
      : [],
  );

  const isArrayItem = $derived.by(() => {
    const path = binding.control.path;
    if (!path) return false;
    const separator = path.lastIndexOf('.');
    const parent =
      separator < 0
        ? jsonforms.core?.data
        : Resolve.data(jsonforms.core?.data, path.slice(0, separator));
    return Array.isArray(parent);
  });
  const canClearType = $derived(
    !isArrayItem &&
      !(isNestedComplexType && isSelectedComplexType && parentNavContext?.treeEnabled) &&
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

  $effect(() => {
    const targetPath = activeNodeId;
    const treeVisible = showTreeView;

    if (
      !revealAncestors ||
      !isRoot ||
      !treeVisible ||
      !targetPath ||
      targetPath === binding.control.path ||
      !targetPath.startsWith(binding.control.path)
    ) {
      return;
    }

    untrack(() => {
      expandTo(targetPath);
    });
  });

  // Selection and detail editing use the complete tree. The primitive toggle
  // affects only displayed rows, just like search; it must not discard a target.

  const visibleTreeNodes = $derived(
    showPrimitivesInTree ? (treeNodes ?? []) : complexMixedTreeNodes(treeNodes ?? []),
  );

  const filteredTreeNodes = $derived(filterMixedTree(visibleTreeNodes, searchQuery));
  const treeExpandedValue = $derived(
    searchQuery.trim() ? mixedTreeBranchIds(filteredTreeNodes) : expandedNodes,
  );

  return {
    editor,
    navigation,
    frame,
    actions,
    validationAt,
    handleClearSelection,
    clearTypeButton(stopPropagation: boolean) {
      return {
        disabled: !binding.control.enabled,
        'aria-label': message('mixed.clearType'),
        onmousedown(event: MouseEvent) {
          event.preventDefault();
          if (stopPropagation) event.stopPropagation();
        },
        onclick(event: MouseEvent) {
          if (stopPropagation) event.stopPropagation();
          handleClearSelection();
        },
      };
    },
    handleNodeClick,
    get showTreeView() {
      return showTreeView;
    },
    get isNestedComplexType() {
      return isNestedComplexType;
    },
    get nestedViewLabel() {
      return nestedViewLabel;
    },
    get isSelectedComplexType() {
      return isSelectedComplexType;
    },
    get isTreeRootDetail() {
      return isTreeRootDetail;
    },
    get selectedNode() {
      return selectedNode;
    },
    get breadcrumbSegments() {
      return breadcrumbSegments;
    },
    get canClearType() {
      return canClearType;
    },
    get filteredTreeNodes() {
      return filteredTreeNodes;
    },
    get treeExpandedValue() {
      return treeExpandedValue;
    },
    get visibleTreeNodes() {
      return visibleTreeNodes;
    },
    searchAttributes<Vendor extends Record<string, unknown>>(props: Vendor) {
      return {
        ...props,
        type: 'text' as const,
        'aria-label': message('mixed.searchLabel'),
        placeholder: message('mixed.searchPlaceholder'),
      };
    },
    nodeFocus(id: string) {
      return {
        onfocus: () => {
          focusedNodeId = id;
        },
        onblur: () => {
          focusedNodeId = undefined;
        },
      };
    },
    navigationKey,
    get focusedNodeId() {
      return focusedNodeId;
    },
    set focusedNodeId(id: string | undefined) {
      focusedNodeId = id;
    },
    get searchQuery() {
      return searchQuery;
    },
    get expandedNodes() {
      return expandedNodes;
    },
    get activeNodeId() {
      return activeNodeId;
    },
    get primitiveToggleLabel() {
      return message(showPrimitivesInTree ? 'mixed.hidePrimitives' : 'mixed.showPrimitives');
    },
    togglePrimitives(event: MouseEvent) {
      event.stopPropagation();
      showPrimitivesInTree = !showPrimitivesInTree;
    },
    get showPrimitivesInTree() {
      return showPrimitivesInTree;
    },
    set searchQuery(value: string) {
      searchQuery = value;
    },
    set expandedNodes(value: string[]) {
      expandedNodes = value;
    },
    set activeNodeId(value: string) {
      activeNodeId = value;
    },
    set showPrimitivesInTree(value: boolean) {
      showPrimitivesInTree = value;
    },
  };
}
