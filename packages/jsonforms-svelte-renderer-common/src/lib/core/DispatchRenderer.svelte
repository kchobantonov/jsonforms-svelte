<script lang="ts">
  import { selectRegistryEntry } from '@chobantonov/jsonforms-svelte';
  import { dynamicPresentation, hasDynamicTree } from '../dynamic/dynamicTree';
  import { scopeDataSegments } from './schemaScope';
  import { isControl } from '@jsonforms/core';
  import NestedDispatchRenderer from './DispatchRenderer.svelte';
  import LiteralControlScope from '../objects/LiteralControlScope.svelte';
  import type { Snippet } from 'svelte';
  import { useJsonFormsRenderer, type RendererProps } from './jsonFormsCompositions.svelte';
  import UnknownRenderer from './UnknownRenderer.svelte';
  import { useDispatchInput } from './dispatchInput.svelte';
  import { useDynamicFocusTransfer } from '../dynamic/dynamicFocus.svelte';

  export interface DispatchRendererProps extends RendererProps {
    // For forwarding snippets
    [key: string]: Snippet | unknown;
  }

  let props: DispatchRendererProps = $props();
  const { schema, uischema, path, enabled, renderers, cells, rootSchema, config, ...rest } =
    $derived(props);

  const dispatch = useDispatchInput(props, () => rest, false);
  const binding = useJsonFormsRenderer(dispatch.effectiveProps);
  const { reportDiagnostic } = dispatch;

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
  const targetScope = $derived('scope' in dispatch.element ? dispatch.element.scope : undefined);
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

{#snippet renderControl()}
  {#if usesLiteralControl}
    <LiteralControlScope
      {...binding.rendererProps}
      {...dispatch.snippets}
      dispatchRenderer={NestedDispatchRenderer}
    />
  {:else}
    <DeterminedRenderer {...binding.rendererProps} {...dispatch.snippets}></DeterminedRenderer>
  {/if}
{/snippet}

{#if hasDynamicTree(props.uischema) || dynamicPresentation(props.uischema)}
  <div
    style="display: contents"
    bind:this={focusBoundary}
    onfocusin={focusTransfer.onfocusin}
    onfocusout={focusTransfer.onfocusout}
  >
    {#key targetScope}
      {@render renderControl()}
    {/key}
  </div>
{:else}
  {@render renderControl()}
{/if}
