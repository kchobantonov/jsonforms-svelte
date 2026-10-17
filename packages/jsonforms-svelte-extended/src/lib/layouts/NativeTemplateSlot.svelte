<script lang="ts">
  import { getContext } from 'svelte';
  import { DispatchRenderer } from '@chobantonov/jsonforms-svelte';
  import {
    nativeTemplateSlotContext,
    type NativeTemplateSlotContext,
    type NativeTemplateSlotProps,
  } from '../core/nativeTemplate';
  const {
    name,
    children,
    onmissing,
  }: NativeTemplateSlotProps & { onmissing?: (missing: boolean) => void } = $props();
  const context = getContext<NativeTemplateSlotContext>(nativeTemplateSlotContext);
  const element = $derived(
    Object.hasOwn(context.elements, name) ? context.elements[name] : undefined,
  );
  $effect(() => {
    onmissing?.(!element);
    if (!element) console.warn(`template.unknownSlot: ${JSON.stringify(name)}`);
  });
</script>

{#if element}
  <DispatchRenderer
    schema={context.schema}
    uischema={element}
    path={context.path}
    enabled={context.enabled}
    renderers={context.renderers}
    cells={context.cells}
  />
{:else}
  {@render children?.()}
{/if}
