<script lang="ts">
  import { getContext } from 'svelte';
  import { useJsonFormsControl, type ControlProps } from '../jsonFormsCompositions.svelte';
  import { useRendererMessages } from '../rendererMessages.svelte';
  import { useUIDiagnosticReporter } from '../authorDiagnostic.svelte';
  import {
    TuplePositionLayoutSymbol,
    tuplePositionIndex,
    type TuplePositionLayoutContext,
  } from '../tuplePositionLayout';
  const props: ControlProps = $props();
  const layout = getContext<TuplePositionLayoutContext>(TuplePositionLayoutSymbol);
  const binding = useJsonFormsControl(props);
  const message = useRendererMessages();
  const reportDiagnostic = useUIDiagnosticReporter();
  const index = $derived(tuplePositionIndex(props.uischema.scope, layout.count));
  let reportedKey: string | undefined;
  $effect(() => {
    if (!binding.control.visible || index !== undefined) {
      reportedKey = undefined;
      return;
    }
    const path = binding.control.path;
    const scope = props.uischema.scope ?? '';
    const key = JSON.stringify([path, scope]);
    if (reportedKey === key) return;
    reportedKey = key;
    reportDiagnostic('tuple.invalidScope', {
      severity: 'warning',
      message: 'The tuple layout names an undeclared or invalid position.',
      path,
      scope,
    });
  });
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
