<script lang="ts">
  import { getContext, setContext, untrack, type Component } from 'svelte';
  import {
    composePaths,
    resolveSchema,
    schemaTypeIs,
    type ControlElement,
    type JsonFormsRendererRegistryEntry,
    type JsonSchema,
    type JsonSchema7,
  } from '@jsonforms/core';
  import {
    useJsonForms,
    useJsonFormsControl,
    type ControlProps,
  } from '../jsonFormsCompositions.svelte';
  import { useRendererMessages } from '../rendererMessages.svelte';
  import {
    buildRecursiveTree,
    findRecursiveTreeNode,
    recursiveNodeSchema,
    recursiveTreeParent,
    recursiveTreeSelection,
    type RecursiveTreeNode,
  } from '../recursiveTree';
  import {
    RecursiveTreeNavigationSymbol,
    type RecursiveTreeNavigation,
    type RecursiveTreeViewProps,
    type RecursiveTreeLinkProps,
  } from '../recursiveTreeContext';
  import { useConfirmation } from '../confirmation.svelte';
  import type { ConfirmationOperation } from '../confirmation';
  import { containerValidation } from '../containerValidation';
  import { summaryErrorsAt } from '../errorSummary';
  import { resolveEditorDetail } from '../detail';
  import { mixedValueAt, replaceMixedValue } from '../mixedLiteral';
  import {
    LiteralControlScopeSymbol,
    LiteralDataContextSymbol,
    type LiteralDataContext,
  } from '../literalDataContext';
  import DispatchRenderer from './DispatchRenderer.svelte';
  import LiteralControl from './LiteralControl.svelte';
  import RecursiveChildren from './RecursiveChildren.svelte';
  import RecursiveNodeLink from './RecursiveNodeLink.svelte';

  // Adapter components are used by dynamic tags and the child navigation context.
  // eslint-disable-next-line svelte/no-unused-props
  const props: ControlProps & {
    Tree: Component<RecursiveTreeViewProps>;
    Link: Component<RecursiveTreeLinkProps>;
    ConfirmationDialog: Component<{
      operation: ConfirmationOperation;
      onAccept: () => void;
      onCancel: () => void;
    }>;
  } = $props();
  const binding = useJsonFormsControl(props);
  const form = useJsonForms();
  const outerLiteral = getContext<LiteralDataContext | undefined>(LiteralDataContextSymbol);
  const message = useRendererMessages();
  const confirmation = useConfirmation();
  const options = $derived(
    (binding.control.uischema.options?.recursiveTree ?? {
      childrenProperty: 'children',
      labelProperty: 'name',
    }) as {
      childrenProperty: string;
      labelProperty: string;
      detail?: unknown;
    },
  );
  const tree = $derived(
    buildRecursiveTree(
      binding.control.data,
      binding.control.schema,
      binding.control.rootSchema,
      options.childrenProperty,
      options.labelProperty,
      binding.control.label || message('mixed.value'),
    ),
  );
  let selection = $state.raw(untrack(() => ({ node: tree, tree })));
  const selected = $derived(
    selection.tree === tree
      ? selection.node
      : recursiveTreeSelection(tree, selection.node, selection.tree),
  );
  $effect(() => {
    if (selection.tree !== tree) selection = { node: selected, tree };
  });
  const nodePath = (node: RecursiveTreeNode) =>
    node.path.reduce<string>((path, key) => composePaths(path, String(key)), binding.control.path);
  const isolatedPath = $derived(
    selected.path.some(
      (part) =>
        typeof part === 'string' &&
        (part === '' || part.includes('.') || part.includes('\0') || part in Object.prototype),
    ),
  );
  const isolatedScope = $derived(
    '#' +
      selected.path
        .map((part) => '/properties/' + String(part).replaceAll('~', '~0').replaceAll('/', '~1'))
        .join(''),
  );
  const isolatedSchema = $derived(
    selected.path.reduceRight<JsonSchema>(
      (child, part) => ({ type: 'object', properties: { [String(part)]: child } }) as JsonSchema,
      selected.schema,
    ),
  );
  const select = (node: RecursiveTreeNode) => {
    selection = { node, tree };
  };
  const branch = (node: RecursiveTreeNode) =>
    recursiveNodeSchema(node.schema, binding.control.rootSchema, node.data);
  const property = (node: RecursiveTreeNode, key: string) => {
    const properties = branch(node).properties;
    return properties && Object.hasOwn(properties, key) ? properties[key] : undefined;
  };
  const resolve = (schema: JsonSchema | undefined) =>
    schema?.$ref
      ? (resolveSchema(binding.control.rootSchema, schema.$ref, binding.control.rootSchema) ??
        schema)
      : schema;
  function writable(node: RecursiveTreeNode): boolean {
    if (!binding.control.enabled || binding.control.readonly) return false;
    for (let length = 0; length <= node.path.length; length += 2) {
      const ancestor = findRecursiveTreeNode(tree, node.path.slice(0, length));
      if (!ancestor || (branch(ancestor) as JsonSchema7).readOnly) return false;
      if (
        length < node.path.length &&
        (resolve(property(ancestor, options.childrenProperty)) as JsonSchema7 | undefined)?.readOnly
      )
        return false;
    }
    return true;
  }
  function canDelete(node: RecursiveTreeNode): boolean {
    if (!node.path.length || !writable(node)) return false;
    const parent = recursiveTreeParent(tree, node.path);
    const collection = resolve(property(parent, options.childrenProperty)) as
      | JsonSchema7
      | undefined;
    return (
      writable(parent) &&
      !collection?.readOnly &&
      parent.children.length > (collection?.minItems ?? 0)
    );
  }
  const nameSchema = (node: RecursiveTreeNode) =>
    resolve(property(node, options.labelProperty)) as JsonSchema7 | undefined;
  function canRename(node: RecursiveTreeNode): boolean {
    const field = nameSchema(node);
    return !!(
      writable(node) &&
      field &&
      !field.readOnly &&
      field.const === undefined &&
      (!field.type || field.type === 'string')
    );
  }
  function validateRename(node: RecursiveTreeNode, name: string): string | undefined {
    if (!name.trim()) return message('mixed.nameRequired');
    try {
      const field = nameSchema(node);
      if (!field || !form.core?.ajv?.validate(field, name))
        return message('mixed.nameInvalid', { name });
    } catch {
      return message('mixed.nameInvalid', { name });
    }
  }
  function remove(node: RecursiveTreeNode) {
    if (!canDelete(node)) return;
    const originalPath = binding.control.path;
    confirmation.request({
      catalogId: 'mixed',
      operation: 'delete',
      options: binding.control.uischema.options,
      config: form.config,
      discarded: [node.data],
      perform: () => {
        const target = findRecursiveTreeNode(tree, node.path);
        if (
          binding.control.path !== originalPath ||
          !target ||
          target.data !== node.data ||
          !canDelete(target)
        )
          return;
        const segments = target.path.slice(0, -1).map(String);
        const siblings = mixedValueAt(binding.control.data, segments);
        if (!Array.isArray(siblings)) return;
        const updated = [...siblings];
        updated.splice(Number(target.path.at(-1)), 1);
        binding.handleChange(
          binding.control.path,
          replaceMixedValue(binding.control.data, segments, updated),
        );
      },
    });
  }
  function rename(node: RecursiveTreeNode, name: string) {
    const target = findRecursiveTreeNode(tree, node.path);
    if (!target || target.data !== node.data || !canRename(target) || validateRename(target, name))
      return;
    const data = target.data as Record<string, unknown>;
    binding.handleChange(
      binding.control.path,
      replaceMixedValue(binding.control.data, target.path.map(String), {
        ...data,
        [options.labelProperty]: name,
      }),
    );
  }
  const registry = $derived<JsonFormsRendererRegistryEntry[]>([
    { tester: (ui) => (ui.options?.recursiveTreeNodeLink ? 100 : -1), renderer: RecursiveNodeLink },
    {
      tester: (ui, schema, context) => {
        const originalScope = (ui.options as Record<symbol, unknown> | undefined)?.[
          LiteralControlScopeSymbol
        ];
        const scope =
          typeof originalScope === 'string' ? originalScope : (ui as ControlElement).scope;
        return !ui.options?.recursiveTreeChildren &&
          scope?.endsWith(
            '/properties/' + options.childrenProperty.replaceAll('~', '~0').replaceAll('/', '~1'),
          ) &&
          schemaTypeIs('array')(ui, schema, context)
          ? 100
          : -1;
      },
      renderer: RecursiveChildren,
    },
    ...(binding.control.renderers ?? []),
  ]);
  const detail = $derived(
    resolveEditorDetail(
      options.detail,
      form.uischemas ?? [],
      selected.schema,
      '#',
      nodePath(selected),
      binding.control.rootSchema,
      { type: 'Control', scope: '#', label: binding.control.label } as ControlElement,
    ),
  );
  setContext<RecursiveTreeNavigation>(RecursiveTreeNavigationSymbol, {
    get Link() {
      return props.Link;
    },
    get labelProperty() {
      return options.labelProperty;
    },
    selectPath(path) {
      const find = (node: RecursiveTreeNode): RecursiveTreeNode | undefined =>
        nodePath(node) === path ? node : node.children.map(find).find(Boolean);
      const node = find(tree);
      if (node) select(node);
    },
    selectSegments(segments) {
      const base = [
        ...(outerLiteral?.segments() ?? []),
        ...(binding.control.path ? binding.control.path.split('.') : []),
      ];
      const find = (node: RecursiveTreeNode): RecursiveTreeNode | undefined => {
        const path = [...base, ...node.path.map(String)];
        return path.length === segments.length &&
          path.every((part, index) => part === segments[index])
          ? node
          : node.children.map(find).find(Boolean);
      };
      const node = find(tree);
      if (node) select(node);
    },
  });
  const validation = (node: RecursiveTreeNode) => {
    const segments = [
      ...(binding.control.path ? binding.control.path.split('.') : []),
      ...node.path,
    ];
    return {
      ...containerValidation(form.core, segments, binding.control.uischema, form.config),
      errors: summaryErrorsAt(form.core, segments.map(String)),
    };
  };
