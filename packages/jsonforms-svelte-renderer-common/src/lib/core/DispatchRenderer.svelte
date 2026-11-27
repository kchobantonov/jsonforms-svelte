<script lang="ts">
  import { selectRegistryEntry } from '@chobantonov/jsonforms-svelte';
  import { dynamicPresentation, hasDynamicTree } from '../dynamic/dynamicTree';
  import { scopeDataSegments } from './schemaScope';
  import { isControl } from '@jsonforms/core';
  import NestedDispatchRenderer from './DispatchRenderer.svelte';
  import LiteralControlScope from '../objects/LiteralControlScope.svelte';
  import { untrack, type Snippet } from 'svelte';
  import { useJsonFormsRenderer, type RendererProps } from './jsonFormsCompositions.svelte';
  import UnknownRenderer from './UnknownRenderer.svelte';
  import { useUIDiagnosticReporter } from '../validation/authorDiagnostic.svelte';
  import { dataPathSegments } from './dataPath';
  import { useDynamicTreeResolver } from '../dynamic/dynamicTree.svelte';
  import { useDynamicFocusTransfer } from '../dynamic/dynamicFocus.svelte';

  export interface DispatchRendererProps extends RendererProps {
    // For forwarding snippets
    [key: string]: Snippet | unknown;
  }

  let props: DispatchRendererProps = $props();
  const { schema, uischema, path, enabled, renderers, cells, rootSchema, config, ...rest } =
    $derived(props);

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
      false,
    );
    return dynamicPresentation(element) ?? { element, failures: [] as readonly string[] };
  });
  // Resolve structural children before testers or visual renderers inspect them.
  const effectiveProps = new Proxy(props, {
    get(target, key) {
      return key === 'uischema' ? resolution.element : Reflect.get(target, key);
    },
  });
  const binding = useJsonFormsRenderer(effectiveProps);
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
  const usesLiteralControl = $derived(
    (binding.rendererProps.uischema.type === 'Control' ||
      binding.rendererProps.uischema.type === 'ListWithDetail') &&
      isControl(binding.rendererProps.uischema) &&
      scopeDataSegments(binding.rendererProps.uischema.scope).some(
        (key) =>
          key === '' || key === '#' || key.includes('~') || key.includes('.') || key.includes('\0'),
      ),
  );

  // Determine which renderer to use
  const DeterminedRenderer = $derived(
    selectRegistryEntry(binding.renderer.renderers, binding.renderer)?.renderer ?? UnknownRenderer,
  );
  let focusBoundary: HTMLDivElement | undefined = $state();
  const targetScope = $derived(
    'scope' in resolution.element ? resolution.element.scope : undefined,
  );
  const focusTransfer = useDynamicFocusTransfer(
    () => (usesLiteralControl ? LiteralControlScope : DeterminedRenderer),
    () => focusBoundary,
    () => targetScope,
  );

  let warnedMissingRenderer: string | undefined;
  $effect(() => {
    if (usesLiteralControl || DeterminedRenderer !== UnknownRenderer) {
      warnedMissingRenderer = undefined;
      return;
    }
    const element = binding.rendererProps.uischema;
    const key = JSON.stringify([path, element.type, 'scope' in element ? element.scope : '']);
    if (warnedMissingRenderer === key) return;
    warnedMissingRenderer = key;
    reportDiagnostic('renderer.unsupported', {
      severity: 'warning',
      message: 'No applicable renderer is registered for this UI-schema element.',
      path,
      type: element.type,
      scope: 'scope' in element ? element.scope : undefined,
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
    {#key targetScope}
      {#if usesLiteralControl}
        <LiteralControlScope
          {...binding.rendererProps}
          {...snippets}
          dispatchRenderer={NestedDispatchRenderer}
        />
      {:else}
        <DeterminedRenderer {...binding.rendererProps} {...snippets}></DeterminedRenderer>
      {/if}
    {/key}
  </div>
{:else if usesLiteralControl}
  <LiteralControlScope
    {...binding.rendererProps}
    {...snippets}
    dispatchRenderer={NestedDispatchRenderer}
  />
{:else}
  <DeterminedRenderer {...binding.rendererProps} {...snippets}></DeterminedRenderer>
{/if}
