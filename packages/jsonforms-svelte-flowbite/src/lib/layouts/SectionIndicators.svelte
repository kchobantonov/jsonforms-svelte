<script lang="ts">
  import {
    ErrorSummaryList,
    useErrorSummary,
    useSectionIndicators,
  } from '@chobantonov/jsonforms-svelte';
  import type { UISchemaElement } from '@jsonforms/core';
  import type { ErrorObject } from 'ajv';
  import { ExclamationCircleOutline as CircleAlert } from 'flowbite-svelte-icons';
  import { Popover } from 'flowbite-svelte';
  import { onDestroy } from 'svelte';
  const {
    uischema,
    path,
    pathSegments,
    class: className = '',
    errorMessage,
    errorErrors,
    errorSource = 'object',
    showData = true,
  }: {
    uischema: UISchemaElement;
    path: string;
    pathSegments?: readonly string[];
    class?: string;
    errorMessage?: string;
    errorErrors?: ErrorObject[];
    errorSource?: 'object' | 'additionalProperties';
    showData?: boolean;
  } = $props();
  const indicators = useSectionIndicators(() => ({ uischema, path, pathSegments }));
  const hasOwnErrors = $derived(Boolean(errorMessage) || Boolean(errorErrors?.length));
  const summary = useErrorSummary(() =>
    hasOwnErrors ? [...new Set([...(errorErrors ?? []), ...indicators.errors])] : indicators.errors,
  );
  const validationLabel = $derived(errorMessage || indicators.validationLabel);
  const showValidation = $derived(hasOwnErrors || indicators.validation.show);
  let open = $state(false);
  let dismissed = $state(false);
  let pinned = false;
  let trigger = $state<HTMLSpanElement>();
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
  function reveal(event: MouseEvent) {
    event.stopPropagation();
    cancelHoverClose();
    pinned = !pinned;
    dismissed = false;
    open = pinned;
  }
  function keydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      cancelHoverClose();
      pinned = event.key !== 'Escape';
      dismissed = !pinned;
      open = pinned;
      if (event.key === 'Escape') trigger?.focus();
    }
  }
</script>

<svelte:window onkeydowncapture={(event) => event.key === 'Escape' && open && keydown(event)} />

{#if showValidation || (showData && indicators.hasData)}
  <span class={`inline-flex shrink-0 items-center gap-1 ${className}`}>
    {#if showValidation}
      <!-- The focusable status icon opens a tooltip without adding a nested button to the section header. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
      <span
        bind:this={trigger}
        role="img"
        tabindex="0"
        onfocusin={() => (dismissed = false)}
        onmouseenter={showOnHover}
        onmouseleave={closeAfterHover}
        onclick={reveal}
        onkeydown={keydown}
        aria-label={validationLabel}
        class="text-red-500 dark:text-red-400"
        data-object-own-errors={hasOwnErrors && errorSource === 'object' ? true : undefined}
        data-additional-property-errors={hasOwnErrors && errorSource === 'additionalProperties'
          ? true
          : undefined}
        data-container-validation-indicator={!hasOwnErrors ? true : undefined}
        data-error-count={!hasOwnErrors ? indicators.validation.count : undefined}
        ><CircleAlert size="sm" aria-hidden="true" /></span
      >
      <Popover
        bind:isOpen={
          () => open && !dismissed,
          (value) => {
            open = value && !dismissed;
            if (!open) pinned = false;
          }
        }
        trigger="click"
        transitionParams={{ duration: 0 }}
        strategy="fixed"
        role="dialog"
        class="m-0 w-max max-w-sm whitespace-pre-line"
        ><div role="presentation" onmouseenter={cancelHoverClose} onmouseleave={closeAfterHover}>
          {#if !hasOwnErrors || errorErrors?.length || indicators.errors.length}<ErrorSummaryList
              entries={summary.entries}
            >
              {#snippet toggle(label, action, expanded)}<button
                  type="button"
                  onclick={action}
                  aria-expanded={expanded}
                  class="underline">{label}</button
                >{/snippet}
            </ErrorSummaryList>{:else}{validationLabel}{/if}
        </div></Popover
      >
    {/if}
    {#if showData && indicators.hasData}<span
        role="img"
        aria-label={indicators.dataLabel}
        title={indicators.dataLabel}
        data-group-indicator>●</span
      >{/if}
  </span>
{/if}
