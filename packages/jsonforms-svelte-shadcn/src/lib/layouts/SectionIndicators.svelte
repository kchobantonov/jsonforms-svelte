<script lang="ts">
  import { validationPopoverPosition } from '../util/validationPopoverPosition';
  import { useHoverClose } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    SectionErrorSummary,
    SectionIndicatorFrame,
    useSectionStatus,
    type SectionIndicatorProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Circle, CircleAlert } from '@lucide/svelte';
  import { getPortalTargetResolver } from '../util';

  const resolvePortalTarget = getPortalTargetResolver();
  const props: SectionIndicatorProps = $props();
  const status = useSectionStatus(props);
  const { validationLabel } = $derived(status);
  let open = $state(false);
  let trigger = $state<HTMLElement | null>(null);
  let panel = $state<HTMLElement | null>(null);
  let left = $state(8);
  let top = $state<number | undefined>(8);
  let bottom = $state<number | undefined>();
  let availableHeight = $state(280);
  let pinned = false;
  const { cancel: cancelHoverClose, schedule: closeAfterHover } = useHoverClose(() => {
    if (!pinned) open = false;
  }, 150);

  function showOnHover() {
    cancelHoverClose();
    position();
    open = true;
  }

  function position() {
    if (!trigger) return;
    ({ left, top, bottom, availableHeight } = validationPopoverPosition(trigger, 'start', 280));
  }
  function toggle(event: MouseEvent | KeyboardEvent) {
    if (!trigger || !event.composedPath().includes(trigger)) return;
    event.stopPropagation();
    cancelHoverClose();
    position();
    pinned = !pinned;
    open = pinned;
  }
  function portal(node: HTMLElement) {
    const target =
      resolvePortalTarget() ?? trigger?.closest('button')?.parentElement ?? document.body;
    target.append(node);
    return { destroy: () => node.remove() };
  }
  $effect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.composedPath().includes(trigger!) || event.composedPath().includes(panel!)) return;
      pinned = false;
      open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      pinned = false;
      open = false;
      trigger?.focus();
    };
    const update = () => position();
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', escape, true);
    window.addEventListener('resize', update);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', escape, true);
      window.removeEventListener('resize', update);
    };
  });
</script>

<SectionIndicatorFrame
  {props}
  {status}
  dataClass="text-foreground inline-flex size-3 shrink-0 items-center justify-center no-underline"
>
  {#snippet dataIcon()}<Circle
      size={10}
      fill="currentColor"
      strokeWidth={0}
      aria-hidden="true"
    />{/snippet}

  <!-- The focusable status icon is a span so it does not nest a button in the section header. -->
  <span
    bind:this={trigger}
    role="button"
    tabindex="0"
    onclick={toggle}
    onmouseenter={showOnHover}
    onmouseleave={closeAfterHover}
    onkeydown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle(event);
      } else if (event.key !== 'Escape') event.stopPropagation();
    }}
    aria-label={validationLabel}
    aria-haspopup="dialog"
    aria-expanded={open}
    class="text-destructive"
    {...status.attributes}><CircleAlert size={16} aria-hidden="true" /></span
  >
  {#if open}
    <div
      bind:this={panel}
      use:portal
      role="dialog"
      tabindex="-1"
      aria-label={validationLabel}
      class="bg-popover text-popover-foreground ring-foreground/10 fixed z-50 w-max max-w-[80vw] overflow-y-auto rounded-lg p-3 text-sm shadow-md ring-1"
      style:left={`${left}px`}
      style:top={top === undefined ? undefined : `${top}px`}
      style:bottom={bottom === undefined ? undefined : `${bottom}px`}
      style:max-height={`${availableHeight}px`}
      onclick={(event) => event.stopPropagation()}
      onmouseenter={cancelHoverClose}
      onmouseleave={closeAfterHover}
      onkeydown={(event) => {
        if (event.key !== 'Escape') event.stopPropagation();
      }}
    >
      <SectionErrorSummary {status} stopPropagation />
    </div>
  {/if}
</SectionIndicatorFrame>
