<script lang="ts">
  import TooltipClearButton from './TooltipClearButton.svelte';
  import { TooltipContent } from '@chobantonov/jsonforms-svelte-skeleton';
  import { usePopupPlacement } from '@chobantonov/jsonforms-svelte-extended';
  import { CalendarClock as PickerIcon, XIcon } from '@lucide/svelte';
  import {
    type ControlProps,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    useCron,
    useCronField,
    CronPickerFields,
    DEFAULT_CRON,
  } from '@chobantonov/jsonforms-svelte-extended';
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
  // The Tooltip and Popover each assign a trigger id. Forwarding the Tooltip
  // id to Popover.Trigger hides Popover's own anchor from its positioner.
  const withoutTooltipId = <T extends { id?: string | null }>(props: T): Omit<T, 'id'> => {
    const { id: _id, ...rest } = props;
    return rest;
  };
  const props: ControlProps = $props();
  const model = useCron(props);
  const binding = useSkeletonControl(model.binding);
  const message = useRendererMessages();
  let chooseFocused = $state(false);
  let chooseHovered = $state(false);
  let chooseDismissed = $state(false);
  const chooseTooltipOpen = $derived((chooseFocused || chooseHovered) && !chooseDismissed);
  const popup = usePopupPlacement(512);
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
  const dismissChooseTooltip = (event: KeyboardEvent) => {
    if (event.key === 'Escape') chooseDismissed = true;
  };
  onMount(() => () => window.removeEventListener('keydown', dismissChooseTooltip, true));

  const field = useCronField(
    model,
    binding,
    () => binding.skeletonProps('input')['aria-describedby'],
  );
  const { error, describedBy } = $derived(field);
</script>

{#snippet picker()}
  <CronPickerFields {model} {CronSelect}>
    {#snippet input(attributes)}<input class="input w-full pe-9" {...attributes} />{/snippet}
    {#snippet clear(label, attributes)}<button
        {...attributes}
        class="hover:preset-tonal rounded-base absolute inset-y-0 end-1 my-auto inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within/cron-expression:opacity-100 group-hover/cron-expression:opacity-100 focus:opacity-100"
        aria-label={label}><XIcon class="size-4" aria-hidden="true" /></button
      >{/snippet}
    {#snippet button(label, attributes)}<button {...attributes} class="btn preset-outlined"
        >{label}</button
      >{/snippet}
  </CronPickerFields>
{/snippet}
<ControlWrapper {...binding.controlWrapper} errors={error}>
  <Popover
    open={model.open}
    onOpenChange={(details) => model.setOpen(details.open)}
    {getRootNode}
    positioning={{ placement: popup.placement, strategy: 'fixed' }}
    ><div bind:this={cronRoot} class="group/cron relative min-w-0" data-cron-input>
      <input
        {...field.input}
        class="input w-full ps-10 pe-10"
        placeholder={binding.appliedOptions.placeholder ?? DEFAULT_CRON}
      /><Tooltip
        open={chooseTooltipOpen}
        openDelay={0}
        {getRootNode}
        positioning={{ placement: 'top', strategy: 'fixed' }}
      >
        <Tooltip.Trigger>
          {#snippet element(triggerProps)}
            <Popover.Trigger
              {...withoutTooltipId(triggerProps)}
              data-cron-choose
              disabled={model.disabled}
              title={message('cron.choose')}
              aria-label={message('cron.choose')}
              aria-describedby={describedBy}
              onfocus={(event) => {
                binding.handleFocus();
                popup.fit(event.currentTarget as HTMLElement);
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
              onpointerdown={(event) => popup.fit(event.currentTarget as HTMLElement)}
              class="hover:preset-tonal rounded-base absolute inset-y-0 start-1 my-auto inline-flex size-7 items-center justify-center"
              ><PickerIcon class="size-4" aria-hidden="true" /></Popover.Trigger
            >
          {/snippet}
        </Tooltip.Trigger>
        <TooltipContent target={resolvePortalTarget() ?? undefined}
          >{message('cron.choose')}</TooltipContent
        >
      </Tooltip>{#if binding.clearable && model.expression !== ''}<TooltipClearButton
          class="hover:preset-tonal rounded-base text-surface-600-400 invisible absolute inset-y-0 end-1 my-auto inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within/cron:visible group-focus-within/cron:opacity-100 group-hover/cron:visible group-hover/cron:opacity-100"
          data-cron-clear
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          disabled={model.disabled}
          label={message('control.clearValue')}
          onclick={() => model.input('')}
          hideIcon
        />{/if}
    </div>
    <Portal target={getPortalTarget()}
      ><Popover.Positioner
        ><Popover.Content
          class="card preset-filled-surface-50-950 max-h-[var(--cron-popup-max-height)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-y-contain border p-3 shadow-xl"
          style={`--cron-popup-max-height: ${popup.maxHeight}px`}
          >{@render picker()}</Popover.Content
        ></Popover.Positioner
      ></Portal
    ></Popover
  >
</ControlWrapper>
