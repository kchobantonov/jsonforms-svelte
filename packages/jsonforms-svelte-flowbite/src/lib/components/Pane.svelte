<script lang="ts">
  import { getContext, onDestroy, type Snippet } from 'svelte';
  import { Pane, Divider } from 'flowbite-svelte';
  import { splitPaneContext, type SplitPaneContext } from './splitPaneContext';
  const props: { children?: Snippet; class?: string; style?: string } = $props();
  const context = getContext<SplitPaneContext | undefined>(splitPaneContext);
  const id = $props.id();
  if (context) onDestroy(context.registerPane(id));
  const index = $derived(context?.getIndex(id) ?? 0);
</script>

<Pane
  class={props.class}
  style={[props.style, context?.getPaneStyle(index)].filter(Boolean).join(';')}
>
  {@render props.children?.()}
</Pane>
{#if context?.shouldRenderDivider(index)}
  <Divider
    direction={context.getDirection()}
    {index}
    currentSize={context.getPaneSize(index)}
    isDragging={context.getIsDragging()}
    onMouseDown={context.onMouseDown}
    onTouchStart={context.onTouchStart}
    onKeyDown={context.onKeyDown}
    class="touch-none"
  />
{/if}
