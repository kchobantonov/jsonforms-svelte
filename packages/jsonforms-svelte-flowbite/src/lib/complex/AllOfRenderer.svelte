<script lang="ts">
  import {
    DispatchRenderer,
    ScalarCompositionControl,
    scalarCompositionSchema,
    scalarAllOfSchema,
    useJsonFormsAllOfControl,
    useRecursiveComposition,
    useRendererMessages,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    createCombinatorRenderInfos,
    createDefaultValue,
    findMatchingUISchema,
    type CombinatorSubSchemaRenderInfo,
    type ControlElement,
  } from '@jsonforms/core';
  import { useFlowbiteControl } from '../util';
  import CombinatorProperties from './components/CombinatorProperties.svelte';
  import isEmpty from 'lodash/isEmpty';
  import isObject from 'lodash/isObject';
  import AdditionalProperties from './components/AdditionalProperties.svelte';
  import { Button } from 'flowbite-svelte';

  // Props
  const props: RendererProps<ControlElement> = $props();

  const binding = useFlowbiteControl(useJsonFormsAllOfControl(props));
  const recursion = useRecursiveComposition(() => ({
    schema: binding.control.schema,
    path: binding.control.path,
  }));
  const message = useRendererMessages();

  const scalarSchema = $derived(
    scalarAllOfSchema(binding.control.schema, binding.control.rootSchema) ??
      scalarCompositionSchema(binding.control.schema, binding.control.rootSchema),
  );
  const scalarUISchema = $derived({
    ...binding.control.uischema,
    scope: '#',
    label: binding.control.uischema.label ?? binding.control.label,
  });

  // Computed values
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

  const hasAdditionalProperties = $derived(
    binding.control.schema.additionalProperties === true ||
      !isEmpty(binding.control.schema.patternProperties) ||
      isObject(binding.control.schema.additionalProperties) ||
      allOfRenderInfos.some(
        (allOfRenderInfo) =>
          allOfRenderInfo.schema.additionalProperties === true ||
          !isEmpty(allOfRenderInfo.schema.patternProperties) ||
          isObject(allOfRenderInfo.schema.additionalProperties),
      ),
  );

  const showAdditionalProperties = $derived(
    hasAdditionalProperties ||
      (binding.appliedOptions.allowAdditionalPropertiesIfMissing === true &&
        binding.control.schema.additionalProperties === undefined),
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
      <Button
        type="button"
        disabled={!binding.control.enabled || binding.control.readonly}
        onclick={() => {
          if (
            binding.control.data === undefined &&
            binding.control.enabled &&
            binding.control.visible &&
            !binding.control.readonly
          )
            binding.handleChange(
              binding.control.path,
              createDefaultValue(binding.control.schema, binding.control.rootSchema),
            );
        }}>{message('recursive.create')}</Button
      >
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
          <AdditionalProperties input={binding} disallowedPropertyNames={reservedPropertyNames} />
        {/if}
      </DispatchRenderer>
      {#if showAdditionalProperties && delegateUISchema.type !== 'Group'}
        <AdditionalProperties input={binding} disallowedPropertyNames={reservedPropertyNames} />
      {/if}
    {:else if scalarSchema}
      <ScalarCompositionControl
        schema={scalarSchema}
        rootSchema={binding.control.rootSchema}
        uischema={scalarUISchema}
        path={binding.control.path}
        enabled={binding.control.enabled}
        renderers={binding.control.renderers}
        cells={binding.control.cells}
      />
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
          <AdditionalProperties input={binding} disallowedPropertyNames={reservedPropertyNames} />
        {/if}
      </div>
    {/if}
  </div>
{/if}
