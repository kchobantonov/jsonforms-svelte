<script lang="ts">
  import { setContext, type Snippet } from 'svelte';
  import { useSplitPane, type SplitPaneOptions } from '@chobantonov/jsonforms-svelte';
  import { twMerge } from 'tailwind-merge';
  import { SplitPaneContextSymbol } from './splitPaneContext';
  const props: SplitPaneOptions & { children?: Snippet; class?: string } = $props();
  const pane = useSplitPane(() => props);
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
    props.class,
  )}
>
  {@render props.children?.()}
</div>
