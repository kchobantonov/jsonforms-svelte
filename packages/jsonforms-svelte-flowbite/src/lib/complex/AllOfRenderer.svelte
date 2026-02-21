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
      </div>
    {/if}
  </div>
{/if}
