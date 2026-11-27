import type { JsonSchema } from '@jsonforms/core';
import { compose } from '@jsonforms/core';
import { useJsonForms } from '@chobantonov/jsonforms-svelte';
import type { useJsonFormsControl } from '../core/jsonFormsCompositions.svelte';
import { useRendererMessages } from '../locale/rendererMessages.svelte';
import { useCollectionAction } from '../collections/collectionAction.svelte';
import { useDeletionConfirmation } from '../interaction/deletionConfirmation.svelte';
import { registerDetailDialogChange } from '../interaction/detailDialog.svelte';
import { validateAdditionalPropertyName } from '../objects/additionalPropertyName';
import {
  decodeMixedSegment,
  encodeMixedSegment,
  mixedValueAt,
  replaceMixedValue,
} from './mixedLiteral';
import { mixedPathIsReadOnly } from './mixedSafety';
import { selectionAfterDelete } from './mixedSelection';
import { resolveSchema } from './jsonTypeUtils';
import { findPropertySchema, getArrayItemSchema } from './schemaUtils';
import type { TreeNode, TreeNodeData } from './treeBuilder.svelte';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';

export function useMixedTreeActions(
  binding: ReturnType<typeof useJsonFormsControl> & { appliedOptions: Record<string, unknown> },
  navigation: { selectedPath: string; selectPath: (path: string) => void },
) {
  const jsonforms = useJsonForms();
  const message = useRendererMessages();
  let renamingNodeId = $state<string | null>(null);
  let renameValue = $state('');
  let renameError = $state<string | null>(null);
  let renameComposing = $state(false);
  let renameNode = $state.raw<TreeNode<TreeNodeData> | null>(null);
  let renameOwner = $state.raw<unknown[] | undefined>();
  const treeOwner = () => [
    binding.control.path,
    binding.control.schema,
    binding.control.rootSchema,
  ];
  const treeCommand = useCollectionAction(
    () => binding.control,
    () => true,
  );
  registerDetailDialogChange({
    isBlocked: () => renameComposing || (!!renamingNodeId && !!renameError),
    cancel: cancelRename,
  });
  $effect(() => {
    void renameValue;
    renameError = null;
  });
  $effect(() => {
    if (renameNode && (!canRenameNode(renameNode) || !isEqual(treeOwner(), renameOwner)))
      cancelRename();
  });
  const treeDeletion = useDeletionConfirmation(
    () => ({
      ...binding.control,
      options: binding.control.uischema.options,
      config: jsonforms.config,
    }),
    'mixed',
    () => !renamingNodeId,
  );
  function getParentPath(nodePath: string): string {
    const lastDot = nodePath.lastIndexOf('.');
    return lastDot > 0 ? nodePath.substring(0, lastDot) : binding.control.path;
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
  function readNodeValue(path: string): unknown {
    return mixedValueAt(binding.control.data, nodeSegments(path));
  }
  function writeNodeValue(path: string, value: unknown): void {
    if (
      !binding.control.enabled ||
      !binding.control.visible ||
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
    if (
      !node.data ||
      !binding.control.enabled ||
      binding.control.readonly ||
      !binding.control.visible
    )
      return false;
    const relative = getRelativePath(node.data.path);
    return !mixedPathIsReadOnly(
      binding.control.schema,
      binding.control.rootSchema,
      binding.control.data,
      relative === null ? [] : relative.split('.').map(decodeMixedSegment),
    );
  }

  function isDeleteDisabled(node: TreeNode<TreeNodeData>): boolean {
    if (
      !canMutateNode(node) ||
      !node.data?.canDelete ||
      binding.appliedOptions.disableRemove === true ||
      !nodeExists(node)
    )
      return true;
    if (!binding.control.enabled) return true;
    if (binding.appliedOptions?.restrict === false) return false;

    const nodePath = node.data!.path;
    const parentPath = getParentPath(nodePath);
    const parentData = readNodeValue(parentPath);
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
        !!parentSchema.required?.includes(nodeSegments(node.data!.path).at(-1) ?? '') ||
        (parentSchema.minProperties !== undefined &&
          Object.keys(parentData).length <= parentSchema.minProperties)
      );
    }

    return false;
  }

  function handleNodeDelete(node: TreeNode<TreeNodeData>) {
    void treeDeletion.request(
      () => [readNodeValue(node.data!.path)],
      () => commitDelete(node),
      () => !isDeleteDisabled(node),
    );
  }

  function commitDelete(node: TreeNode<TreeNodeData>) {
    if (isDeleteDisabled(node)) {
      return;
    }
    const nodePath = node.data!.path;
    const parentPath = getParentPath(nodePath);
    const key = decodeMixedSegment(nodePath.slice(parentPath ? parentPath.length + 1 : 0));
    const parentData = readNodeValue(parentPath);

    if (Array.isArray(parentData)) {
      // Remove item from array
      const index = parseInt(key);
      const updated = [...parentData];
      updated.splice(index, 1);
      writeNodeValue(parentPath, updated);
    } else if (typeof parentData === 'object' && parentData !== null) {
      // Remove key from object
      const updated: Record<string, unknown> = { ...parentData };
      delete updated[key];
      writeNodeValue(parentPath, updated);
    }

    navigation.selectPath(
      selectionAfterDelete(
        navigation.selectedPath,
        nodePath,
        parentPath,
        Array.isArray(parentData) ? Number(key) : undefined,
      ),
    );
  }

  function nodeExists(node: TreeNode<TreeNodeData>) {
    if (!node.data) return false;
    const parent = readNodeValue(getParentPath(node.data.path));
    const key = nodeSegments(node.data.path).at(-1) ?? '';
    return parent !== null && typeof parent === 'object' && Object.hasOwn(parent, key);
  }

  function canRenameNode(node: TreeNode<TreeNodeData>) {
    if (!canMutateNode(node) || !node.data?.canRename || !nodeExists(node)) return false;
    const schema = resolveSchema(
      getParentSchema(getParentPath(node.data.path)) ?? {},
      binding.control.rootSchema,
    );
    return (
      binding.appliedOptions.restrict === false ||
      !schema.required?.includes(nodeSegments(node.data.path).at(-1) ?? '')
    );
  }

  function handleRename(node: TreeNode<TreeNodeData>) {
    void treeCommand(
      () => canRenameNode(node),
      () => {
        renameNode = node;
        renameOwner = cloneDeep(treeOwner());
        renamingNodeId = node.id;
        renameValue = nodeSegments(node.data!.path).at(-1) ?? '';
        renameError = null;
      },
    );
  }

  function commitRename(node: TreeNode<TreeNodeData>) {
    void treeCommand(
      () => renamingNodeId === node.id && !renameComposing && canRenameNode(node),
      () => performRename(node),
    );
  }

  function performRename(node: TreeNode<TreeNodeData>) {
    if (renameComposing || renamingNodeId !== node.id) return;
    if (!canRenameNode(node) || !isEqual(treeOwner(), renameOwner)) {
      cancelRename();
      return;
    }
    if (renameValue === (nodeSegments(node.data!.path).at(-1) ?? '')) {
      cancelRename();
      return;
    }

    const nodePath = node.data!.path;
    const parentPath = getParentPath(nodePath);
    const oldKey = nodeSegments(node.data!.path).at(-1) ?? '';
    const parentData = readNodeValue(parentPath);

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
            ? message('additionalProperties.nameRequired')
            : validation.error === 'already-defined'
              ? message('additionalProperties.nameTaken', { name: validation.name })
              : validation.reason === 'pattern'
                ? message('additionalProperties.namePattern')
                : message('additionalProperties.nameInvalid', { name: validation.name });
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
      navigation.selectPath(newPath);
    }

    cancelRename();
  }

  function cancelRename() {
    renamingNodeId = null;
    renameValue = '';
    renameError = null;
    renameNode = null;
    renameOwner = undefined;
    renameComposing = false;
  }

  return {
    getParentPath,
    nodeSegments,
    treeDeletion,
    canRenameNode,
    isDeleteDisabled,
    handleNodeDelete,
    nodeAction(node: TreeNode<TreeNodeData>, action: 'rename' | 'delete') {
      return {
        title: message(action === 'rename' ? 'mixed.rename' : 'mixed.delete'),
        onclick(event: MouseEvent) {
          event.stopPropagation();
          if (action === 'rename') handleRename(node);
          else handleNodeDelete(node);
        },
      };
    },
    handleRename,
    renameInput(node: TreeNode<TreeNodeData>) {
      return {
        'data-tree-rename': true,
        'aria-label': message('additionalProperties.renamePropertyNameLabel'),
        'aria-invalid': !!renameError,
        oncompositionstart: () => (renameComposing = true),
        oncompositionend: () => (renameComposing = false),
        onclick: (event: MouseEvent) => event.stopPropagation(),
        onkeydown(event: KeyboardEvent) {
          event.stopPropagation();
          if (event.key === 'Enter' && !event.isComposing) commitRename(node);
          if (event.key === 'Escape') cancelRename();
        },
      };
    },
    renameButton(node: TreeNode<TreeNodeData>, confirm: boolean) {
      return {
        'aria-label': message(confirm ? 'additionalProperties.renameConfirm' : 'mixed.cancel'),
        onclick(event: MouseEvent) {
          event.stopPropagation();
          if (confirm) commitRename(node);
          else cancelRename();
        },
      };
    },
    commitRename,
    cancelRename,
    get renamingNodeId() {
      return renamingNodeId;
    },
    get renameValue() {
      return renameValue;
    },
    set renameValue(value: string) {
      renameValue = value;
    },
    get renameComposing() {
      return renameComposing;
    },
    set renameComposing(value: boolean) {
      renameComposing = value;
    },
    get renameError() {
      return renameError;
    },
  };
}
