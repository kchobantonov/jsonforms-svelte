<script lang="ts">
  import clsx from 'clsx';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    scrollable?: boolean;
    maxHeight?: string;
  }

  let {
    children,
    scrollable = true,
    maxHeight = undefined,
    class: className,
    style,
    ...rest
  }: Props = $props();

  const baseClass = $derived(
    clsx(
      'scroll-area',
      scrollable ? 'overflow-auto overscroll-contain' : 'overflow-visible',
      className,
    ),
  );

  const mergedStyle = $derived(
    [style, maxHeight ? `max-height: ${maxHeight};` : undefined].filter(Boolean).join(' '),
  );
</script>

<div class={baseClass} style={mergedStyle} {...rest}>
  {@render children?.()}
</div>

<style>
  .scroll-area {
    scrollbar-width: thin;
    scrollbar-color: var(--color-gray-400) var(--color-gray-100);
  }

  .scroll-area::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  .scroll-area::-webkit-scrollbar-track {
    background: var(--color-gray-100);
    border-radius: 9999px;
  }

  .scroll-area::-webkit-scrollbar-thumb {
    background: var(--color-gray-400);
    border-radius: 9999px;
    border: 2px solid var(--color-gray-100);
  }
</style>
