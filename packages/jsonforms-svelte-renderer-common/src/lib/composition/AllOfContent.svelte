<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { useJsonFormsAllOfControl } from '../core/jsonFormsCompositions.svelte';
  import DispatchRenderer from '../core/DispatchRenderer.svelte';
  import ScalarCompositionControl from './ScalarCompositionControl.svelte';
  import CombinatorProperties from './CombinatorProperties.svelte';
  import { scalarCompositionProps } from './scalarComposition';
  import { scalarAllOfSchema } from './scalarAllOf';
  import {
    createMissingObject,
    useRecursiveComposition,
  } from '../mixed/recursiveComposition.svelte';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  import { showAdditionalPropertyEditor } from '../objects/additionalPropertySchema';
  import {
    createCombinatorRenderInfos,
    findMatchingUISchema,
    type CombinatorSubSchemaRenderInfo,
  } from '@jsonforms/core';

  const {
    binding,
    createButton,
    additionalProperties,
  }: {
    binding: ReturnType<typeof useJsonFormsAllOfControl> & {
      appliedOptions: Record<string, unknown>;
    };
    createButton: Snippet<[boolean, () => void, string]>;
    additionalProperties: Snippet<[string[]]>;
  } = $props();

  const recursion = useRecursiveComposition(() => ({
    schema: binding.control.schema,
    path: binding.control.path,
  }));
  const message = useRendererMessages();

  const scalarControl = $derived(
    scalarCompositionProps(
      binding.control,
      scalarAllOfSchema(binding.control.schema, binding.control.rootSchema) ?? undefined,
    ),
  );

  const create = () => {
    createMissingObject(binding);
  };

  const delegateUISchema = $derived(
    findMatchingUISchema(binding.control.uischemas)(
      binding.control.schema,
      binding.control.uischema.scope,
      binding.control.path,
    ),
  );

  const allOfRenderInfos = $derived.by((): CombinatorSubSchemaRenderInfo[] => {
    const result = createCombinatorRenderInfos(
      binding.control.schema.allOf!,
      binding.control.rootSchema,
      'allOf',
      binding.control.uischema,
      binding.control.path,
      binding.control.uischemas,
    );

    return result.filter((info) => info.uischema);
  });

  const showAdditionalProperties = $derived(
    showAdditionalPropertyEditor(
      binding.control.schema,
      binding.appliedOptions.allowAdditionalPropertiesIfMissing,
    ) || allOfRenderInfos.some((info) => showAdditionalPropertyEditor(info.schema)),
  );

  const reservedPropertyNames = $derived(
    allOfRenderInfos.flatMap((allOfRenderInfo) =>
      Object.keys(allOfRenderInfo.schema.properties || {}),
    ),
  );
</script>

{#if binding.control.visible}
  <div>
    {#if recursion.repeated && binding.control.data === undefined}
      {@render createButton(
        !binding.control.enabled || !!binding.control.readonly,
        create,
        message('recursive.create'),
      )}
      {#if binding.control.errors}
        <p role="alert" class="text-sm text-red-600 dark:text-red-400">
          {binding.control.label ? `${binding.control.label}: ` : ''}{binding.control.errors}
        </p>
      {/if}
    {:else if delegateUISchema}
      <DispatchRenderer
        schema={binding.control.schema}
        uischema={delegateUISchema}
        path={binding.control.path}
        enabled={binding.control.enabled}
        renderers={binding.control.renderers}
        cells={binding.control.cells}
      >
        {#if showAdditionalProperties && delegateUISchema.type === 'Group'}
          {@render additionalProperties(reservedPropertyNames)}
        {/if}
      </DispatchRenderer>
      {#if showAdditionalProperties && delegateUISchema.type !== 'Group'}
        {@render additionalProperties(reservedPropertyNames)}
      {/if}
    {:else if scalarControl}
      <ScalarCompositionControl {...scalarControl} />
    {:else}
      <div>
        <CombinatorProperties
          schema={binding.control.schema}
          combinatorKeyword="allOf"
          path={binding.control.path}
          rootSchema={binding.control.rootSchema}
        />
        {#each allOfRenderInfos as allOfRenderInfo, allOfIndex (`${binding.control.path}-${allOfRenderInfos.length}-${allOfIndex}`)}
          <DispatchRenderer
            schema={allOfRenderInfo.schema}
            uischema={allOfRenderInfo.uischema}
            path={binding.control.path}
            enabled={binding.control.enabled}
            renderers={binding.control.renderers}
            cells={binding.control.cells}
          />
        {/each}

        {#if showAdditionalProperties}
          {@render additionalProperties(reservedPropertyNames)}
        {/if}
      </div>
    {/if}
  </div>
{/if}
