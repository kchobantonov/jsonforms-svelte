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
  import { TabItem, Tabs } from 'flowbite-svelte';
  import { useFlowbiteControl } from '../util';
  import CombinatorProperties from './components/CombinatorProperties.svelte';

  // Props
  const props: RendererProps<ControlElement> = $props();

  const binding = useFlowbiteControl(useJsonFormsAnyOfControl(props));

  let selectedIndex = $state(binding.control.indexOfFittingSchema || 0);

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
</script>

{#if binding.control.visible}
  <div>
    <CombinatorProperties
      schema={binding.control.schema}
      combinatorKeyword="anyOf"
      path={binding.control.path}
      rootSchema={binding.control.rootSchema}
    />

    <Tabs>
      {#each anyOfRenderInfos as anyOfRenderInfo, anyOfIndex (`${binding.control.path}-${anyOfRenderInfos.length}-${anyOfIndex}`)}
        <TabItem open={selectedIndex === anyOfIndex} title={anyOfRenderInfo.label}>
          <DispatchRenderer
            schema={anyOfRenderInfo.schema}
            uischema={anyOfRenderInfo.uischema}
            path={binding.control.path}
            renderers={binding.control.renderers}
            cells={binding.control.cells}
            enabled={binding.control.enabled}
          />
        </TabItem>
      {/each}
    </Tabs>
  </div>
{/if}
