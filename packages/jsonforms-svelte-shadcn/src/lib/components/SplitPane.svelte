<script lang="ts">
  /* eslint-disable svelte/no-unused-props -- Retain deprecated transition props for source compatibility. */
  import { setContext, untrack, type Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import * as Resizable from '@jsonforms-svelte-shadcn-ui/resizable';
  import { twMerge } from 'tailwind-merge';
  import {
    SplitPaneContextSymbol,
    type SplitPaneContextValue,
    type SplitPaneDirection,
  } from './splitPaneContext';

  interface Props {
    direction?: SplitPaneDirection;
    /** Minimum pane size in pixels; converted to Resizable's percentage units. */
    minSize?: number;
    responsive?: boolean;
    breakpoint?: number;
    /** @deprecated Resizable manages resizing without width/height transitions. */
    transition?: boolean;
    /** @deprecated Resizable manages resizing without width/height transitions. */
    transitionDuration?: number;
    keyboardStep?: number;
    initialSizes?: number[];
    onResize?: (sizes: number[]) => void;
    children?: Snippet;
    class?: string;
  }

  let {
    direction = 'horizontal',
    minSize = 100,
    responsive = true,
    breakpoint = 768,
    keyboardStep = 2,
    initialSizes,
    onResize,
    children,
    class: className,
  }: Props = $props();

  const narrow = $derived(new MediaQuery(`(max-width: ${breakpoint}px)`, false));
  const stacked = $derived(responsive && direction === 'horizontal' && narrow.current);
  let width = $state(0);
  let height = $state(0);
  let paneIds = $state<string[]>([]);
  const containerSize = $derived(direction === 'horizontal' ? width : height);
  const minimumPercent = $derived(
    containerSize > 0
      ? Math.min(100 / Math.max(paneIds.length, 1), (Math.max(0, minSize) / containerSize) * 100)
      : 0,
  );
  const normalizedSizes = $derived.by(() => {
    if (
      !initialSizes ||
      initialSizes.length !== paneIds.length ||
      !initialSizes.every((size) => Number.isFinite(size) && size >= 0)
    )
      return undefined;
    const total = initialSizes.reduce((sum, size) => sum + size, 0);
    return total > 0 ? initialSizes.map((size) => (size / total) * 100) : undefined;
  });

  // Compatibility adapter only: PaneForge owns layout, pointer and keyboard behavior.
  setContext<SplitPaneContextValue>(SplitPaneContextSymbol, {
    registerPane(id) {
      untrack(() => {
        paneIds = [...paneIds, id];
      });
      return () => {
        paneIds = paneIds.filter((paneId) => paneId !== id);
      };
    },
    getIndex: (id) => paneIds.indexOf(id),
    getDefaultSize: (id) => normalizedSizes?.[paneIds.indexOf(id)],
    getMinSize: () => minimumPercent,
    isStacked: () => stacked,
  });
</script>

<div
  bind:clientWidth={width}
  bind:clientHeight={height}
  class={twMerge('h-full w-full min-w-0', className)}
  data-split-stacked={stacked || undefined}
>
  <Resizable.PaneGroup
    {direction}
    keyboardResizeBy={keyboardStep}
    onLayoutChange={onResize}
    class="min-h-0 min-w-0"
  >
    {@render children?.()}
  </Resizable.PaneGroup>
</div>

<style>
  /* Stack the existing panes without remounting form controls or Monaco models. */
  [data-split-stacked] > :global([data-pane-group]) {
    flex-direction: column !important;
    overflow: visible !important;
    height: auto !important;
  }
  [data-split-stacked] > :global([data-pane-group] > [data-pane]) {
    flex: none !important;
    overflow: visible !important;
    width: 100%;
  }
</style>
