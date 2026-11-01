<script lang="ts">
  import {
    ErrorSummaryList,
    useErrorSummary,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import type { ErrorObject } from 'ajv';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import { Badge } from '@jsonforms-svelte-shadcn-ui/badge';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { onDestroy } from 'svelte';
  import { getPortalTargetResolver } from '../../util';
  let {
    show,
    count,
    errors = [],
  }: { show: boolean; count?: number; errors?: ErrorObject[] } = $props();
  const message = useRendererMessages();
  const summary = useErrorSummary(() => errors);
  const resolvePortalTarget = getPortalTargetResolver();
  let open = $state(false);
  let pinned = false;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  function cancelClose() {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = undefined;
  }
  function showOnHover() {
    cancelClose();
    open = true;
  }
  function closeAfterHover() {
    if (pinned) return;
    cancelClose();
    closeTimer = setTimeout(() => (open = false), 400);
  }
  $effect(() => {
    if (!open) pinned = false;
  });
  onDestroy(cancelClose);
</script>

{#if show}
  <Popover.Root bind:open>
    <Popover.Trigger
      data-container-validation-indicator
      aria-label={message('validation.errors')}
      onmouseenter={showOnHover}
      onmouseleave={closeAfterHover}
      onclick={(event) => {
        event.stopPropagation();
        cancelClose();
        const next = !pinned;
        pinned = next;
        queueMicrotask(() => (open = next));
      }}
      onkeydown={(event) => {
        if (event.key !== 'Escape') event.stopPropagation();
      }}
    >
      <Badge variant="destructive">{count ?? '!'}</Badge>
    </Popover.Trigger>
    <Popover.Content
      portalProps={{ to: resolvePortalTarget() ?? undefined }}
      class="max-h-[min(20rem,var(--bits-popover-content-available-height,20rem))] w-auto max-w-[80vw] overflow-y-auto p-3 text-sm"
      onmouseenter={cancelClose}
      onmouseleave={closeAfterHover}
      onclick={(event) => event.stopPropagation()}
      onkeydown={(event) => {
        if (event.key !== 'Escape') event.stopPropagation();
      }}
    >
      <ErrorSummaryList entries={summary.entries}>
        {#snippet toggle(label, action, expanded)}<Button
            variant="ghost"
            size="sm"
            onclick={action}
            aria-expanded={expanded}>{label}</Button
          >{/snippet}
      </ErrorSummaryList>
    </Popover.Content>
  </Popover.Root>
{/if}
