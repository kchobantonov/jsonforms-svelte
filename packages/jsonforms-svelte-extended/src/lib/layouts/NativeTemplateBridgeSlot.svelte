<script lang="ts">
  import { getContext } from 'svelte';
  import {
    nativeTemplateMountSlotContext,
    type NativeTemplateMountSlot,
    type NativeTemplateSlotProps,
  } from '../core/nativeTemplate';
  const { name, children }: NativeTemplateSlotProps = $props();
  const mountSlot = getContext<NativeTemplateMountSlot>(nativeTemplateMountSlotContext);
  let target = $state<HTMLElement | null>(null);
  let missing = $state(false);
  $effect(() => {
    if (!target) return;
    let active = true;
    const destroy = mountSlot(target, name, (value) => {
      if (active) missing = value;
    });
    return () => {
      active = false;
      void destroy();
    };
  });
</script>

<div bind:this={target} style="display: contents"></div>
{#if missing}{@render children?.()}{/if}
