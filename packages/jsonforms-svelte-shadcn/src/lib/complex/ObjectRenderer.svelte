<script lang="ts">
  import {
    ObjectDetail,
    type RendererProps,
    useJsonFormsControlWithDetail,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import * as Card from '@jsonforms-svelte-shadcn-ui/card';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import type { ControlElement } from '@jsonforms/core';
  import { setIsDynamicProperty, useShadcnControl, useNested } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';

  // Props
  const props: RendererProps<ControlElement> = $props();

  const binding = useShadcnControl(useJsonFormsControlWithDetail(props));

  const nested = useNested('object');
  setIsDynamicProperty(false);
</script>

<ObjectDetail {AdditionalProperties} {binding} rendererProps={props} {nested}>
  {#snippet boundary(objectLabel, content)}
    <Card.Root class="min-w-full" data-object-boundary {...binding.shadcnProps('card')}>
      {#if objectLabel}<Card.Header><h3 class="font-semibold">{objectLabel}</h3></Card.Header>{/if}
      <Card.Content>{@render content()}</Card.Content>
    </Card.Root>
  {/snippet}
  {#snippet createButton(label, disabled, create)}
    <Button type="button" variant="outline" {disabled} onclick={create}>{label}</Button>
  {/snippet}
</ObjectDetail>
