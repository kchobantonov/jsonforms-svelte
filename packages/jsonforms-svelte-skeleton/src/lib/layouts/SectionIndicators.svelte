<script lang="ts">
  import {
    ErrorSummaryList,
    useErrorSummary,
    useSectionIndicators,
  } from '@chobantonov/jsonforms-svelte';
  import type { UISchemaElement } from '@jsonforms/core';
  import type { ErrorObject } from 'ajv';
  import { CircleAlert } from '@lucide/svelte';
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import { getPortalTargetResolver, getPortalRootNodeGetter } from '../util';
  import { onDestroy } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
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
    errorSource?: 'object' | 'additionalProperties' | 'array';
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
  let pinned = false;
  let hoverClose: ReturnType<typeof setTimeout> | undefined;
  function cancelHoverClose() {
    if (hoverClose) clearTimeout(hoverClose);
    hoverClose = undefined;
  }
  function showOnHover() {
    cancelHoverClose();
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
    open = pinned;
  }
  function keydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      cancelHoverClose();
      pinned = event.key !== 'Escape';
      open = pinned;
    }
  }
</script>

{#if showValidation || (showData && indicators.hasData)}
  <span class={`inline-flex shrink-0 items-center gap-1 ${className}`}>
    {#if showValidation}
      <Popover
        {open}
        onOpenChange={(event) => {
          open = event.open;
          if (!open) pinned = false;
        }}
        {getRootNode}
        positioning={{ strategy: 'fixed' }}
      >
        <Popover.Trigger
          >{#snippet element(
            props,
          )}<!-- The native trigger snippet supports replacing its default button; its attributes target this span. -->
            <!-- The focusable status icon opens a tooltip without adding a nested button to the section header. -->
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <span
              {...props as HTMLAttributes<HTMLSpanElement>}
              role="img"
              tabindex="0"
              onclick={reveal}
              onmouseenter={showOnHover}
              onmouseleave={closeAfterHover}
              onkeydown={keydown}
              aria-label={validationLabel}
              class="text-error-500 dark:text-error-400"
              data-object-own-errors={hasOwnErrors && errorSource === 'object' ? true : undefined}
              data-array-own-error-indicator={hasOwnErrors && errorSource === 'array'
                ? true
                : undefined}
              data-additional-property-errors={hasOwnErrors &&
              errorSource === 'additionalProperties'
                ? true
                : undefined}
              data-container-validation-indicator={!hasOwnErrors ? true : undefined}
              data-error-count={!hasOwnErrors ? indicators.validation.count : undefined}
              ><CircleAlert size={16} aria-hidden="true" /></span
            >{/snippet}</Popover.Trigger
        >
        <Portal target={resolvePortalTarget() ?? undefined}
          ><Popover.Positioner>
            <Popover.Content
              class="card preset-filled-surface-950-50 max-w-sm p-2 text-sm whitespace-pre-line shadow-xl"
              ><div
                role="presentation"
                onmouseenter={cancelHoverClose}
                onmouseleave={closeAfterHover}
              >
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
              </div></Popover.Content
            >
          </Popover.Positioner></Portal
        >
      </Popover>
    {/if}
    {#if showData && indicators.hasData}<span
        role="img"
        aria-label={indicators.dataLabel}
        title={indicators.dataLabel}
        data-group-indicator>●</span
      >{/if}
  </span>
{/if}
