import cloneDeep from 'lodash/cloneDeep';
import {
  compose,
  createControlElement,
  type ControlElement,
  type JsonSchema,
  type JsonSchema7,
} from '@jsonforms/core';
import { untrack } from 'svelte';
import { useFlowbiteControl } from '../../util';
import { useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
import { cleanSchema, getJsonDataType, resolveSchema, type JsonDataType } from './jsonTypeUtils';
import { findPropertySchema, getArrayItemSchema } from './schemaUtils';
import type { TreeNode } from '../../components/TreeView/types';

export interface TreeNodeControl {
  id: string;
  schema: JsonSchema;
  uischema: ControlElement;
  path: string;
  label: string;
  required: boolean;
  enabled: boolean;
}

export interface TreeNodeData {
  control: TreeNodeControl;
  path: string;
  label: string;
  type: JsonDataType;
  canRename: boolean;
  canDelete: boolean;
}

function prepareObjectSchema(schema: JsonSchema): JsonSchema {
  const objectSchema = cleanSchema(cloneDeep({ ...schema, type: 'object' }));
  objectSchema.additionalProperties =
    objectSchema.additionalProperties !== false
      ? (objectSchema.additionalProperties ?? true)
      : false;
  return objectSchema;
}

function prepareArraySchema(schema: JsonSchema, rootSchema: JsonSchema): JsonSchema {
  const arraySchema = cleanSchema(cloneDeep({ ...schema, type: 'array' }));

  arraySchema.items = arraySchema.items ?? {};
  arraySchema.items = resolveSchema(arraySchema.items as JsonSchema, rootSchema);

  if ((arraySchema.items as any) === true) {
    arraySchema.items = {
      type: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'],
    };
  } else if (
    typeof (arraySchema.items as JsonSchema7).type !== 'string' &&
    !Array.isArray((arraySchema.items as JsonSchema7).type)
  ) {
    (arraySchema.items as JsonSchema7).type = [
      'array',
      'boolean',
      'integer',
      'null',
      'number',
      'object',
      'string',
    ];
  }

  return arraySchema;
}

function prepareChildSchema(
  childType: JsonDataType,
  currentSchema: JsonSchema,
  key: string,
  index: number | null,
  rootSchema: JsonSchema,
): JsonSchema {
  let childSchema: JsonSchema | undefined;

  if (index !== null) {
    // Array item
    childSchema = getArrayItemSchema(currentSchema, index, rootSchema);
    if (!childSchema) {
      // Fallback: create schema with mixed types to allow type changes
      childSchema = {
        type: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'],
        title: `Item ${index}`,
      };
    } else {
      childSchema = { ...childSchema, title: `Item ${index}` };
    }
  } else {
    // Object property
    childSchema = findPropertySchema(currentSchema, key, rootSchema);
    if (!childSchema) {
      // Fallback: create schema with mixed types to allow type changes
      childSchema = {
        type: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'],
        title: key,
      };
    } else {
      childSchema = { ...childSchema, title: key };
    }
  }

  // Ensure mixed types are preserved for primitives if the schema allows multiple types
  if (childType !== 'object' && childType !== 'array') {
    // If the schema has a type array (mixed types), preserve it
    if (Array.isArray(childSchema.type) && childSchema.type.length > 1) {
      // Keep the mixed type array - don't narrow it down
    } else if (!childSchema.type || (childSchema.type as any) === true) {
      // If no type specified or type is true, allow all types
      childSchema.type = ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'];
    }
    // Otherwise keep the single type as is
  }

  if (childType === 'object') {
    childSchema = prepareObjectSchema(childSchema);
  } else if (childType === 'array') {
    childSchema = prepareArraySchema(childSchema, rootSchema);
  }

  return childSchema;
}

// Simple control creator without runes - just returns the control
function createControl(schema: JsonSchema, currentPath: string) {
  return useFlowbiteControl(
    useJsonFormsControl({
      schema,
      path: currentPath,
      uischema: createControlElement('#'),
    }),
  );
}

export function buildTreeFromData(
  data: any,
  schema: JsonSchema,
  rootSchema: JsonSchema,
  path: string,
  label: string,
  showPrimitivesInTree: boolean,
): TreeNode<TreeNodeData>[] {
  const nodes: TreeNode<TreeNodeData>[] = [];
  const dataType = getJsonDataType(data);

  if (dataType !== 'object' && dataType !== 'array') {
    return nodes;
  }

  // Helper to create a tree node with control
  function createTreeNode(
    currentPath: string,
    label: string,
    type: JsonDataType,
    preparedSchema: JsonSchema,
    canRename: boolean,
    canDelete: boolean,
  ): Required<TreeNode<TreeNodeData>> {
    const resolvedControl = $derived(untrack(() => createControl(preparedSchema, currentPath)));

    return {
      id: currentPath,
      label,
      children: [],
      data: {
        path: currentPath,
        label,
        type,
        canRename,
        canDelete,
        get control() {
          return resolvedControl.control;
        },
      },
    };
  }

  function isDynamicProperty(parentSchema: JsonSchema, key: string): boolean {
    // If it's explicitly defined in properties, it's not dynamic
    if (parentSchema.properties && parentSchema.properties[key]) {
      return false;
    }
    // It came from patternProperties or additionalProperties - it's dynamic
    return true;
  }
  // Helper to process children (both object properties and array items)
  function processChildren(
    parentNode: Required<TreeNode<TreeNodeData>>,
    currentSchema: JsonSchema,
    children: Array<{ key: string; value: any; index: number | null }>,
    showPrimitivesInTree: boolean,
  ) {
    children.forEach(({ key, value, index }) => {
      const childType = getJsonDataType(value);

      if (!childType) return;

      // Determine the child path and label using parent node's data.path
      const childPath =
        index !== null
          ? compose(parentNode.data.path, `${index}`)
          : compose(parentNode.data.path, key);

      const childLabel = index !== null ? `Item ${index}` : key;

      // Object property keys can be renamed, array items cannot
      const canRename = index === null && isDynamicProperty(currentSchema, key);
      const canDelete = true;

      if (childType === 'object' || childType === 'array') {
        // Always traverse complex types
        const childSchema = prepareChildSchema(childType, currentSchema, key, index, rootSchema);
        traverse(
          value,
          childPath,
          childLabel,
          childSchema,
          parentNode.children,
          canRename,
          canDelete,
        );
      } else if (showPrimitivesInTree) {
        // Optionally show primitives
        const childSchema = prepareChildSchema(childType, currentSchema, key, index, rootSchema);
        const primitiveControl = $derived(untrack(() => createControl(childSchema, childPath)));

        const displayLabel = index !== null ? `[${index}]` : childLabel;

        const primitiveNode: Required<TreeNode<TreeNodeData>> = {
          id: childPath,
          label: displayLabel,
          children: [],
          data: {
            path: childPath,
            label: childLabel,
            type: childType,
            canRename,
            canDelete,
            get control() {
              return primitiveControl.control;
            },
          },
        };
        parentNode.children.push(primitiveNode);
      }
    });
  }

  function traverse(
    value: any,
    currentPath: string,
    label: string,
    currentSchema: JsonSchema,
    children: TreeNode<TreeNodeData>[],
    canRename: boolean = false,
    canDelete: boolean = false,
  ) {
    const type = getJsonDataType(value);

    if (type === 'object') {
      const objectSchema = prepareObjectSchema(currentSchema);
      const node = createTreeNode(currentPath, label, type, objectSchema, canRename, canDelete);
      children.push(node);

      const objectChildren = Object.entries(value).map(([key, val]) => ({
        key,
        value: val,
        index: null,
      }));

      processChildren(node, currentSchema, objectChildren, showPrimitivesInTree);
    } else if (type === 'array') {
      const arraySchema = prepareArraySchema(currentSchema, rootSchema);
      const node = createTreeNode(currentPath, label, type, arraySchema, canRename, canDelete);
      children.push(node);

      const arrayChildren = value.map((item: any, index: number) => ({
        key: '',
        value: item,
        index,
      }));

      processChildren(node, currentSchema, arrayChildren, showPrimitivesInTree);
    }
  }

  // Start traversal
  const resolvedCurrentSchema = resolveSchema(schema, rootSchema);
  traverse(data, path, label, resolvedCurrentSchema, nodes);
  return nodes;
}
