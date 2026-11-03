<script lang="ts">
  import { CalendarClock as PickerIcon, XIcon } from '@lucide/svelte';
  import { type ControlProps, useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import { useCron, CronPicker, DEFAULT_CRON } from '@chobantonov/jsonforms-svelte-extended';
  import {
    ControlWrapper,
    useSkeletonControl,
    getPortalTarget,
    getPortalTargetResolver,
    getPortalRootNodeGetter,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import CronSelect from './components/CronSelect.svelte';
  import { Popover, Portal, Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  const props: ControlProps = $props();
  const model = useCron(props);
  const binding = useSkeletonControl(model.binding);
  const message = useRendererMessages();
  let clearFocused = $state(false);
  let clearHovered = $state(false);
  let clearDismissed = $state(false);
  let chooseFocused = $state(false);
  let chooseHovered = $state(false);
  let chooseDismissed = $state(false);
  const chooseTooltipOpen = $derived((chooseFocused || chooseHovered) && !chooseDismissed);
  let popupPlacement = $state<'top-start' | 'bottom-start'>('bottom-start');
  let popupMaxHeight = $state(512);
  let cronRoot: HTMLDivElement;
  function restoreChooseFocusOnEscape(event: KeyboardEvent) {
    if (
      event.key !== 'Escape' ||
      !event
        .composedPath()
        .some((node) => node instanceof HTMLElement && node.hasAttribute('data-cron-picker'))
    )
      return;
    setTimeout(() => {
      requestAnimationFrame(() => {
        if (!model.open) cronRoot?.querySelector<HTMLButtonElement>('[data-cron-choose]')?.focus();
      });
    }, 0);
  }
  $effect(() => {
    if (!model.open) return;
    const view = cronRoot?.ownerDocument.defaultView;
    view?.addEventListener('keydown', restoreChooseFocusOnEscape, true);
    return () => view?.removeEventListener('keydown', restoreChooseFocusOnEscape, true);
  });
  function fitPopup(trigger: HTMLElement) {
    const view = trigger.ownerDocument.defaultView;
    if (!view) return;
    const bounds = trigger.getBoundingClientRect();
    const above = bounds.top - 12;
    const below = view.innerHeight - bounds.bottom - 12;
    popupPlacement = above > below ? 'top-start' : 'bottom-start';
    popupMaxHeight = Math.max(64, Math.min(512, Math.max(above, below) - 16));
  }
  const dismissChooseTooltip = (event: KeyboardEvent) => {
    if (event.key === 'Escape') chooseDismissed = true;
  };
  onMount(() => () => window.removeEventListener('keydown', dismissChooseTooltip, true));
  const clearTooltipOpen = $derived((clearFocused || clearHovered) && !clearDismissed);
  const dismissClearTooltip = (event: KeyboardEvent) => {
    if (event.key === 'Escape') clearDismissed = true;
  };
  onMount(() => () => window.removeEventListener('keydown', dismissClearTooltip, true));

  const error = $derived(
    binding.control.errors || (model.problem ? message(`cron.error.${model.problem}`) : ''),
  );
  const describedBy = $derived(
    [
      binding.skeletonProps('input')['aria-describedby'],
      !binding.appliedOptions.hideControlWrapper &&
      (error ||
        (binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)))
        ? `${binding.control.id}-help`
        : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined,
  );
</script>

{#snippet picker()}
  <CronPicker {model}>
    {#snippet select(props)}<CronSelect {...props} disabled={model.disabled} />{/snippet}
    {#snippet input(props)}
      <label class="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2 text-sm"
        >{props.label}<input
          class="input w-full"
          value={props.value}
          aria-label={props.label}
          aria-invalid={props.invalid}
          disabled={model.disabled}
          oninput={(event: Event) => props.change((event.currentTarget as HTMLInputElement).value)}
        /></label
      >
    {/snippet}
    {#snippet button(props)}<button
        type="button"
        class="btn preset-outlined"
        disabled={model.disabled || props.disabled}
        onclick={props.click}>{props.label}</button
      >{/snippet}
  </CronPicker>
{/snippet}
<ControlWrapper {...binding.controlWrapper} errors={error}>
  <Popover
    open={model.open}
    onOpenChange={(details) => model.setOpen(details.open)}
    {getRootNode}
    positioning={{ placement: popupPlacement, strategy: 'fixed' }}
    ><div bind:this={cronRoot} class="group/cron relative min-w-0" data-cron-input>
      <!-- The authored focus option intentionally targets this control on mount. -->
      <!-- svelte-ignore a11y_autofocus -->
      <input
        id={`${binding.control.id}-input`}
        class="input w-full ps-10 pe-10"
        value={model.expression}
        disabled={model.disabled}
        autofocus={binding.initialFocus}
        required={binding.control.required}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        placeholder={binding.appliedOptions.placeholder ?? DEFAULT_CRON}
        oninput={(event: Event) => model.input((event.currentTarget as HTMLInputElement).value)}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
      /><Tooltip
        open={chooseTooltipOpen}
        openDelay={0}
        {getRootNode}
        positioning={{ placement: 'top', strategy: 'fixed' }}
      >
        <Tooltip.Trigger>
          {#snippet element(triggerProps)}
            <Popover.Trigger
              {...triggerProps}
              data-cron-choose
              disabled={model.disabled}
              title={message('cron.choose')}
              aria-label={message('cron.choose')}
              aria-describedby={describedBy}
              onfocus={(event) => {
                binding.handleFocus();
                fitPopup(event.currentTarget as HTMLElement);
                chooseFocused = true;
                chooseDismissed = false;
                window.addEventListener('keydown', dismissChooseTooltip, true);
              }}
              onblur={() => {
                binding.handleBlur();
                chooseFocused = false;
                window.removeEventListener('keydown', dismissChooseTooltip, true);
              }}
              onpointerenter={() => {
                chooseHovered = true;
                chooseDismissed = false;
              }}
              onpointerleave={() => (chooseHovered = false)}
              onpointerdown={(event) => fitPopup(event.currentTarget as HTMLElement)}
              class="hover:preset-tonal rounded-base absolute inset-y-0 start-1 my-auto inline-flex size-7 items-center justify-center"
              ><PickerIcon class="size-4" aria-hidden="true" /></Popover.Trigger
            >
          {/snippet}
        </Tooltip.Trigger>
        <Portal target={resolvePortalTarget() ?? undefined}>
          <Tooltip.Context>
            {#snippet children(tooltip)}
              <div {...tooltip().getPositionerProps()}>
                <Tooltip.Content
                  class="card preset-filled-surface-950-50 px-3 py-2 text-sm shadow-xl"
                  >{message('cron.choose')}</Tooltip.Content
                >
              </div>
            {/snippet}
          </Tooltip.Context>
        </Portal>
      </Tooltip>{#if binding.clearable && model.expression !== ''}<Tooltip
          open={clearTooltipOpen}
          openDelay={0}
          {getRootNode}
          positioning={{ placement: 'top', strategy: 'fixed' }}
        >
          <Tooltip.Trigger>
            {#snippet element(triggerProps)}
              <button
                {...triggerProps}
                type="button"
                class="hover:preset-tonal rounded-base text-surface-600-400 invisible absolute inset-y-0 end-1 my-auto inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within/cron:visible group-focus-within/cron:opacity-100 group-hover/cron:visible group-hover/cron:opacity-100"
                data-cron-clear
                onmousedown={(event: MouseEvent) => event.preventDefault()}
                disabled={model.disabled}
                aria-label={message('control.clearValue')}
                onclick={() => model.input('')}
                onfocus={() => {
                  clearFocused = true;
                  clearDismissed = false;
                  window.addEventListener('keydown', dismissClearTooltip, true);
                }}
                onblur={() => {
                  clearFocused = false;
                  window.removeEventListener('keydown', dismissClearTooltip, true);
                }}
                onpointerenter={() => {
                  clearHovered = true;
                  clearDismissed = false;
                }}
                onpointerleave={() => (clearHovered = false)}
                ><XIcon class="size-4" aria-hidden="true" /></button
              >
            {/snippet}
          </Tooltip.Trigger>
          <Portal target={resolvePortalTarget() ?? undefined}>
            <Tooltip.Context>
              {#snippet children(tooltip)}
                <div {...tooltip().getPositionerProps()}>
                  <Tooltip.Content
                    class="card preset-filled-surface-950-50 px-3 py-2 text-sm shadow-xl"
                    >{message('control.clearValue')}</Tooltip.Content
                  >
                </div>
              {/snippet}
            </Tooltip.Context>
          </Portal>
        </Tooltip>{/if}
    </div>
    <Portal target={getPortalTarget()}
      ><Popover.Positioner
        ><Popover.Content
          class="card preset-filled-surface-50-950 max-h-[var(--cron-popup-max-height)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-y-contain border p-3 shadow-xl"
          style={`--cron-popup-max-height: ${popupMaxHeight}px`}>{@render picker()}</Popover.Content
        ></Popover.Positioner
      ></Portal
    ></Popover
  >
</ControlWrapper>
