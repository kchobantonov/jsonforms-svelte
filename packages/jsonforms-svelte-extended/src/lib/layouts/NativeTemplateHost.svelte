<script lang="ts" generics="TData">
  import { setContext, type Component } from 'svelte';
  import type { Writable } from 'svelte/store';
  import { rendererMessage } from '@chobantonov/jsonforms-svelte';
  import {
    nativeTemplateMountSlotContext,
    type NativeTemplateMountSlot,
    type NativeTemplateProps,
  } from '../core/nativeTemplate';
  import NativeTemplateBridgeSlot from './NativeTemplateBridgeSlot.svelte';
  const {
    template: Template,
    values,
    mountSlot,
  }: {
    template: Component<NativeTemplateProps<TData>>;
    values: Writable<NativeTemplateProps<TData>>;
    mountSlot: NativeTemplateMountSlot;
  } = $props();
  setContext(nativeTemplateMountSlotContext, (...args: Parameters<NativeTemplateMountSlot>) =>
    mountSlot(...args),
  );
</script>

<svelte:boundary>
  <Template {...$values} Slot={NativeTemplateBridgeSlot} />
  {#snippet failed(error)}
    <div role="alert">
      {$values.translate(
        'TemplateLayoutRenderer.template_error_title',
        rendererMessage($values.context.locale, 'TemplateLayoutRenderer.template_error_title'),
      )}
      {error instanceof Error ? error.message : String(error)}
    </div>
  {/snippet}
</svelte:boundary>
