<script lang="ts">
  import { CircleAlertIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  let { errors, children }: { errors?: string; children: Snippet } = $props();
  const invalid = $derived(!!errors?.trim());
</script>

<div
  class:cell-invalid={invalid}
  class="[&.cell-invalid_input]:!border-error-500 [&.cell-invalid_select]:!border-error-500 [&.cell-invalid_button]:!border-error-500 flex min-w-0 items-center gap-1.5"
>
  <div class="min-w-0 flex-1">{@render children()}</div>
  {#if invalid}<button
      type="button"
      class="btn-icon btn-icon-sm text-error-500 shrink-0"
      title={errors}
      aria-label={`Validation error: ${errors}`}><CircleAlertIcon class="size-4" /></button
    >{/if}
</div>
