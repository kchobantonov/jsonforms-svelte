<script lang="ts">
  import {
    ErrorSummaryList,
    useErrorSummary,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import type { ErrorObject } from 'ajv';
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import { onDestroy } from 'svelte';
  import { getPortalRootNodeGetter, getPortalTargetResolver } from '../../util';
  let {
    show,
    count,
    errors = [],
  }: { show: boolean; count?: number; errors?: ErrorObject[] } = $props();
  const message = useRendererMessages();
  const summary = useErrorSummary(() => errors);
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  let open = $state(false);
  let pinned = false;
  let hoverClose: ReturnType<typeof setTimeout> | undefined;
  let clickOpen: ReturnType<typeof setTimeout> | undefined;
  function cancelHoverClose() {
    if (hoverClose) clearTimeout(hoverClose);
    hoverClose = undefined;
  }
  function showOnHover() {
    cancelHoverClose();
    open = true;
  }
  function closeAfterHover() {
    if (pinned) return;
    cancelHoverClose();
    hoverClose = setTimeout(() => (open = false), 150);
  }
  function closeOnEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape') {
      event.stopPropagation();
      return;
    }
    pinned = false;
    cancelHoverClose();
    if (clickOpen) clearTimeout(clickOpen);
    open = false;
  }
  $effect(() => {
    if (!open) pinned = false;
  });
  onDestroy(() => {
    cancelHoverClose();
    if (clickOpen) clearTimeout(clickOpen);
  });
</script>

{#if show}
  <Popover
    {open}
    onOpenChange={(event) => (open = event.open)}
    {getRootNode}
    positioning={{ placement: 'top', strategy: 'fixed' }}
  >
    <Popover.Trigger
      data-container-validation-indicator
      aria-label={message('validation.errors')}
      onmouseenter={showOnHover}
      onmouseleave={closeAfterHover}
      onclick={(event) => {
        event.stopPropagation();
        cancelHoverClose();
        const next = !pinned;
        pinned = next;
        if (clickOpen) clearTimeout(clickOpen);
        clickOpen = setTimeout(() => (open = next), 0);
      }}
      onkeydown={closeOnEscape}
    >
      <span class="badge preset-filled-error-500">{count ?? '!'}</span>
    </Popover.Trigger>
    <Portal target={resolvePortalTarget() ?? undefined}>
      <Popover.Positioner>
        <Popover.Content
          class="card preset-filled-surface-50-950 max-h-[min(20rem,calc(100dvh-2rem))] max-w-[80vw] overflow-y-auto p-3 text-sm shadow-xl"
          onmouseenter={cancelHoverClose}
          onmouseleave={closeAfterHover}
          onclick={(event) => event.stopPropagation()}
          onkeydown={closeOnEscape}
        >
          <ErrorSummaryList entries={summary.entries}>
            {#snippet toggle(label, action, expanded)}<button
                type="button"
                class="btn btn-sm preset-outlined"
                onclick={action}
                aria-expanded={expanded}>{label}</button
              >{/snippet}
          </ErrorSummaryList>
        </Popover.Content>
      </Popover.Positioner>
    </Portal>
  </Popover>
{/if}
