<script lang="ts">
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  const {
    controlId,
    value,
    class: className = 'text-sm text-red-600 dark:text-red-400',
  }: {
    controlId?: string;
    value: unknown;
    class?: string;
  } = $props();
  const message = useRendererMessages();
</script>

{#if value !== undefined}
  <p id={`${controlId}-invalid-value`} class={className} role="status">
    {message('control.invalidCurrentValue', { value })}
  </p>
{/if}
