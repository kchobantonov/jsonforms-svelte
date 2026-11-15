<script lang="ts">
  import { dynamicPresentation, hasDynamicTree } from '../dynamicTree';
  import type { JsonFormsCellRendererRegistryEntry } from '@jsonforms/core';
  import { untrack, type Snippet } from 'svelte';
  import { useJsonFormsDispatchCell, type ControlProps } from '../jsonFormsCompositions.svelte.js';
  import UnknownRenderer from './UnknownRenderer.svelte';
  import { useUIDiagnosticReporter } from '../authorDiagnostic.svelte';
  import { useDynamicTreeResolver } from '../dynamicTree.svelte';
  import { dataPathSegments } from '../dataPath';
  import { useDynamicFocusTransfer } from '../dynamicFocus.svelte';

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

  const resolveTree = useDynamicTreeResolver();
  const resolution = $derived.by(() => {
    const element = resolveTree(
      props.uischema,
      props.path,
      props.pathSegments ?? dataPathSegments(props.path),
      true,
    );
    return dynamicPresentation(element) ?? { element, failures: [] as readonly string[] };
  });
  // Resolve structural children before testers or visual renderers inspect them.
  const effectiveProps = new Proxy(props, {
    get(target, key) {
      return key === 'uischema'
        ? (resolution.element as ControlProps['uischema'])
        : Reflect.get(target, key);
    },
  });
  const binding = useJsonFormsDispatchCell(effectiveProps);
  const reportDiagnostic = useUIDiagnosticReporter();
  let reportedFailures = '';
  $effect(() => {
    const failures = resolution.failures;
    const signature = JSON.stringify([props.path, failures]);
    if (signature === reportedFailures) return;
    reportedFailures = signature;
    for (const failure of failures)
      reportDiagnostic('dynamic.invalid', {
        severity: 'warning',
        message: failure,
        path: props.path,
      });
  });

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
    <DeterminedCell {...binding.cell} {...snippets}></DeterminedCell>
  </div>
{:else}
  <DeterminedCell {...binding.cell} {...snippets}></DeterminedCell>
{/if}
