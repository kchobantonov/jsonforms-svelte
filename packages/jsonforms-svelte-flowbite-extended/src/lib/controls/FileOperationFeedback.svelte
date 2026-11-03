<script lang="ts">
  import { Button, Popover } from 'flowbite-svelte';
  let {
    message,
    severity,
    compact,
    id,
  }: { message: string; severity: 'warning' | 'error'; compact: boolean; id?: string } = $props();
  let open = $state(false);
  let popupPlacement = $state<'top-start' | 'bottom-start'>('bottom-start');
  let popupMaxHeight = $state(320);
  function fitPopup(trigger: HTMLElement) {
    const view = trigger.ownerDocument.defaultView;
    if (!view) return;
    const bounds = trigger.getBoundingClientRect();
    const above = bounds.top - 12;
    const below = view.innerHeight - bounds.bottom - 12;
    popupPlacement = above > below ? 'top-start' : 'bottom-start';
    popupMaxHeight = Math.max(64, Math.min(320, Math.max(above, below) - 16));
  }
  let suppressFocusOpenUntil = 0;
  const focusOpenSuppressed = () => performance.now() < suppressFocusOpenUntil;
  const color = $derived(
    severity === 'warning'
      ? 'text-yellow-700 dark:text-yellow-400'
      : 'text-red-700 dark:text-red-400',
  );
  function handleFeedbackKey(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      fitPopup(event.currentTarget as HTMLElement);
      suppressFocusOpenUntil = 0;
      open = true;
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      suppressFocusOpenUntil = performance.now() + 350;
      open = false;
    }
  }
</script>

{#if compact}
  <span class="inline-flex">
    <Button
      color="alternative"
      size="xs"
      class={color}
      aria-label={message}
      aria-expanded={open}
      onfocus={(event: FocusEvent) => {
        fitPopup(event.currentTarget as HTMLElement);
        if (!focusOpenSuppressed()) open = true;
      }}
      onpointerenter={(event: PointerEvent) => {
        fitPopup(event.currentTarget as HTMLElement);
        if (!focusOpenSuppressed()) open = true;
      }}
      onpointerdown={(event: PointerEvent) => fitPopup(event.currentTarget as HTMLElement)}
      onkeydowncapture={handleFeedbackKey}
      onclick={(event: MouseEvent) => {
        fitPopup(event.currentTarget as HTMLElement);
        suppressFocusOpenUntil = 0;
        open = true;
      }}>!</Button
    ><span {id} class="sr-only">{message}</span>
    <Popover
      onkeydowncapture={handleFeedbackKey}
      trigger="click"
      triggerDelay={0}
      strategy="fixed"
      placement={popupPlacement}
      bind:isOpen={
        () => open,
        (next) => {
          open = next && !focusOpenSuppressed();
        }
      }
      class="max-w-xs break-words"
      style={`--file-feedback-popup-max-height: ${popupMaxHeight}px`}
      classes={{
        content:
          'max-h-[var(--file-feedback-popup-max-height)] overflow-y-auto overscroll-y-contain whitespace-normal wrap-anywhere',
      }}>{message}</Popover
    >
  </span>
{:else}
  <p {id} role={severity === 'error' ? 'alert' : 'status'} class={`mt-1 text-sm ${color}`}>
    {message}
  </p>
{/if}
