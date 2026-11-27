<script lang="ts">
  import { useHoverClose } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    type ValidationPopoverProps,
    useValidationPopover,
    ErrorSummaryList,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import { onDestroy } from 'svelte';
  import { getPortalRootNodeGetter, getPortalTargetResolver } from '../../util';
  const props: ValidationPopoverProps = $props();
  const { summary, message } = useValidationPopover(props);
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  let open = $state(false);
  let pinned = false;
  const { cancel: cancelHoverClose, schedule: scheduleClose } = useHoverClose(() => {
    open = false;
  }, 150);
  let clickOpen: ReturnType<typeof setTimeout> | undefined;
  function showOnHover() {
    cancelHoverClose();
    open = true;
  }
  function closeAfterHover() {
    if (!pinned) scheduleClose();
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

{#if props.visible}
  <Popover
    {open}
    onOpenChange={(event) => (open = event.open)}
    {getRootNode}
    positioning={{ placement: 'top', strategy: 'fixed' }}
  >
    <Popover.Trigger
      {...props.attributes}
      class={props.container ? undefined : 'relative inline-flex'}
      {...props.container ? { 'data-container-validation-indicator': '' } : {}}
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
      {@render props.triggerContent()}
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
          <ErrorSummaryList single={props.single} entries={summary.entries}>
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
{:else}
  {@render props.fallback?.()}
{/if}
