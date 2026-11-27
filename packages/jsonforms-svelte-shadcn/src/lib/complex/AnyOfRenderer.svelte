<script lang="ts">
  import {
    AnyOfContent,
    AnyOfTabs,
    type RendererProps,
    useJsonFormsAnyOfControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { type ControlElement } from '@jsonforms/core';
  import * as Tabs from '@jsonforms-svelte-shadcn-ui/tabs';
  import { useShadcnControl } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';

  // Props
  const props: RendererProps<ControlElement> = $props();

  const binding = useShadcnControl(useJsonFormsAnyOfControl(props));
</script>

<AnyOfContent {props} {binding}>
  {#snippet tabs(selection, branch)}
    <Tabs.Root
      value={selection.selectedIndex.toString()}
      onValueChange={(value) => selection.select(Number(value))}
      {...binding.shadcnProps('Tabs')}
    >
      <AnyOfTabs
        {selection}
        {branch}
        path={binding.control.path}
        List={Tabs.List}
        Trigger={Tabs.Trigger}
        Content={Tabs.Content}
      />
    </Tabs.Root>
  {/snippet}
  {#snippet additionalProperties(names)}
    <AdditionalProperties input={binding} disallowedPropertyNames={names} />
  {/snippet}
</AnyOfContent>
