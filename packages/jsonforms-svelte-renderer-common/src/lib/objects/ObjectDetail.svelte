<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import {
    Generate,
    type ControlElement,
    type GroupLayout,
    type UISchemaElement,
  } from '@jsonforms/core';
  import type {
    RendererProps,
    useJsonFormsControlWithDetail,
  } from '../core/jsonFormsCompositions.svelte';
  import DispatchRenderer from '../core/DispatchRenderer.svelte';
  import { scopeDataSegments } from '../core/schemaScope';
  import { findDetailUISchema } from '../core/detail';
  import { useUiSchemaCycleGuard } from '../core/uiSchemaCycle.svelte';
  import { useDynamicTreeResolver } from '../dynamic/dynamicTree.svelte';
  import {
    createMissingObject,
    useRecursiveComposition,
  } from '../mixed/recursiveComposition.svelte';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  import { provideObjectErrors } from '../validation/objectErrors.svelte';
  import { useConditionalFields } from './conditionalFields.svelte';
  import { conditionalLayout } from './conditionalFields';
  import cloneDeep from 'lodash/cloneDeep';
  import isEmpty from 'lodash/isEmpty';
  import type { AdditionalPropertiesProps } from './propertyRename.svelte';
  import { showAdditionalPropertyEditor } from './additionalPropertySchema';

  let {
    binding,
    rendererProps,
    nested,
    boundary,
    createButton,
    AdditionalProperties,
  }: {
    binding: ReturnType<typeof useJsonFormsControlWithDetail> & {
      appliedOptions: Record<string, unknown>;
    };
    rendererProps: RendererProps<ControlElement>;
    nested: { level: number; parentElement?: 'array' | 'object' };
    boundary: Snippet<[label: string, content: Snippet]>;
    createButton: Snippet<[label: string, disabled: boolean, create: () => void]>;
    AdditionalProperties: Component<AdditionalPropertiesProps>;
  } = $props();

  const resolveTree = useDynamicTreeResolver();
  const pathSegments = $derived(
    rendererProps.pathSegments
      ? [...rendererProps.pathSegments, ...scopeDataSegments(rendererProps.uischema.scope)]
      : undefined,
  );
  const conditional = useConditionalFields(() => binding.control);
  const projectedSchema = $derived(conditional.value.schema);
  const messages = useRendererMessages();
  const recursion = useRecursiveComposition(() => ({
    schema: binding.control.schema,
    path: binding.control.path,
  }));

  const objectLabel = $derived(
    binding.control.uischema.label === false ? '' : binding.control.label,
  );

  // Computed values
  const showAdditionalProperties = $derived(
    showAdditionalPropertyEditor(
      projectedSchema,
      binding.appliedOptions.allowAdditionalPropertiesIfMissing,
    ) ||
      (binding.control.data !== null &&
        typeof binding.control.data === 'object' &&
        !Array.isArray(binding.control.data) &&
        Object.keys(binding.control.data).some(
          (key) =>
            !Object.hasOwn(projectedSchema.properties ?? {}, key) &&
            !conditional.value.known.has(key),
        )),
  );

  const uiSchemaGenerator = (): UISchemaElement => {
    const uiSchema = Generate.uiSchema(
      projectedSchema,
      'Group',
      undefined,
      binding.control.rootSchema,
    );
    if (isEmpty(binding.control.path)) {
      uiSchema.type = 'VerticalLayout';
    } else {
      (uiSchema as GroupLayout).label = objectLabel;
    }
    return uiSchema;
  };

  const resolvedDetail = $derived(
    findDetailUISchema(
      binding.control.uischemas,
      projectedSchema,
      binding.control.uischema.scope,
      binding.control.path,
      uiSchemaGenerator,
      binding.control.uischema,
      binding.control.rootSchema,
    ),
  );

  const cycleGuard = useUiSchemaCycleGuard(() => ({
    uischema: resolvedDetail,
    path: binding.control.path,
  }));

  const detailUiSchema = $derived.by((): UISchemaElement => {
    let result = cycleGuard.cycle ? uiSchemaGenerator() : resolvedDetail;

    if (nested.level > 0) {
      result = cloneDeep(result);
      result.options = {
        ...result.options,
        bare: true,
        alignLeft: nested.level >= 4 || nested.parentElement === 'array',
      };
    }

    return conditionalLayout(
      resolveTree(result, binding.control.path, pathSegments),
      projectedSchema,
      conditional.value.known,
    );
  });
  const objectErrors = provideObjectErrors(
    () => binding.control,
    () => detailUiSchema,
  );
  function createObject() {
    createMissingObject(binding);
  }
</script>

{#snippet objectFields()}
  {#each conditional.value.diagnostics as code (code)}
    <div role="status">{messages(code)}</div>
  {/each}
  {#if detailUiSchema.type !== 'Group' && objectErrors.message}
    <p
      role="alert"
      data-object-own-errors
      class="text-sm whitespace-pre-line text-red-600 dark:text-red-400"
    >
      {objectErrors.message}
    </p>
  {/if}
  <DispatchRenderer
    visible={binding.control.visible}
    enabled={binding.control.enabled}
    schema={projectedSchema}
    uischema={detailUiSchema}
    {pathSegments}
    path={binding.control.path}
    renderers={binding.control.renderers}
    cells={binding.control.cells}
  >
    {#if showAdditionalProperties && detailUiSchema.type === 'Group'}
      <AdditionalProperties
        input={binding}
        embedded={true}
        disallowedPropertyNames={[...conditional.value.known]}
      />
    {/if}
  </DispatchRenderer>
  {#if showAdditionalProperties && detailUiSchema.type !== 'Group'}
    <AdditionalProperties
      input={binding}
      embedded={Boolean(binding.control.path)}
      disallowedPropertyNames={[...conditional.value.known]}
    />
  {/if}
{/snippet}

{#snippet content()}
  <div class="flex flex-col gap-2">
    {#if recursion.repeated && binding.control.data === undefined}
      {@render createButton(
        messages('recursive.create'),
        !binding.control.enabled || !!binding.control.readonly,
        createObject,
      )}
      {#if binding.control.errors}
        <p role="alert" class="text-sm text-red-600 dark:text-red-400">{binding.control.errors}</p>
      {/if}
    {:else}
      {@render objectFields()}
    {/if}
  </div>
{/snippet}

{#if binding.control.visible}
  {#if binding.control.path && detailUiSchema.type !== 'Group'}
    {@render boundary(objectLabel, content)}
  {:else}
    {@render content()}
  {/if}
{/if}
