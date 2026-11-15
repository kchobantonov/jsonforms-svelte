<script lang="ts">
  import {
    ErrorSummaryList,
    useErrorSummary,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import type { ErrorObject } from 'ajv';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import type { Snippet } from 'svelte';
  import { onDestroy } from 'svelte';
  import { getPortalTargetResolver } from '../../util';
  interface Props {
    errors: ErrorObject[];
    border?: boolean;
    showCount?: boolean;
    color?: 'error' | 'warning' | 'surface';
    children?: Snippet;
    [key: string]: unknown;
  }
  let {
    errors,
    border = false,
    showCount = true,
    color = 'error',
    children,
    ...rest
  }: Props = $props();
  const message = useRendererMessages(true);
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

{#if errors.length > 0}
  <Popover.Root bind:open>
    <Popover.Trigger
      {...rest}
      class="relative inline-flex"
      aria-label={message('validation.errors')}
      onmouseenter={showOnHover}
      onmouseleave={closeAfterHover}
      onclick={(event) => {
        event.stopPropagation();
        cancelClose();
        const next = !pinned;
        pinned = next;
        // The primitive toggles on click, including when hover already opened it.
        queueMicrotask(() => (open = next));
      }}
      onkeydown={(event) => {
        if (event.key !== 'Escape') event.stopPropagation();
      }}
    >
      {#if showCount}
        <span
          class={`absolute -end-1.5 -top-1.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold ${color === 'warning' ? 'bg-amber-500 text-white' : color === 'surface' ? 'bg-muted text-muted-foreground' : 'bg-destructive text-white'} ${border ? 'ring-background ring-2' : ''}`}
          >{errors.length}</span
        >
      {/if}
      {@render children?.()}
    </Popover.Trigger>
    <Popover.Content
      portalProps={{ to: resolvePortalTarget() ?? undefined }}
      align="end"
      class="max-h-[min(20rem,var(--bits-popover-content-available-height,20rem))] w-auto max-w-[80vw] overflow-y-auto p-3 text-sm"
      onmouseenter={cancelClose}
      onmouseleave={closeAfterHover}
      onkeydown={(event) => {
        if (event.key !== 'Escape') event.stopPropagation();
      }}
      onclick={(event) => event.stopPropagation()}
    >
      {#if !showCount && summary.entries.length === 1}
        <span data-error-summary>{summary.entries[0].message}</span>
      {:else}
        <ErrorSummaryList entries={summary.entries}>
          {#snippet toggle(label, action, expanded)}<Button
              variant="ghost"
              size="sm"
              onclick={action}
              aria-expanded={expanded}>{label}</Button
            >{/snippet}
        </ErrorSummaryList>
      {/if}
    </Popover.Content>
  </Popover.Root>
{:else}
  {@render children?.()}
{/if}
