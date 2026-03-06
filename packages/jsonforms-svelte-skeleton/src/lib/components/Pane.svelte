<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getContext } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import Divider from './SplitPaneDivider.svelte';
  import {
    SplitPaneContextSymbol,
    type SplitPaneContextValue,
  } from './splitPaneContext';

  interface Props {
    children?: Snippet;
    class?: string;
    style?: string;
  }

  let { children, class: className, style = '' }: Props = $props();

  const context = getContext<SplitPaneContextValue | undefined>(SplitPaneContextSymbol);
  const paneIndex = context ? context.registerPane() : 0;

  const paneStyle = $derived.by(() => {
    const styles = [style];

    if (context) {
      styles.push(context.getPaneStyle(paneIndex));
    }

    return styles.filter(Boolean).join('; ');
  });

  const showDivider = $derived(context?.shouldRenderDivider(paneIndex) ?? false);
  const direction = $derived(context?.getDirection() ?? 'horizontal');
  const isDragging = $derived(context?.getIsDragging() ?? false);
</script>

<div
  class={twMerge('relative flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden', className)}
  style={paneStyle}
>
  {@render children?.()}
</div>

{#if showDivider && context}
  <Divider
    {direction}
    index={paneIndex}
    {isDragging}
    currentSize={context.getPaneSize(paneIndex)}
    onPointerDown={context.onPointerDown}
    onKeyDown={context.onKeyDown}
  />
{/if}
