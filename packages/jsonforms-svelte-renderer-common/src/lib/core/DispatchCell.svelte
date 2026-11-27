<script lang="ts">
  import { selectRegistryEntry } from '@chobantonov/jsonforms-svelte';
  import { dynamicPresentation, hasDynamicTree } from '../dynamic/dynamicTree';
  import type { Snippet } from 'svelte';
  import { useJsonFormsDispatchCell, type ControlProps } from './jsonFormsCompositions.svelte.js';
  import UnknownRenderer from './UnknownRenderer.svelte';
  import { useDispatchInput } from './dispatchInput.svelte';
  import { useDynamicFocusTransfer } from '../dynamic/dynamicFocus.svelte';

  export interface DispatchCellProps extends ControlProps {
    // For forwarding snippets
    [key: string]: Snippet | unknown;
  }

  let props: DispatchCellProps = $props();
  const { schema, uischema, path, enabled, renderers, cells, config, ...rest } = $derived(props);

  const dispatch = useDispatchInput(props, () => rest, true);
  const binding = useJsonFormsDispatchCell(dispatch.effectiveProps);
  const { reportDiagnostic } = dispatch;

  // Determine which cell to render
  const DeterminedCell = $derived(
    selectRegistryEntry(binding.cell.cells, binding.cell)?.cell ?? UnknownRenderer,
  );
  let focusBoundary: HTMLDivElement | undefined = $state();
  const focusTransfer = useDynamicFocusTransfer(
    () => DeterminedCell,
    () => focusBoundary,
  );

  let warnedMissingCell: string | undefined;
  $effect(() => {
    if (DeterminedCell !== UnknownRenderer) {
      warnedMissingCell = undefined;
      return;
    }
    const element = binding.cell.uischema;
    const key = JSON.stringify([path, element.type, element.scope]);
    if (warnedMissingCell === key) return;
    warnedMissingCell = key;
    reportDiagnostic('cell.unsupported', {
      severity: 'warning',
      message: 'No applicable cell is registered for this UI-schema element.',
      path,
      type: element.type,
      scope: element.scope,
    });
  });
</script>

{#if hasDynamicTree(props.uischema) || dynamicPresentation(props.uischema)}
  <div
    style="display: contents"
    bind:this={focusBoundary}
    onfocusin={focusTransfer.onfocusin}
    onfocusout={focusTransfer.onfocusout}
  >
    <DeterminedCell {...binding.cell} {...dispatch.snippets}></DeterminedCell>
  </div>
{:else}
  <DeterminedCell {...binding.cell} {...dispatch.snippets}></DeterminedCell>
{/if}
