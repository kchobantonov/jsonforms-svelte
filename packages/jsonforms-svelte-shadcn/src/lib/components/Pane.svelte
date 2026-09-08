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
  {#if context.getIndex(id) > 0 && !context.isStacked()}
    <Resizable.Handle class="z-10 shrink-0" aria-label="Resize panes" />
  {/if}
  <Resizable.Pane
    {id}
    order={context.getIndex(id)}
    defaultSize={context.getDefaultSize(id)}
    minSize={context.getMinSize()}
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
