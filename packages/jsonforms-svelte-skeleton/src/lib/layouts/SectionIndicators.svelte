<script lang="ts">
  import { useSectionIndicators } from '@chobantonov/jsonforms-svelte';
  import type { UISchemaElement } from '@jsonforms/core';
  import { CircleAlert } from '@lucide/svelte';
  import { Portal, Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { getPortalTargetResolver, getPortalRootNodeGetter } from '../util';
  import { onMount } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  let portalTarget = $state<HTMLElement>();
  onMount(() => {
    portalTarget = resolvePortalTarget() ?? undefined;
  });
  const {
    uischema,
    path,
    class: className = '',
    errorMessage,
    errorSource = 'object',
    showData = true,
  }: {
    uischema: UISchemaElement;
    path: string;
    class?: string;
    errorMessage?: string;
    errorSource?: 'object' | 'additionalProperties';
    showData?: boolean;
  } = $props();
  const indicators = useSectionIndicators(() => ({ uischema, path }));
  const validationLabel = $derived(errorMessage ?? indicators.validationLabel);
  const showValidation = $derived(
    errorMessage === undefined ? indicators.validation.show : Boolean(errorMessage),
  );
  let open = $state(false);
  function reveal(event: MouseEvent) {
    event.stopPropagation();
    open = true;
  }
  function keydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      open = event.key !== 'Escape';
    }
  }
</script>

{#if showValidation || (showData && indicators.hasData)}
  <span class={`inline-flex shrink-0 items-center gap-1 ${className}`}>
    {#if showValidation}
      <Tooltip {open} onOpenChange={(event) => (open = event.open)} {getRootNode}>
        <Tooltip.Trigger
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
              onkeydown={keydown}
              aria-label={validationLabel}
              class="text-error-500 dark:text-error-400"
              data-object-own-errors={errorMessage !== undefined && errorSource === 'object'
                ? true
                : undefined}
              data-additional-property-errors={errorMessage !== undefined &&
              errorSource === 'additionalProperties'
                ? true
                : undefined}
              data-container-validation-indicator={errorMessage === undefined ? true : undefined}
              data-error-count={errorMessage === undefined
                ? indicators.validation.count
                : undefined}><CircleAlert size={16} aria-hidden="true" /></span
            >{/snippet}</Tooltip.Trigger
        >
        <Portal target={portalTarget}
          ><Tooltip.Context
            >{#snippet children(tooltip)}<div {...tooltip().getPositionerProps()}>
                <Tooltip.Content
                  class="card preset-filled-surface-950-50 max-w-sm p-2 text-sm whitespace-pre-line shadow-xl"
                  >{validationLabel}</Tooltip.Content
                >
              </div>{/snippet}</Tooltip.Context
          ></Portal
        >
      </Tooltip>
    {/if}
    {#if showData && indicators.hasData}<span
        role="img"
        aria-label={indicators.dataLabel}
        title={indicators.dataLabel}
        data-group-indicator>●</span
      >{/if}
  </span>
{/if}
