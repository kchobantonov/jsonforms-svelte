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

  const flowbiteControl = useFlowbiteControl(useJsonFormsAllOfControl(props));

  // Computed values
  const delegateUISchema = $derived(
    findMatchingUISchema(flowbiteControl.control.uischemas)(
      flowbiteControl.control.schema,
      flowbiteControl.control.uischema.scope,
      flowbiteControl.control.path,
    ),
  );

  const allOfRenderInfos = $derived.by((): CombinatorSubSchemaRenderInfo[] => {
    const result = createCombinatorRenderInfos(
      flowbiteControl.control.schema.allOf!,
      flowbiteControl.control.rootSchema,
      'allOf',
      flowbiteControl.control.uischema,
      flowbiteControl.control.path,
      flowbiteControl.control.uischemas,
    );

    return result.filter((info) => info.uischema);
  });
</script>

{#if flowbiteControl.control.visible}
  <div>
    {#if delegateUISchema}
      <DispatchRenderer
        schema={flowbiteControl.control.schema}
        uischema={delegateUISchema}
        path={flowbiteControl.control.path}
        enabled={flowbiteControl.control.enabled}
        renderers={flowbiteControl.control.renderers}
        cells={flowbiteControl.control.cells}
      />
    {:else}
      <div>
        <CombinatorProperties
          schema={flowbiteControl.control.schema}
          combinatorKeyword="allOf"
          path={flowbiteControl.control.path}
          rootSchema={flowbiteControl.control.rootSchema}
        />
        {#each allOfRenderInfos as allOfRenderInfo, allOfIndex (`${flowbiteControl.control.path}-${allOfRenderInfos.length}-${allOfIndex}`)}
          <DispatchRenderer
            schema={allOfRenderInfo.schema}
            uischema={allOfRenderInfo.uischema}
            path={flowbiteControl.control.path}
            enabled={flowbiteControl.control.enabled}
            renderers={flowbiteControl.control.renderers}
            cells={flowbiteControl.control.cells}
          />
        {/each}
      </div>
    {/if}
  </div>
{/if}
