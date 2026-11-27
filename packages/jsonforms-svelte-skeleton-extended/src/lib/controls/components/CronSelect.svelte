<script lang="ts">
  import { CronPeriodSelect, type CronSelectProps } from '@chobantonov/jsonforms-svelte-extended';
  import { TooltipContent } from '@chobantonov/jsonforms-svelte-skeleton';
  import { Combobox, Portal, Tooltip, useListCollection } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
  import { getPortalTarget, getPortalRootNodeGetter } from '@chobantonov/jsonforms-svelte-skeleton';
  import { XIcon } from '@lucide/svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte-renderer-common';
  const message = useRendererMessages();
  let { label, values, choices, multiple, change, disabled }: CronSelectProps = $props();
  const getRootNode = getPortalRootNodeGetter();
  let clearFocused = $state(false);
  let clearHovered = $state(false);
  let clearDismissed = $state(false);
  let clearHoverTimer: ReturnType<typeof setTimeout> | undefined;
  const clearHintOpen = $derived((clearFocused || clearHovered) && !clearDismissed);
  const dismissClearHint = (event: KeyboardEvent) => {
    if (
      event.key === 'Escape' &&
      clearFocused &&
      clearHintOpen &&
      event
        .composedPath()
        .some((node) => node instanceof Element && node.matches('[data-cron-reset]'))
    ) {
      clearDismissed = true;
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };
  onMount(() => () => {
    clearTimeout(clearHoverTimer);
    window.removeEventListener('keydown', dismissClearHint, true);
  });
  const collection = $derived(
    useListCollection({
      items: choices,
      itemToValue: (item) => item.value,
      itemToString: (item) => item.label,
    }),
  );
</script>

<div class="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] items-center gap-2">
  <span class="text-sm">{label}</span>
  {#if multiple}
    <Combobox
      {collection}
      {getRootNode}
      multiple
      value={values}
      {disabled}
      closeOnSelect={false}
      inputValue={choices
        .filter((choice) => values.includes(choice.value))
        .map((choice) => choice.label)
        .join(', ')}
      onValueChange={(details) => {
        if (!disabled) change(details.value);
      }}
      translations={{
        triggerLabel: label,
        clearTriggerLabel: `${message('cron.every')}: ${label}`,
      }}
    >
      <Combobox.Control class="group/cron-choice relative min-w-0">
        <Combobox.Input
          class="input h-8 min-w-0 pe-14 text-sm"
          readonly
          aria-label={label}
          placeholder={message('cron.every')}
        />
        {#if values.length}
          <!-- Keep the reset hint's Escape inside this nested Combobox action. -->
          <span
            class="contents"
            onkeydowncapture={(event) => {
              if (event.key === 'Escape' && clearHintOpen) {
                clearDismissed = true;
                event.stopPropagation();
              }
            }}
            ><Tooltip
              open={clearHintOpen}
              openDelay={0}
              {getRootNode}
              positioning={{ placement: 'top', strategy: 'fixed' }}
            >
              <Tooltip.Trigger>
                {#snippet element(triggerProps)}
                  <Combobox.ClearTrigger
                    {...triggerProps}
                    tabindex={0}
                    class="absolute end-7 top-0 inline-flex size-8 items-center justify-center opacity-0 transition-opacity group-focus-within/cron-choice:opacity-100 group-hover/cron-choice:opacity-100 focus:opacity-100"
                    aria-label={`${message('cron.every')}: ${label}`}
                    title={`${message('cron.every')}: ${label}`}
                    data-cron-reset
                    onfocus={() => {
                      clearFocused = true;
                      clearDismissed = false;
                      window.addEventListener('keydown', dismissClearHint, true);
                    }}
                    onblur={() => {
                      clearFocused = false;
                      window.removeEventListener('keydown', dismissClearHint, true);
                    }}
                    onpointerenter={() => {
                      clearTimeout(clearHoverTimer);
                      clearHoverTimer = setTimeout(() => {
                        clearHovered = true;
                        clearDismissed = false;
                      }, 80);
                    }}
                    onpointerleave={() => {
                      clearTimeout(clearHoverTimer);
                      clearHovered = false;
                    }}
                  >
                    <XIcon class="size-3" />
                  </Combobox.ClearTrigger>
                {/snippet}
              </Tooltip.Trigger>
              <TooltipContent
                target={getPortalTarget()}
                positionerClass="pointer-events-none"
                class="card preset-filled-surface-950-50 pointer-events-none px-3 py-2 text-sm shadow-xl"
                >{`${message('cron.every')}: ${label}`}</TooltipContent
              >
            </Tooltip></span
          >{/if}
        <Combobox.Trigger />
      </Combobox.Control>
      <Portal target={getPortalTarget()}
        ><Combobox.Positioner
          ><Combobox.Content
            class="max-h-[min(20rem,var(--available-height,20rem),calc(100dvh-2rem))] overflow-y-auto"
          >
            {#each choices as item (item.value)}<Combobox.Item {item}>
                <Combobox.ItemText>{item.label}</Combobox.ItemText><Combobox.ItemIndicator />
              </Combobox.Item>{/each}
          </Combobox.Content></Combobox.Positioner
        ></Portal
      >
    </Combobox>
  {:else}
    <CronPeriodSelect {label} {values} {choices} {disabled} {change}>
      {#snippet select(attributes, options)}<select
          class="select h-8 w-full text-sm"
          {...attributes}>{@render options()}</select
        >{/snippet}
    </CronPeriodSelect>
  {/if}
</div>
