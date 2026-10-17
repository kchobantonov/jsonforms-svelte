<script lang="ts">
  import { useSectionIndicators } from '@chobantonov/jsonforms-svelte';
  import type { UISchemaElement } from '@jsonforms/core';
  import { ExclamationCircleOutline as CircleAlert } from 'flowbite-svelte-icons';
  import { Tooltip } from 'flowbite-svelte';
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
  let dismissed = $state(false);
  function reveal(event: MouseEvent) {
    event.stopPropagation();
    dismissed = false;
    open = true;
  }
  function keydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      dismissed = event.key === 'Escape';
      open = !dismissed;
    }
  }
</script>

{#if showValidation || (showData && indicators.hasData)}
  <span class={`inline-flex shrink-0 items-center gap-1 ${className}`}>
    {#if showValidation}
      <!-- The focusable status icon opens a tooltip without adding a nested button to the section header. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
      <span
        role="img"
        tabindex="0"
        onfocusin={() => (dismissed = false)}
        onmouseenter={() => (dismissed = false)}
        onclick={reveal}
        onkeydown={keydown}
        aria-label={validationLabel}
        class="text-red-500 dark:text-red-400"
        data-object-own-errors={errorMessage !== undefined && errorSource === 'object'
          ? true
          : undefined}
        data-additional-property-errors={errorMessage !== undefined &&
        errorSource === 'additionalProperties'
          ? true
          : undefined}
        data-container-validation-indicator={errorMessage === undefined ? true : undefined}
        data-error-count={errorMessage === undefined ? indicators.validation.count : undefined}
        ><CircleAlert size="sm" aria-hidden="true" /></span
      >
      <Tooltip
        bind:isOpen={() => open && !dismissed, (value) => (open = value && !dismissed)}
        triggerDelay={0}
        transitionParams={{ duration: 0 }}
        strategy="fixed"
        class="m-0 w-max max-w-sm whitespace-pre-line">{validationLabel}</Tooltip
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
