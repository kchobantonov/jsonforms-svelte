<script lang="ts">
  import { useHoverClose } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    type ValidationPopoverProps,
    useValidationPopover,
    ErrorSummaryList,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Button, Popover } from 'flowbite-svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  const props: ValidationPopoverProps<Omit<HTMLAttributes<HTMLDivElement>, 'color'>> = $props();
  const { summary, message } = useValidationPopover(props);
  let open = $state(false);
  let dismissed = false;
  let pinned = false;
  let trigger = $state<HTMLButtonElement>();
  const { cancel: cancelHoverClose, schedule: closeAfterHover } = useHoverClose(() => {
    if (!pinned) open = false;
  }, 150);
  function showOnHover() {
    cancelHoverClose();
    dismissed = false;
    open = true;
  }

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

{#if props.visible}
  <div class="relative inline-flex" {...props.attributes}>
    <button
      bind:this={trigger}
      type="button"
      class={props.container ? undefined : 'relative inline-flex'}
      data-container-validation-indicator={props.container ? '' : undefined}
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
      {@render props.triggerContent()}
    </button>
    <Popover
      trigger="click"
      bind:isOpen={
        () => open && (!props.container || !dismissed),
        (value) => {
          open = value && !dismissed;
          if (!open) pinned = false;
        }
      }
      strategy="fixed"
      transitionParams={{ duration: 0 }}
      role="dialog"
      class={props.container
        ? 'max-w-[80vw] p-3 text-sm'
        : 'max-w-[80vw] overflow-x-hidden p-3 text-sm'}
      onmouseenter={cancelHoverClose}
      onmouseleave={closeAfterHover}
      onclick={(event) => event.stopPropagation()}
      onkeydown={keydown}
    >
      <div class="max-h-[min(18.5rem,calc(100dvh-3.5rem))] overflow-x-hidden overflow-y-auto">
        <ErrorSummaryList single={props.single} entries={summary.entries}>
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
{:else}
  {@render props.fallback?.()}
{/if}
