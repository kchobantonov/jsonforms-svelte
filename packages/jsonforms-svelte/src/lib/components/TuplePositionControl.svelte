<script lang="ts">
  import { getContext } from 'svelte';
  import { useJsonFormsControl, type ControlProps } from '../jsonFormsCompositions.svelte';
  import { useRendererMessages } from '../rendererMessages.svelte';
  import {
    TuplePositionLayoutSymbol,
    tuplePositionIndex,
    type TuplePositionLayoutContext,
  } from '../tuplePositionLayout';
  const props: ControlProps = $props();
  const layout = getContext<TuplePositionLayoutContext>(TuplePositionLayoutSymbol);
  const binding = useJsonFormsControl(props);
  const message = useRendererMessages();
  const index = $derived(tuplePositionIndex(props.uischema.scope, layout.count));
</script>

{#if binding.control.visible}
  {#if index === undefined}
    <p role="status" data-tuple-position-diagnostic>
      {message('tuple.invalidScope', { scope: props.uischema.scope ?? '' })}
    </p>
  {:else}
    {@render layout.renderPosition(index, props.uischema, binding.control.enabled)}
  {/if}
{/if}
