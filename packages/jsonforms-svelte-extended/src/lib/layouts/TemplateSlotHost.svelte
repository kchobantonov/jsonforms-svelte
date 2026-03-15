<script lang="ts">
  import { onDestroy } from "svelte";

  interface Props {
    mountTo: HTMLElement;
    children?: import("svelte").Snippet;
  }

  let { mountTo, children }: Props = $props();
  let root: HTMLDivElement | null = null;

  $effect(() => {
    if (root && mountTo && root.parentNode !== mountTo) {
      mountTo.appendChild(root);
    }
  });

  onDestroy(() => {
    if (root?.parentNode) {
      root.parentNode.removeChild(root);
    }
  });
</script>

<div bind:this={root} style="display: contents">
  {@render children?.()}
</div>
