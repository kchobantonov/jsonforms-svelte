<script lang="ts">
  import type { JsonFormsCellRendererRegistryEntry } from '@jsonforms/core';
  import { untrack, type Snippet } from 'svelte';
  import { useJsonFormsDispatchCell, type ControlProps } from '../jsonFormsCompositions.svelte.js';
  import UnknownRenderer from './UnknownRenderer.svelte';
  import { useUIDiagnosticReporter } from '../authorDiagnostic.svelte';

  export interface DispatchCellProps extends ControlProps {
    // For forwarding snippets
    [key: string]: Snippet | unknown;
  }

  let props: DispatchCellProps = $props();
  const { schema, uischema, path, enabled, renderers, cells, config, ...rest } = $derived(props);

  let snippets = $state(
    untrack(() =>
      Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v === 'function')),
    ),
  );
  let initializedSnippets = false;

  $effect(() => {
    void rest; // track dependency

    if (!initializedSnippets) {
      initializedSnippets = true;
      return;
    }

    const next = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => typeof v === 'function'),
    );

    // Only update if keys or references changed
    const changed =
      Object.keys(next).length !== Object.keys(snippets).length ||
      Object.keys(next).some((k) => next[k] !== snippets[k]);

    if (changed) snippets = next;
  });

  const binding = useJsonFormsDispatchCell(props);
  const reportDiagnostic = useUIDiagnosticReporter();

  // Determine which cell to render
  const DeterminedCell = $derived.by(() => {
    const testerContext = {
      rootSchema: binding.cell.rootSchema,
      config: binding.cell.config,
    };

    let bestScore = -1;
    let bestRenderer: JsonFormsCellRendererRegistryEntry | undefined;

    for (const renderer of binding.cell.cells) {
      const score = renderer.tester(binding.cell.uischema, binding.cell.schema, testerContext);
      if (score > bestScore) {
        bestScore = score;
        bestRenderer = renderer;
      }
    }

    return bestScore === -1 || bestRenderer === undefined ? UnknownRenderer : bestRenderer.cell;
  });

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

<DeterminedCell {...binding.cell} {...snippets}></DeterminedCell>
