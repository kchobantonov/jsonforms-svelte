<script lang="ts">
  import { Button, Popover } from 'flowbite-svelte';
  let {
    message,
    severity,
    compact,
    id,
  }: { message: string; severity: 'warning' | 'error'; compact: boolean; id?: string } = $props();
  let open = $state(false);
  let suppressFocusOpenUntil = 0;
  const focusOpenSuppressed = () => performance.now() < suppressFocusOpenUntil;
  const color = $derived(
    severity === 'warning'
      ? 'text-yellow-700 dark:text-yellow-400'
      : 'text-red-700 dark:text-red-400',
  );
  function handleFeedbackKey(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      suppressFocusOpenUntil = 0;
      open = true;
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      suppressFocusOpenUntil = performance.now() + 350;
      open = false;
    }
  }
</script>

{#if compact}
  <span class="inline-flex">
    <Button
      color="alternative"
      size="xs"
      class={color}
      aria-label={message}
      aria-expanded={open}
      onfocus={() => {
        if (!focusOpenSuppressed()) open = true;
      }}
      onpointerenter={() => {
        if (!focusOpenSuppressed()) open = true;
      }}
      onkeydowncapture={handleFeedbackKey}
      onclick={() => {
        suppressFocusOpenUntil = 0;
        open = true;
      }}>!</Button
    ><span {id} class="sr-only">{message}</span>
    <Popover
      onkeydowncapture={handleFeedbackKey}
      trigger="click"
      triggerDelay={0}
      bind:isOpen={
        () => open,
        (next) => {
          open = next && !focusOpenSuppressed();
        }
      }
      class="max-w-xs break-words">{message}</Popover
    >
  </span>
{:else}
  <p {id} role={severity === 'error' ? 'alert' : 'status'} class={`mt-1 text-sm ${color}`}>
    {message}
  </p>
{/if}
