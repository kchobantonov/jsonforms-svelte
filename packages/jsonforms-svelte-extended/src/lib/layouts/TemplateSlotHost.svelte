<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  interface Props {
    mountTo: HTMLElement;
    registerRoot?: (root: HTMLElement) => () => void;
    children?: import('svelte').Snippet;
  }

  let { mountTo, children, registerRoot }: Props = $props();
  let root: HTMLDivElement | null = null;

  $effect(() => {
    if (root && mountTo && root.parentNode !== mountTo) {
      mountTo.appendChild(root);
    }
  });

  onMount(() => (root ? registerRoot?.(root) : undefined));

  onDestroy(() => {
    if (root?.parentNode) {
      root.parentNode.removeChild(root);
    }
  });
</script>

<div bind:this={root} style="display: contents">
  {@render children?.()}
</div>
