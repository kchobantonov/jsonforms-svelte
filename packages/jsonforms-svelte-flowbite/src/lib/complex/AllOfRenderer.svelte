<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsAllOfControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    createCombinatorRenderInfos,
    findMatchingUISchema,
    type CombinatorSubSchemaRenderInfo,
    type ControlElement,
  } from '@jsonforms/core';
  import { useFlowbiteControl } from '../util';
  import CombinatorProperties from './components/CombinatorProperties.svelte';
  import isEmpty from 'lodash/isEmpty';
  import isObject from 'lodash/isObject';
  import AdditionalProperties from './components/AdditionalProperties.svelte';

  // Props
  const props: RendererProps<ControlElement> = $props();

  const binding = useFlowbiteControl(useJsonFormsAllOfControl(props));

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
    {#if delegateUISchema}
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
