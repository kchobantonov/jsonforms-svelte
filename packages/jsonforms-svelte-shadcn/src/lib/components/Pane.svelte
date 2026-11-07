<script lang="ts">
  import { getContext, onDestroy, type Snippet } from 'svelte';
  import * as Resizable from '@jsonforms-svelte-shadcn-ui/resizable';
  import { twMerge } from 'tailwind-merge';
  import { SplitPaneContextSymbol, type SplitPaneContextValue } from './splitPaneContext';

  interface Props {
    children?: Snippet;
    class?: string;
    style?: string;
  }

  let { children, class: className, style }: Props = $props();
  const id = $props.id();
  const context = getContext<SplitPaneContextValue | undefined>(SplitPaneContextSymbol);
  if (context) onDestroy(context.registerPane(id));
</script>

{#if context}
  {#if context.getIndex(id) > 0}
    <Resizable.Handle
      style={context.isStacked() ? 'display: none' : undefined}
      class={context.isResizable()
        ? 'z-10 shrink-0'
        : 'pointer-events-none z-10 shrink-0 cursor-default!'}
      aria-label={context.getResizeLabel()}
      aria-disabled={!context.isResizable() || undefined}
      aria-orientation={context.getDirection() === 'horizontal' ? 'vertical' : 'horizontal'}
      disabled={!context.isResizable()}
      tabindex={context.isResizable() ? 0 : -1}
    />
  {/if}
  <Resizable.Pane
    {id}
    order={context.getIndex(id)}
    defaultSize={context.getDefaultSize(id)}
    minSize={context.getMinSize(id)}
    maxSize={context.getMaxSize(id)}
    class={twMerge('relative flex min-h-0 min-w-0 flex-col', className)}
    {style}
  >
    {@render children?.()}
  </Resizable.Pane>
{:else}
  <div class={twMerge('relative flex min-h-0 min-w-0 flex-col', className)} {style}>
    {@render children?.()}
  </div>
{/if}
