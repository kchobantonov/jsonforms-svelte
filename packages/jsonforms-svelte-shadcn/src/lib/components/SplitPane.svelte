<script lang="ts">
  /* eslint-disable svelte/no-unused-props -- Retain deprecated transition props for source compatibility. */
  import { splitBounds, rendererMessage } from '@chobantonov/jsonforms-svelte';
  import { setContext, untrack, tick, type Snippet } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import * as Resizable from '@jsonforms-svelte-shadcn-ui/resizable';
  import { splitPaneDirection } from './splitPaneDirection';
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
    sizes?: number[];
    minimumSizes?: number[];
    maximumSizes?: number[];
    resizable?: boolean;
    resizeLabel?: string;
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
    sizes,
    minimumSizes,
    maximumSizes,
    resizable = true,
    resizeLabel = rendererMessage(undefined, 'splitLayout.resize'),
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

  let group = $state<{ getLayout(): number[] | undefined; setLayout(sizes: number[]): void }>();
  let savedLayout: number[] | undefined;
  $effect.pre(() => {
    const isStacked = stacked;
    const target = group;
    if (!target) return;
    if (isStacked) savedLayout = untrack(() => target.getLayout());
    else if (savedLayout) {
      const restore = savedLayout;
      savedLayout = undefined;
      void tick().then(() => {
        const desired = sizes ?? restore;
        if (desired.length === paneIds.length) target.setLayout(desired);
      });
    }
  });
  const bounds = $derived(
    splitBounds(
      paneIds.length,
      stacked ? 0 : minimumPercent,
      stacked ? undefined : minimumSizes,
      stacked ? undefined : maximumSizes,
    ),
  );
  $effect(() => {
    const desired = sizes;
    const target = group;
    if (!target || !desired || desired.length !== paneIds.length) return;
    let cancelled = false;
    void tick().then(() =>
      untrack(() => {
        if (cancelled) return;
        const current = target.getLayout();
        if (!current || desired.some((value, i) => Math.abs(value - (current[i] ?? -1)) > 1e-7))
          target.setLayout(desired);
      }),
    );
    return () => {
      cancelled = true;
    };
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
    getMinSize: (id) => bounds.lower[paneIds.indexOf(id)] ?? 0,
    getMaxSize: (id) => bounds.upper[paneIds.indexOf(id)] ?? 100,
    getDirection: () => direction,
    isStacked: () => stacked,
    isResizable: () => resizable,
    getResizeLabel: () => resizeLabel,
  });
</script>

<div
  use:splitPaneDirection
  bind:clientWidth={width}
  bind:clientHeight={height}
  class={twMerge('h-full w-full min-w-0', className)}
  data-split-stacked={stacked || undefined}
>
  <Resizable.PaneGroup
    bind:this={group}
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
