<script lang="ts">
  import {
    ObjectDetail,
    type RendererProps,
    useJsonFormsControlWithDetail,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { ControlElement } from '@jsonforms/core';
  import { setIsDynamicProperty, useSkeletonControl, useNested } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';

  // Props
  const props: RendererProps<ControlElement> = $props();

  const binding = useSkeletonControl(useJsonFormsControlWithDetail(props));

  const nested = useNested('object');
  setIsDynamicProperty(false);
</script>

<ObjectDetail {AdditionalProperties} {binding} rendererProps={props} {nested}>
  {#snippet boundary(objectLabel, content)}
    <section
      class="card preset-outlined-surface-200-800 min-w-full p-4"
      data-object-boundary
      {...binding.skeletonProps('card')}
    >
      {#if objectLabel}<h3 class="mb-4 font-semibold">{objectLabel}</h3>{/if}
      {@render content()}
    </section>
  {/snippet}
  {#snippet createButton(label, disabled, create)}
    <button type="button" class="btn preset-outlined" {disabled} onclick={create}>{label}</button>
  {/snippet}
</ObjectDetail>
