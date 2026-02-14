<script lang="ts">
  import {
    type CombinatorSubSchemaRenderInfo,
    type ControlElement,
    createCombinatorRenderInfos,
  } from '@jsonforms/core';
  import {
    DispatchRenderer,
    type RendererProps,
    useJsonFormsAnyOfControl,
  } from '@chobantonov/jsonforms-svelte';
  import { Tabs, TabItem } from 'flowbite-svelte';
  import CombinatorProperties from './components/CombinatorProperties.svelte';
  import { useFlowbiteControl } from '../util';

  // Props
  const props: RendererProps<ControlElement> = $props();

  const input = useJsonFormsAnyOfControl(props);
  const flowbiteControl = useFlowbiteControl(input);

  let selectedIndex = $state(flowbiteControl.control.indexOfFittingSchema || 0);

  // Computed values
  const anyOfRenderInfos = $derived.by((): CombinatorSubSchemaRenderInfo[] => {
    const result = createCombinatorRenderInfos(
      flowbiteControl.control.schema.anyOf!,
      flowbiteControl.control.rootSchema,
      'anyOf',
      flowbiteControl.control.uischema,
      flowbiteControl.control.path,
      flowbiteControl.control.uischemas,
    );
    return result.filter((info) => info.uischema);
  });
</script>

{#if flowbiteControl.control.visible}
  <div>
    <CombinatorProperties
      schema={flowbiteControl.control.schema}
      combinatorKeyword="anyOf"
      path={flowbiteControl.control.path}
      rootSchema={flowbiteControl.control.rootSchema}
    />

    <Tabs>
      {#each anyOfRenderInfos as anyOfRenderInfo, anyOfIndex (`${flowbiteControl.control.path}-${anyOfRenderInfos.length}-${anyOfIndex}`)}
        <TabItem open={selectedIndex === anyOfIndex} title={anyOfRenderInfo.label}>
          <DispatchRenderer
            schema={anyOfRenderInfo.schema}
            uischema={anyOfRenderInfo.uischema}
            path={flowbiteControl.control.path}
            renderers={flowbiteControl.control.renderers}
            cells={flowbiteControl.control.cells}
            enabled={flowbiteControl.control.enabled}
          />
        </TabItem>
      {/each}
    </Tabs>
  </div>
{/if}
