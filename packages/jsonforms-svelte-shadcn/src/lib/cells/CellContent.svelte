<script lang="ts">
  import { CircleAlertIcon } from '$lib/components/icons';
  import type { Snippet } from 'svelte';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { getPortalTarget } from '../util';

  let { errors, children }: { errors?: string; children: Snippet } = $props();
  const hasErrors = $derived(!!errors?.trim());
</script>

<div
  class:cell-invalid={hasErrors}
  class="[&.cell-invalid_input]:border-destructive [&.cell-invalid_select]:border-destructive [&.cell-invalid_[data-slot=select-trigger]]:border-destructive [&.cell-invalid_[data-slot=input]]:border-destructive [&.cell-invalid_[aria-haspopup=dialog]]:border-destructive flex min-w-0 items-center gap-1.5"
>
  <div class="min-w-0 flex-1">{@render children()}</div>
  {#if hasErrors}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              type="button"
              class="text-destructive focus-visible:ring-ring/50 inline-flex size-7 shrink-0 items-center justify-center rounded-md outline-none focus-visible:ring-3"
              aria-label={`Validation error: ${errors}`}
            >
              <CircleAlertIcon class="size-4" />
            </button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content portalProps={{ to: getPortalTarget() }} side="top">
          <span class="whitespace-pre-line">{errors}</span>
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  {/if}
</div>
