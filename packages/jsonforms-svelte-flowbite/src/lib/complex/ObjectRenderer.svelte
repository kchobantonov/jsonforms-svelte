<script lang="ts">
  import {
    ObjectDetail,
    type RendererProps,
    useJsonFormsControlWithDetail,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Button, Card } from 'flowbite-svelte';
  import type { ControlElement } from '@jsonforms/core';
  import { setIsDynamicProperty, useFlowbiteControl, useNested } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';

  // Props
  const props: RendererProps<ControlElement> = $props();

  const binding = useFlowbiteControl(useJsonFormsControlWithDetail(props));

  const nested = useNested('object');
  setIsDynamicProperty(false);
</script>

<ObjectDetail {AdditionalProperties} {binding} rendererProps={props} {nested}>
  {#snippet boundary(objectLabel, content)}
    <Card class="min-w-full gap-3 p-4" data-object-boundary {...binding.flowbiteProps('Card')}>
      {#if objectLabel}<h3 class="text-lg font-bold">{objectLabel}</h3>{/if}
      {@render content()}
    </Card>
  {/snippet}
  {#snippet createButton(label, disabled, create)}
    <Button type="button" {disabled} onclick={create}>{label}</Button>
  {/snippet}
</ObjectDetail>
