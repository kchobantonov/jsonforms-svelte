<script lang="ts">
  import {
    AnyOfContent,
    AnyOfTabs,
    type RendererProps,
    useJsonFormsAnyOfControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { type ControlElement } from '@jsonforms/core';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
  import { useSkeletonControl } from '../util';
  import { observeInheritedDirection, type TextDirection } from '../util/inheritedDirection';
  import AdditionalProperties from './components/AdditionalProperties.svelte';

  // Props
  const props: RendererProps<ControlElement> = $props();

  const binding = useSkeletonControl(useJsonFormsAnyOfControl(props));
  let inheritedDirection = $state<TextDirection>('ltr');
</script>

<AnyOfContent
  {props}
  {binding}
  attach={(node) =>
    observeInheritedDirection(node, (direction) => (inheritedDirection = direction)).destroy}
>
  {#snippet tabs(selection, branch)}
    <Tabs
      value={selection.selectedIndex.toString()}
      onValueChange={(e) => selection.select(Number(e.value))}
      {...binding.skeletonProps('Tabs')}
      dir={inheritedDirection}
    >
      <AnyOfTabs
        {selection}
        {branch}
        path={binding.control.path}
        List={Tabs.List}
        Trigger={Tabs.Trigger}
        Content={Tabs.Content}>{#snippet indicator()}<Tabs.Indicator />{/snippet}</AnyOfTabs
      >
    </Tabs>
  {/snippet}
  {#snippet additionalProperties(names)}
    <AdditionalProperties input={binding} disallowedPropertyNames={names} />
  {/snippet}
</AnyOfContent>
