<script lang="ts">
  import {
    ErrorSummaryList,
    useErrorSummary,
    useSectionIndicators,
  } from '@chobantonov/jsonforms-svelte';
  import type { UISchemaElement } from '@jsonforms/core';
  import type { ErrorObject } from 'ajv';
  import { Circle, CircleAlert } from '@lucide/svelte';
  import { onDestroy } from 'svelte';
  import { getPortalTargetResolver } from '../util';

  const resolvePortalTarget = getPortalTargetResolver();
  const {
    uischema,
    path,
    class: className = '',
    errorMessage,
    errorErrors,
    errorSource = 'object',
    showData = true,
  }: {
    uischema: UISchemaElement;
    path: string;
    class?: string;
    errorMessage?: string;
    errorErrors?: ErrorObject[];
    errorSource?: 'object' | 'additionalProperties';
    showData?: boolean;
  } = $props();
  const indicators = useSectionIndicators(() => ({ uischema, path }), true);
  const hasOwnErrors = $derived(Boolean(errorMessage) || Boolean(errorErrors?.length));
  const summary = useErrorSummary(() =>
    hasOwnErrors ? [...new Set([...(errorErrors ?? []), ...indicators.errors])] : indicators.errors,
  );
  const validationLabel = $derived(errorMessage || indicators.validationLabel);
  const showValidation = $derived(hasOwnErrors || indicators.validation.show);
  let open = $state(false);
  let trigger = $state<HTMLElement | null>(null);
  let panel = $state<HTMLElement | null>(null);
  let left = $state(8);
  let top = $state<number | undefined>(8);
  let bottom = $state<number | undefined>();
  let availableHeight = $state(280);
  let pinned = false;
  let hoverClose: ReturnType<typeof setTimeout> | undefined;

  function cancelHoverClose() {
    if (hoverClose) clearTimeout(hoverClose);
    hoverClose = undefined;
  }
  function showOnHover() {
    cancelHoverClose();
    position();
    open = true;
  }
  function closeAfterHover() {
    cancelHoverClose();
    hoverClose = setTimeout(() => {
      if (!pinned) open = false;
    }, 150);
  }
  onDestroy(cancelHoverClose);

  function position() {
    if (!trigger) return;
    const bounds = trigger.getBoundingClientRect();
    const below = window.innerHeight - bounds.bottom;
    const above = bounds.top;
    const placeBelow = below >= Math.min(280, above);
    availableHeight = Math.max(80, Math.min(280, (placeBelow ? below : above) - 12));
    left = Math.max(
      8,
      Math.min(bounds.left, window.innerWidth - Math.min(448, window.innerWidth * 0.8) - 8),
    );
    // The popup's natural height can be much shorter than availableHeight.
    // Anchor its bottom edge above the icon instead of subtracting the maximum
    // permitted height, which leaves short summaries floating far above it.
    top = placeBelow ? bounds.bottom + 4 : undefined;
    bottom = placeBelow ? undefined : window.innerHeight - bounds.top + 4;
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

{#if showValidation || (showData && indicators.hasData)}
  <span class={`inline-flex shrink-0 items-center gap-1 ${className}`}>
    {#if showValidation}
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
        data-object-own-errors={hasOwnErrors && errorSource === 'object' ? true : undefined}
        data-additional-property-errors={hasOwnErrors && errorSource === 'additionalProperties'
          ? true
          : undefined}
        data-container-validation-indicator={!hasOwnErrors ? true : undefined}
        data-error-count={!hasOwnErrors ? indicators.validation.count : undefined}
        ><CircleAlert size={16} aria-hidden="true" /></span
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
          {#if !hasOwnErrors || errorErrors?.length || indicators.errors.length}
            <ErrorSummaryList entries={summary.entries}>
              {#snippet toggle(label, action, expanded)}<button
                  type="button"
                  onclick={(event) => {
                    event.stopImmediatePropagation();
                    action();
                  }}
                  aria-expanded={expanded}
                  class="underline">{label}</button
                >{/snippet}
            </ErrorSummaryList>
          {:else}{validationLabel}{/if}
        </div>
      {/if}
    {/if}
    {#if showData && indicators.hasData}<span
        role="img"
        aria-label={indicators.dataLabel}
        title={indicators.dataLabel}
        data-group-indicator
        class="text-foreground inline-flex size-3 shrink-0 items-center justify-center no-underline"
        ><Circle size={10} fill="currentColor" strokeWidth={0} aria-hidden="true" /></span
      >{/if}
  </span>
{/if}
