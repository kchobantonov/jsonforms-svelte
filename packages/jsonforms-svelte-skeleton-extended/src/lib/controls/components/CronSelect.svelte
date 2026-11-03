<script lang="ts">
  import { Combobox, Portal, Tooltip, useListCollection } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
  import { getPortalTarget, getPortalRootNodeGetter } from '@chobantonov/jsonforms-svelte-skeleton';
  import { XIcon } from '@lucide/svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  let {
    label,
    values,
    choices,
    multiple,
    change,
    disabled,
  }: {
    label: string;
    values: string[];
    choices: { value: string; label: string }[];
    multiple: boolean;
    change: (values: string[]) => void;
    disabled: boolean;
  } = $props();
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
      <Combobox.Control class="relative min-w-0">
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
                    class="absolute end-7 top-0 inline-flex size-8 items-center justify-center"
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
              <Portal target={getPortalTarget()}>
                <Tooltip.Context>
                  {#snippet children(tooltip)}
                    <div {...tooltip().getPositionerProps()} class="pointer-events-none">
                      <Tooltip.Content
                        class="card preset-filled-surface-950-50 pointer-events-none px-3 py-2 text-sm shadow-xl"
                        >{`${message('cron.every')}: ${label}`}</Tooltip.Content
                      >
                    </div>
                  {/snippet}
                </Tooltip.Context>
              </Portal>
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
    <select
      class="select h-8 w-full text-sm"
      aria-label={label}
      {disabled}
      value={values[0] ?? ''}
      onchange={(event) => change([event.currentTarget.value])}
    >
      <option value="" disabled>{message('cron.chooseRepeats')}</option>
      {#each choices as choice (choice.value)}<option value={choice.value}>{choice.label}</option
        >{/each}
    </select>
  {/if}
</div>
