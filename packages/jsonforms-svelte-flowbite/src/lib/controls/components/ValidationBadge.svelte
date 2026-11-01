<script lang="ts">
  import {
    ErrorSummaryList,
    useErrorSummary,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte';
  import type { ErrorObject } from 'ajv';
  import { Button, Indicator, Popover, type BadgeProps } from 'flowbite-svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { onDestroy } from 'svelte';
  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
    errors: ErrorObject[];
    border?: boolean;
    showCount?: boolean;
    color?: BadgeProps['color'];
    children: Snippet;
  }
  let {
    errors,
    border = false,
    showCount = true,
    color = 'red',
    children,
    ...rest
  }: Props = $props();
  const message = useRendererMessages(true);
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

{#if errors.length > 0}
  <div class="relative inline-flex" {...rest}>
    <button
      bind:this={trigger}
      type="button"
      class="relative inline-flex"
      aria-label={message('validation.errors')}
      aria-haspopup="dialog"
      aria-expanded={open}
      onmouseenter={showOnHover}
      onmouseleave={closeAfterHover}
      onpointerdown={() => {
        dismissed = false;
      }}
      onclick={(event) => {
        event.stopPropagation();
        cancelHoverClose();
        pinned = !pinned;
        open = pinned;
      }}
      onkeydown={keydown}
    >
      {#if showCount}
        <Indicator {color} {border} placement="top-right" class="font-bold"
          ><span class="text-xs font-bold text-white">{errors.length}</span></Indicator
        >
      {/if}
      {@render children()}
    </button>
    <Popover
      trigger="click"
      bind:isOpen={
        () => open,
        (value) => {
          open = value && !dismissed;
          if (!open) pinned = false;
        }
      }
      strategy="fixed"
      transitionParams={{ duration: 0 }}
      role="dialog"
      class="max-h-[min(20rem,calc(100dvh-2rem))] max-w-[80vw] overflow-y-auto p-3 text-sm"
      onmouseenter={cancelHoverClose}
      onmouseleave={closeAfterHover}
      onclick={(event) => event.stopPropagation()}
      onkeydown={keydown}
    >
      {#if !showCount && summary.entries.length === 1}
        <span data-error-summary>{summary.entries[0].message}</span>
      {:else}
        <ErrorSummaryList entries={summary.entries}>
          {#snippet toggle(label, action, expanded)}<Button
              color="alternative"
              size="xs"
              onclick={action}
              aria-expanded={expanded}>{label}</Button
            >{/snippet}
        </ErrorSummaryList>
      {/if}
    </Popover>
  </div>
{:else}
  {@render children()}
{/if}
