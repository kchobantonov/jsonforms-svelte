<script lang="ts">
  import { Button, Popover } from 'flowbite-svelte';
  let {
    message,
    severity,
    compact,
  }: { message: string; severity: 'warning' | 'error'; compact: boolean } = $props();
  let open = $state(false);
  const color = $derived(
    severity === 'warning'
      ? 'text-yellow-700 dark:text-yellow-400'
      : 'text-red-700 dark:text-red-400',
  );
</script>

{#if compact}
  <span class="inline-flex">
    <Button
      color="alternative"
      size="xs"
      class={color}
      aria-label={message}
      onfocus={() => (open = true)}
      onpointerenter={() => (open = true)}
      onclick={() => (open = true)}>!</Button
    >
    <Popover trigger="click" bind:isOpen={open} class="max-w-xs break-words">{message}</Popover>
  </span>
{:else}
  <p role={severity === 'error' ? 'alert' : 'status'} class={`mt-1 text-sm ${color}`}>{message}</p>
{/if}