</script>

{#if binding.control.visible}
  <div class="flex min-w-0 flex-wrap items-start gap-4" data-recursive-tree>
    <div class="min-w-0 flex-[1_1_240px]" data-recursive-tree-navigation>
      <props.Tree
        root={tree}
        {selected}
        {select}
        {canDelete}
        {canRename}
        {remove}
        {rename}
        {validateRename}
        {validation}
      />
    </div>
    <div class="min-w-0 flex-[3_1_360px]" data-recursive-tree-detail>
      {#key JSON.stringify(selected.path)}
        {#if isolatedPath}
          <LiteralControl
            schema={isolatedSchema}
            path={binding.control.path}
            enabled={binding.control.enabled}
            renderers={registry}
            cells={binding.control.cells}
            existingOnly
            uischema={{ type: 'Control', scope: isolatedScope, label: binding.control.label }}
            isolatedUiSchema={{
              ...detail,
              options: { ...detail.options, recursiveTree: undefined },
            }}
          />
        {:else}
          <DispatchRenderer
            schema={selected.schema}
            path={nodePath(selected)}
            enabled={binding.control.enabled}
            renderers={registry}
            cells={binding.control.cells}
            uischema={{ ...detail, options: { ...detail.options, recursiveTree: undefined } }}
          />
        {/if}
      {/key}
    </div>
  </div>
  {#each confirmation.pending ? [confirmation.pending] : [] as request (request)}
    <props.ConfirmationDialog
      operation={request.operation}
      onAccept={() => confirmation.accept(request)}
      onCancel={() => confirmation.cancel(request)}
    />
  {/each}
{/if}
