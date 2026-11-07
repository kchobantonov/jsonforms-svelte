<script lang="ts">
  import { setContext, type Snippet } from 'svelte';
  import { useSplitPane, type SplitPaneOptions } from '@chobantonov/jsonforms-svelte';
  import { twMerge } from 'tailwind-merge';
  import { SplitPaneContextSymbol } from './splitPaneContext';
  const {
    children,
    class: className,
    ...options
  }: SplitPaneOptions & { children?: Snippet; class?: string } = $props();
  const pane = useSplitPane(() => options);
  setContext(SplitPaneContextSymbol, pane);
</script>

<div
  style:height={pane.isStacked() ? 'auto' : undefined}
  style:overflow={pane.isStacked() ? 'visible' : undefined}
  data-split-group
  bind:this={pane.node}
  class={twMerge(
    'relative flex h-full w-full overflow-hidden select-none',
    pane.getDirection() === 'vertical' ? 'flex-col' : '',
    className,
  )}
>
  {@render children?.()}
</div>
