<script lang="ts">
  import ValidationSummary from '../../components/ValidationSummary.svelte';
  import { useHoverClose } from '@chobantonov/jsonforms-svelte-renderer-common';
  import PopoverContent from '../../components/PopoverContent.svelte';
  import {
    useRendererMessages,
    useErrorSummary,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import type { ValidationBadgeProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  let {
    errors,
    border = false,
    showCount = true,
    color = 'error',
    children,
    ...rest
  }: ValidationBadgeProps = $props();
  const message = useRendererMessages(true);
  const summary = useErrorSummary(() => errors);
  let open = $state(false);
  let pinned = false;
  const { cancel: cancelClose, schedule: scheduleClose } = useHoverClose(() => {
    open = false;
  }, 400);

  function showOnHover() {
    cancelClose();
    open = true;
  }

  function closeAfterHover() {
    if (!pinned) scheduleClose();
  }

  $effect(() => {
    if (!open) pinned = false;
  });
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
    <PopoverContent
      align="end"
      class="max-h-[min(20rem,var(--bits-popover-content-available-height,20rem))] w-auto max-w-[80vw] overflow-y-auto p-3 text-sm"
      onmouseenter={cancelClose}
      onmouseleave={closeAfterHover}
      onkeydown={(event) => {
        if (event.key !== 'Escape') event.stopPropagation();
      }}
      onclick={(event) => event.stopPropagation()}
    >
      <ValidationSummary single={!showCount} entries={summary.entries} />
    </PopoverContent>
  </Popover.Root>
{:else}
  {@render children?.()}
{/if}
