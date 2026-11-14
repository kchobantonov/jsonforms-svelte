<script lang="ts">
  import type { Snippet } from 'svelte';
  import { P } from 'flowbite-svelte';

  const { block, children }: { block: boolean; children: Snippet } = $props();
</script>

{#if block}
  <div class="text-sm font-medium text-gray-700 dark:text-gray-200">{@render children()}</div>
{:else}
  <P size="sm" weight="medium" class="text-gray-700 dark:text-gray-200">{@render children()}</P>
{/if}
