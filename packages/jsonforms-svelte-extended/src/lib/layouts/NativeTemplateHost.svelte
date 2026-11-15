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
    onerror,
  }: {
    template: Component<NativeTemplateProps<TData>>;
    values: Writable<NativeTemplateProps<TData>>;
    mountSlot: NativeTemplateMountSlot;
    onerror?: () => void;
  } = $props();
  setContext(nativeTemplateMountSlotContext, (...args: Parameters<NativeTemplateMountSlot>) =>
    mountSlot(...args),
  );
</script>

<svelte:boundary {onerror}>
  <Template {...$values} Slot={NativeTemplateBridgeSlot} />
  {#snippet failed()}
    <div role="alert">
      {$values.translate(
        'TemplateLayoutRenderer.template_error_title',
        rendererMessage($values.context.locale, 'TemplateLayoutRenderer.template_error_title'),
      )}
    </div>
  {/snippet}
</svelte:boundary>
