<script lang="ts">
  import {
    ErrorSummaryList,
    useErrorSummary,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import type { ErrorObject } from 'ajv';
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import type { Snippet } from 'svelte';
  import { onDestroy } from 'svelte';
  import { getPortalRootNodeGetter, getPortalTargetResolver } from '../../util';
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

{#if errors.length > 0}
  <Popover
    {open}
    onOpenChange={(event) => (open = event.open)}
    {getRootNode}
    positioning={{ placement: 'top', strategy: 'fixed' }}
  >
    <Popover.Trigger
      {...rest}
      class="relative inline-flex"
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
      {#if showCount}
        <span
          class={`absolute -end-1.5 -top-1.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold ${color === 'warning' ? 'preset-filled-warning-500' : color === 'surface' ? 'preset-filled-surface-500' : 'preset-filled-error-500'} ${border ? 'ring-surface-50-950 ring-2' : ''}`}
          >{errors.length}</span
        >
      {/if}
      {@render children?.()}
    </Popover.Trigger>
    <Portal target={resolvePortalTarget() ?? undefined}>
      <Popover.Positioner>
        <Popover.Content
          class="card preset-filled-surface-50-950 max-h-[min(20rem,calc(100dvh-2rem))] max-w-[80vw] overflow-y-auto p-3 text-sm shadow-xl"
          onmouseenter={cancelHoverClose}
          onmouseleave={closeAfterHover}
          onkeydown={closeOnEscape}
          onclick={(event) => event.stopPropagation()}
        >
          {#if !showCount && summary.entries.length === 1}
            <span data-error-summary>{summary.entries[0].message}</span>
          {:else}
            <ErrorSummaryList entries={summary.entries}>
              {#snippet toggle(label, action, expanded)}<button
                  type="button"
                  class="btn btn-sm preset-outlined"
                  onclick={action}
                  aria-expanded={expanded}>{label}</button
                >{/snippet}
            </ErrorSummaryList>
          {/if}
        </Popover.Content>
      </Popover.Positioner>
    </Portal>
  </Popover>
{:else}
  {@render children?.()}
{/if}
