<script lang="ts">
  import clsx from 'clsx';
  import { setContext, type Snippet } from 'svelte';
  import { useSplitPane, type SplitPaneOptions } from '@chobantonov/jsonforms-svelte';
  import { splitpane, getTheme } from 'flowbite-svelte';
  import { splitPaneContext } from './splitPaneContext';
  import { flowbiteSplitHandles } from '../util/flowbiteSplitHandles';
  const props: SplitPaneOptions & { children?: Snippet; class?: string } = $props();
  const pane = useSplitPane(() => props);
  const theme = $derived(getTheme('splitpane'));
  setContext(splitPaneContext, pane);
</script>

<div
  class="h-full min-h-0 min-w-0"
  use:flowbiteSplitHandles={{
    resizable: pane.isResizable(),
    label: pane.getResizeLabel(),
    nativeRtl: true,
    minimumSizes: pane.getHandleMinimums(),
    maximumSizes: pane.getHandleMaximums(),
  }}
>
  <div
    bind:this={pane.node}
    style:height={pane.isStacked() ? 'auto' : undefined}
    style:overflow={pane.isStacked() ? 'visible' : undefined}
    data-split-group
    class={splitpane({ direction: pane.getDirection(), class: clsx(theme, props.class) })}
  >
    {@render props.children?.()}
  </div>
</div>
