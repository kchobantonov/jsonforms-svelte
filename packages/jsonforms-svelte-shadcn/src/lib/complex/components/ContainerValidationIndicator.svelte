<script lang="ts">
  import ValidationSummary from '../../components/ValidationSummary.svelte';
  import { validationPopoverPosition } from '../../util/validationPopoverPosition';
  import { useHoverClose } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    useRendererMessages,
    useErrorSummary,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { ErrorObject } from 'ajv';
  import { Badge } from '@jsonforms-svelte-shadcn-ui/badge';
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
  let trigger = $state<HTMLButtonElement>();
  let panel = $state<HTMLElement>();
  let left = $state(8);
  let top = $state<number | undefined>(8);
  let bottom = $state<number | undefined>();
  let availableHeight = $state(280);
  let pinned = false;
  const { cancel: cancelClose, schedule: closeAfterHover } = useHoverClose(() => {
    if (!pinned) open = false;
  }, 400);
  function position() {
    if (!trigger) return;
    ({ left, top, bottom, availableHeight } = validationPopoverPosition(trigger, 'end', 320));
  }

  function portal(node: HTMLElement) {
    (resolvePortalTarget() ?? document.body).append(node);
    return { destroy: () => node.remove() };
  }
  function close() {
    cancelClose();
    pinned = false;
    open = false;
  }
  $effect(() => {
    if (!show) close();
  });
  $effect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.composedPath().includes(trigger!) || event.composedPath().includes(panel!)) return;
      close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      close();
      trigger?.focus();
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', escape, true);
    window.addEventListener('resize', position);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', escape, true);
      window.removeEventListener('resize', position);
    };
  });
</script>

{#if show}
  <button
    bind:this={trigger}
    type="button"
    data-container-validation-indicator
    aria-label={message('validation.errors')}
    aria-haspopup="dialog"
    aria-expanded={open}
    onmouseenter={() => {
      cancelClose();
      position();
      open = true;
    }}
    onmouseleave={closeAfterHover}
    onclick={(event) => {
      event.stopPropagation();
      cancelClose();
      position();
      pinned = !pinned;
      open = pinned;
    }}
    onkeydown={(event) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      event.stopPropagation();
    }}
  >
    <Badge variant="destructive">{count ?? '!'}</Badge>
  </button>
  {#if open}
    <div
      bind:this={panel}
      use:portal
      data-slot="popover-content"
      role="dialog"
      tabindex="-1"
      aria-label={message('validation.errors')}
      class="bg-popover text-popover-foreground ring-foreground/10 fixed z-50 w-auto max-w-[80vw] overflow-y-auto rounded-lg p-3 text-sm shadow-md ring-1"
      style:left={`${left}px`}
      style:top={top === undefined ? undefined : `${top}px`}
      style:bottom={bottom === undefined ? undefined : `${bottom}px`}
      style:max-height={`${availableHeight}px`}
      onmouseenter={cancelClose}
      onmouseleave={closeAfterHover}
      onclick={(event) => event.stopPropagation()}
      onkeydown={(event) => {
        if (event.key !== 'Escape') event.stopPropagation();
      }}
    >
      <ValidationSummary entries={summary.entries} />
    </div>
  {/if}
{/if}
