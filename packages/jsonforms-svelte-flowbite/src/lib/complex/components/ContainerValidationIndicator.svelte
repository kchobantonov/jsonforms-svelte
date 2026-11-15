<script lang="ts">
  import {
    ErrorSummaryList,
    useErrorSummary,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import type { ErrorObject } from 'ajv';
  import { Button, Indicator, Popover } from 'flowbite-svelte';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import { onDestroy } from 'svelte';
  let {
    show,
    count,
    errors = [],
  }: { show: boolean; count?: number; errors?: ErrorObject[] } = $props();
  const message = useRendererMessages();
  const summary = useErrorSummary(() => errors);
  let open = $state(false);
  let dismissed = false;
  let pinned = false;
  let trigger = $state<HTMLButtonElement>();
  let hoverClose: ReturnType<typeof setTimeout> | undefined;
  function cancelHoverClose() {
    if (hoverClose) clearTimeout(hoverClose);
    hoverClose = undefined;
  }
  function showOnHover() {
    cancelHoverClose();
    dismissed = false;
    open = true;
  }
  function closeAfterHover() {
    cancelHoverClose();
    hoverClose = setTimeout(() => {
      if (!pinned) open = false;
    }, 150);
  }
  onDestroy(cancelHoverClose);
  function keydown(event: KeyboardEvent) {
    event.stopPropagation();
    if ((event.key === 'Enter' || event.key === ' ') && event.currentTarget === trigger) {
      event.preventDefault();
      cancelHoverClose();
      dismissed = false;
      pinned = true;
      open = true;
    }
    if (event.key === 'Escape' && open) {
      cancelHoverClose();
      dismissed = true;
      pinned = false;
      open = false;
      trigger?.focus();
    }
  }
</script>

{#if show}
  <div class="relative inline-flex">
    <button
      bind:this={trigger}
      type="button"
      data-container-validation-indicator
      aria-label={message('validation.errors')}
      aria-haspopup="dialog"
      aria-expanded={open}
      onmouseenter={showOnHover}
      onmouseleave={closeAfterHover}
      onpointerdown={() => (dismissed = false)}
      onclick={(event) => {
        event.stopPropagation();
        cancelHoverClose();
        pinned = !pinned;
        open = pinned;
      }}
      onkeydown={keydown}
    >
      <span class="relative inline-flex text-red-600 dark:text-red-400">
        {#if count !== undefined}<Indicator
            color="red"
            border
            placement="top-right"
            class="font-bold"><span class="text-xs font-bold text-white">{count}</span></Indicator
          >{/if}
        <ExclamationCircleOutline class="size-4" aria-hidden="true" />
      </span>
    </button>
    <Popover
      trigger="click"
      bind:isOpen={
        () => open && !dismissed,
        (value) => {
          open = value && !dismissed;
          if (!open) pinned = false;
        }
      }
      strategy="fixed"
      transitionParams={{ duration: 0 }}
      role="dialog"
      class="max-w-[80vw] p-3 text-sm"
      onmouseenter={cancelHoverClose}
      onmouseleave={closeAfterHover}
      onclick={(event) => event.stopPropagation()}
      onkeydown={keydown}
    >
      <div class="max-h-[min(18.5rem,calc(100dvh-3.5rem))] overflow-x-hidden overflow-y-auto">
        <ErrorSummaryList entries={summary.entries}>
          {#snippet toggle(label, action, expanded)}<Button
              color="alternative"
              size="xs"
              onclick={action}
              aria-expanded={expanded}>{label}</Button
            >{/snippet}
        </ErrorSummaryList>
      </div>
    </Popover>
  </div>
{/if}
