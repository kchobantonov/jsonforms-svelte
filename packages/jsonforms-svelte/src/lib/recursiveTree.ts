// Adapted from React common recursiveTree.ts at 150fd688ae09f0f3b28e989649f3daf1d9f6d91d.
import { resolveSchema, type JsonSchema, type RankedTester } from '@jsonforms/core';
import { discriminatorBranch } from './discriminatorBranch';

export type RecursiveTreePath = (string | number)[];
export interface RecursiveTreeNode {
  label: string;
  path: RecursiveTreePath;
  data: unknown;
  schema: JsonSchema;
  children: RecursiveTreeNode[];
}

const member = (value: unknown, key: string): unknown =>
  value !== null && typeof value === 'object' && Object.hasOwn(value, key)
    ? (value as Record<string, unknown>)[key]
    : undefined;

function resolve(candidate: JsonSchema | boolean, root: JsonSchema): JsonSchema {
  if (typeof candidate === 'boolean') return candidate ? {} : { not: {} };
  return candidate.$ref ? (resolveSchema(root, candidate.$ref, root) ?? candidate) : candidate;
}

export function recursiveNodeSchema(
  schema: JsonSchema,
  root: JsonSchema,
  data: unknown,
): JsonSchema {
  const resolved = resolve(schema, root);
  let branch = resolved;
  for (const keyword of ['oneOf', 'anyOf'] as const) {
    const index = discriminatorBranch(resolved, root, keyword, data);
    if (index !== undefined) branch = resolve(resolved[keyword]![index], root);
  }
  return branch;
}

/** Walk finite data, not recursive schema definitions. Property names are literal members. */
export function buildRecursiveTree(
  data: unknown,
  schema: JsonSchema,
  root: JsonSchema,
  childrenProperty: string,
  labelProperty: string,
  fallback: string,
  path: RecursiveTreePath = [],
  ancestors = new Set<unknown>(),
): RecursiveTreeNode {
  const resolved = resolve(schema, root);
  const branch = recursiveNodeSchema(schema, root, data);
  const collection = branch.properties?.[childrenProperty];
  const arraySchema = collection === undefined ? undefined : resolve(collection, root);
  const children = member(data, childrenProperty);
  const name = member(data, labelProperty);
  const nextAncestors = new Set(ancestors).add(data);
  return {
    label: typeof name === 'string' && name.trim() ? name : fallback,
    path,
    data,
    schema: resolved,
    children:
      Array.isArray(children) && !ancestors.has(data)
        ? children.map((child, index) => {
            const items = arraySchema?.items;
            const item = Array.isArray(items)
              ? (items[index] ?? arraySchema?.additionalItems)
              : items;
            return buildRecursiveTree(
              child,
              item === undefined ? resolved : resolve(item, root),
              root,
              childrenProperty,
              labelProperty,
              String(index + 1),
              [...path, childrenProperty, index],
              nextAncestors,
            );
          })
        : [],
  };
}

export function findRecursiveTreeNode(
  tree: RecursiveTreeNode,
  path: RecursiveTreePath,
): RecursiveTreeNode | undefined {
  if (tree.path.length === path.length && tree.path.every((part, index) => part === path[index]))
    return tree;
  for (const child of tree.children) {
    const found = findRecursiveTreeNode(child, path);
    if (found) return found;
  }
  return undefined;
}

export function recursiveTreeParent(
  tree: RecursiveTreeNode,
  path: RecursiveTreePath,
): RecursiveTreeNode {
  for (let length = path.length - 2; length >= 0; length -= 2) {
    const parent = findRecursiveTreeNode(tree, path.slice(0, length));
    if (parent) return parent;
  }
  return tree;
}

/** Preserve identity through reorder; deletion selects an ancestor, not the replacement index. */
export function recursiveTreeSelection(
  tree: RecursiveTreeNode,
  previous: RecursiveTreeNode,
  previousTree: RecursiveTreeNode,
): RecursiveTreeNode {
  const identity = (node: RecursiveTreeNode): RecursiveTreeNode | undefined => {
    if (node.data === previous.data) return node;
    for (const child of node.children) {
      const found = identity(child);
      if (found) return found;
    }
    return undefined;
  };
  const retained = identity(tree);
  if (retained) return retained;
  const oldParent = recursiveTreeParent(previousTree, previous.path);
  const parent = recursiveTreeParent(tree, previous.path);
  if (previous.path.length && parent.children.length < oldParent.children.length) return parent;
  return findRecursiveTreeNode(tree, previous.path) ?? parent;
}

export const recursiveTreeTester: RankedTester = (ui) => {
  const options = ui.options?.recursiveTree;
  return ui.type === 'Control' &&
    options &&
    typeof options.childrenProperty === 'string' &&
    typeof options.labelProperty === 'string'
    ? 30
    : -1;
};
