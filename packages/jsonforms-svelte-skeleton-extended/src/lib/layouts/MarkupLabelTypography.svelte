<script lang="ts">
  import type { Snippet } from 'svelte';

  const { block, children }: { block: boolean; children: Snippet } = $props();
</script>

{#if block}
  <div class="text-surface-950-50 text-sm font-medium">{@render children()}</div>
{:else}
  <p class="text-surface-950-50 text-sm font-medium">{@render children()}</p>
{/if}
