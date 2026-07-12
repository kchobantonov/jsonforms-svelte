<script lang="ts">
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import type { Snippet } from 'svelte';
  let { errors, children }: { errors?: string; children: Snippet } = $props();
  const invalid = $derived(!!errors?.trim());
</script>

<div
  class:cell-invalid={invalid}
  class="flex min-w-0 items-center gap-1.5 [&.cell-invalid_button]:!border-red-500 [&.cell-invalid_input]:!border-red-500 [&.cell-invalid_select]:!border-red-500"
>
  <div class="min-w-0 flex-1">{@render children()}</div>
  {#if invalid}<button
      type="button"
      class="shrink-0 rounded p-1 text-red-600 focus:ring-2 focus:ring-red-500"
      title={errors}
      aria-label={`Validation error: ${errors}`}><ExclamationCircleOutline class="size-4" /></button
    >{/if}
</div>
