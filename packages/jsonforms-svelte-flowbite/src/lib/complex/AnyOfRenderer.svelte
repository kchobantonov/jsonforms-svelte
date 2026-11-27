<script lang="ts">
  import {
    AnyOfContent,
    type RendererProps,
    useJsonFormsAnyOfControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { type ControlElement } from '@jsonforms/core';
  import { TabItem, Tabs } from 'flowbite-svelte';
  import { useFlowbiteControl } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';

  // Props
  const props: RendererProps<ControlElement> = $props();

  const binding = useFlowbiteControl(useJsonFormsAnyOfControl(props));
</script>

<AnyOfContent {props} {binding}>
  {#snippet tabs(selection, branch)}
    {@const { anyOfRenderInfos, selectedIndex } = selection}
    <Tabs>
      {#each anyOfRenderInfos as anyOfRenderInfo, anyOfIndex (`${binding.control.path}-${anyOfRenderInfos.length}-${anyOfIndex}`)}
        <TabItem
          open={selectedIndex === anyOfIndex}
          title={anyOfRenderInfo.label}
          onclick={() => selection.select(anyOfIndex)}
        >
          {@render branch(anyOfRenderInfo, selectedIndex === anyOfIndex)}
        </TabItem>
      {/each}
    </Tabs>
  {/snippet}
  {#snippet additionalProperties(names)}
    <AdditionalProperties input={binding} disallowedPropertyNames={names} />
  {/snippet}
</AnyOfContent>
