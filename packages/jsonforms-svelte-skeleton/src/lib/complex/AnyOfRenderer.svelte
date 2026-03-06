<script lang="ts">
  import {
    DispatchRenderer,
    type RendererProps,
    useJsonFormsAnyOfControl,
  } from '@chobantonov/jsonforms-svelte';
  import {
    type CombinatorSubSchemaRenderInfo,
    type ControlElement,
    createCombinatorRenderInfos,
  } from '@jsonforms/core';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
  import { useSkeletonControl } from '../util';
  import CombinatorProperties from './components/CombinatorProperties.svelte';
  import isEmpty from 'lodash/isEmpty';
  import isObject from 'lodash/isObject';
  import AdditionalProperties from './components/AdditionalProperties.svelte';

  // Props
  const props: RendererProps<ControlElement> = $props();

  const binding = useSkeletonControl(useJsonFormsAnyOfControl(props));

  let selectedIndex = $state((binding.control.indexOfFittingSchema || 0).toString());

  // Computed values
  const anyOfRenderInfos = $derived.by((): CombinatorSubSchemaRenderInfo[] => {
    const result = createCombinatorRenderInfos(
      binding.control.schema.anyOf!,
      binding.control.rootSchema,
      'anyOf',
      binding.control.uischema,
      binding.control.path,
      binding.control.uischemas,
    );
    return result.filter((info) => info.uischema);
  });

  const hasAdditionalProperties = $derived(
    binding.control.schema.additionalProperties === true ||
      !isEmpty(binding.control.schema.patternProperties) ||
      isObject(binding.control.schema.additionalProperties),
  );

  const showAdditionalProperties = $derived(
    hasAdditionalProperties ||
      (binding.appliedOptions.allowAdditionalPropertiesIfMissing === true &&
        binding.control.schema.additionalProperties === undefined),
  );

  const hasAnyOfAdditionalProperties = $derived(
    selectedIndex !== null &&
      selectedIndex !== undefined &&
      (anyOfRenderInfos[parseInt(selectedIndex)]?.schema.additionalProperties === true ||
        !isEmpty(anyOfRenderInfos[parseInt(selectedIndex)]?.schema.patternProperties) ||
        isObject(anyOfRenderInfos[parseInt(selectedIndex)]?.schema.additionalProperties)),
  );

  const showAnyOfAdditionalProperties = $derived(
    hasAnyOfAdditionalProperties ||
      (selectedIndex !== null &&
        selectedIndex !== undefined &&
        binding.appliedOptions.allowAdditionalPropertiesIfMissing === true &&
        anyOfRenderInfos[parseInt(selectedIndex)]?.schema.additionalProperties === undefined),
  );

  const anyOfReservedPropertyNames = $derived(
    selectedIndex !== null && selectedIndex !== undefined
      ? Object.keys(anyOfRenderInfos[parseInt(selectedIndex)]?.schema.properties || {})
      : [],
  );

  const reservedPropertyNames = $derived(
    anyOfRenderInfos.flatMap((anyOfRenderInfo) =>
      Object.keys(anyOfRenderInfo.schema.properties || {}),
    ),
  );
</script>

{#if binding.control.visible}
  <div>
    <CombinatorProperties
      schema={binding.control.schema}
      combinatorKeyword="anyOf"
      path={binding.control.path}
      rootSchema={binding.control.rootSchema}
    />

    <Tabs
      value={selectedIndex}
      onValueChange={(e) => (selectedIndex = e.value)}
      {...binding.skeletonProps('Tabs')}
    >
      <Tabs.List>
        {#each anyOfRenderInfos as anyOfRenderInfo, anyOfIndex (`${binding.control.path}-${anyOfRenderInfos.length}-${anyOfIndex}`)}
          <Tabs.Trigger value={anyOfIndex.toString()}>
            {anyOfRenderInfo.label}
          </Tabs.Trigger>
        {/each}
        <Tabs.Indicator />
      </Tabs.List>
      {#each anyOfRenderInfos as anyOfRenderInfo, anyOfIndex (`${binding.control.path}-${anyOfRenderInfos.length}-${anyOfIndex}`)}
        <Tabs.Content value={anyOfIndex.toString()}>
          <DispatchRenderer
            schema={anyOfRenderInfo.schema}
            uischema={anyOfRenderInfo.uischema}
            path={binding.control.path}
            renderers={binding.control.renderers}
            cells={binding.control.cells}
            enabled={binding.control.enabled}
          />
          {#if showAnyOfAdditionalProperties && !showAdditionalProperties}
            <AdditionalProperties
              input={binding}
              disallowedPropertyNames={anyOfReservedPropertyNames}
            />
          {/if}
        </Tabs.Content>
      {/each}
    </Tabs>

    {#if showAdditionalProperties}
      <AdditionalProperties input={binding} disallowedPropertyNames={reservedPropertyNames} />
    {/if}
  </div>
{/if}
