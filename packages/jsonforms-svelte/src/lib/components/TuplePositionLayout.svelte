<script lang="ts">
  import type {
    JsonFormsRendererRegistryEntry,
    JsonSchema,
    UISchemaElement,
  } from '@jsonforms/core';
  import { setContext } from 'svelte';
  import { type RendererProps } from '../jsonFormsCompositions.svelte';
  import {
    TuplePositionLayoutSymbol,
    type TuplePositionLayoutContext,
  } from '../tuplePositionLayout';
  import DispatchRenderer from './DispatchRenderer.svelte';
  import TuplePositionControl from './TuplePositionControl.svelte';

  let {
    count,
    renderPosition,
    ...props
  }: RendererProps<UISchemaElement> & TuplePositionLayoutContext & { rootSchema?: JsonSchema } =
    $props();
  setContext<TuplePositionLayoutContext>(TuplePositionLayoutSymbol, {
    get count() {
      return count;
    },
    get renderPosition() {
      return renderPosition;
    },
  });
  const positionRenderer: JsonFormsRendererRegistryEntry = {
    tester: (ui) => (ui.type === 'Control' ? Number.MAX_SAFE_INTEGER : -1),
    renderer: TuplePositionControl,
  };
  const renderers = $derived([positionRenderer, ...(props.renderers ?? [])]);
</script>

<DispatchRenderer {...props} {renderers} />
