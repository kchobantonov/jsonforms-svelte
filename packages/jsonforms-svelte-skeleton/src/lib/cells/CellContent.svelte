<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import { CircleAlertIcon } from '@lucide/svelte';
  import { Tooltip, Portal } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
  import { getPortalRootNodeGetter, getPortalTargetResolver } from '../util';
  import type { Snippet } from 'svelte';
  let { errors, children }: { errors?: string; children: Snippet } = $props();
  const invalid = $derived(!!errors?.trim());
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  let focused = $state(false);
  let hovered = $state(false);
  let dismissed = $state(false);
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  const hintOpen = $derived((focused || hovered) && !dismissed);
  const dismissHint = (event: KeyboardEvent) => {
    if (event.key === 'Escape') dismissed = true;
  };
  onMount(() => () => {
    clearTimeout(hoverTimer);
    window.removeEventListener('keydown', dismissHint, true);
  });
</script>

<div
  class:cell-invalid={invalid}
  class="[&.cell-invalid_input]:!border-error-500 [&.cell-invalid_select]:!border-error-500 [&.cell-invalid_button]:!border-error-500 flex min-w-0 items-center gap-1.5"
>
  <div class="min-w-0 flex-1">{@render children()}</div>
  {#if invalid}<Tooltip
      open={hintOpen}
      openDelay={0}
      {getRootNode}
      positioning={{ placement: 'top', strategy: 'fixed' }}
    >
      <Tooltip.Trigger
        type="button"
        class="btn-icon btn-icon-sm text-error-500 shrink-0"
        title={errors}
        aria-label={message('validation.cellErrors', { errors })}
        onfocus={() => {
          focused = true;
          dismissed = false;
          window.addEventListener('keydown', dismissHint, true);
        }}
        onblur={() => {
          focused = false;
          window.removeEventListener('keydown', dismissHint, true);
        }}
        onpointerenter={() => {
          clearTimeout(hoverTimer);
          hoverTimer = setTimeout(() => {
            hovered = true;
            dismissed = false;
          }, 80);
        }}
        onpointerleave={() => {
          clearTimeout(hoverTimer);
          hovered = false;
        }}><CircleAlertIcon class="size-4" /></Tooltip.Trigger
      >
      <Portal target={resolvePortalTarget() ?? undefined}>
        <Tooltip.Context>
          {#snippet children(tooltip)}
            <div {...tooltip().getPositionerProps()} class="pointer-events-none">
              <Tooltip.Content
                class="card preset-filled-surface-950-50 pointer-events-none px-3 py-2 text-sm whitespace-pre-line shadow-xl"
                >{errors}</Tooltip.Content
              >
            </div>
          {/snippet}
        </Tooltip.Context>
      </Portal>
    </Tooltip>{/if}
</div>
