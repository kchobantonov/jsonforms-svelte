<script lang="ts">
  import { TooltipContent } from '@chobantonov/jsonforms-svelte-skeleton';
  import { Popover, Portal, Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { getPortalTarget, getPortalRootNodeGetter } from '@chobantonov/jsonforms-svelte-skeleton';
  const getRootNode = getPortalRootNodeGetter();
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    ColorChannels,
    ColorSwatch,
    useColorPickerPopup,
    ColorSpectrum,
    type ColorPickerProps,
  } from '@chobantonov/jsonforms-svelte-extended';
  const props: ColorPickerProps = $props();
  const { id, value, disabled, clearable, title, onclear } = $derived(props);
  const message = useRendererMessages();
  const { model, popup, hint } = useColorPickerPopup(props, 80);
</script>

{#snippet content()}
  <div class="grid max-h-[75vh] gap-3 overflow-auto p-1">
    <ColorSpectrum {value} {disabled} onchange={model.select} />
    <ColorChannels {model} {disabled} errorClass="text-error-600-400">
      {#snippet input(props, attributes)}
        <label class="grid min-w-0 gap-1 text-sm"
          ><span class="sr-only">{props.label}</span>
          <input class="input h-8 w-full min-w-0 px-1 text-xs" {...attributes} />
        </label>
      {/snippet}
      {#snippet select(props)}<label class="grid gap-1 text-sm"
          ><span class="sr-only">{props.label}</span><select
            class="select h-8 w-full min-w-0 py-0 ps-1 text-xs"
            {disabled}
            value={props.value}
            aria-label={props.label}
            onchange={(event) => props.change(event.currentTarget.value)}
            >{#each props.choices as choice (choice.value)}<option value={choice.value}
                >{choice.label}</option
              >{/each}</select
          ></label
        >{/snippet}
    </ColorChannels>
    {#if clearable && value !== undefined && value !== ''}<button
        type="button"
        class="btn preset-tonal"
        {disabled}
        onclick={onclear}>{message('control.clearValue')}</button
      >{/if}
  </div>
{/snippet}
<Popover
  ids={{ trigger: id }}
  open={model.open}
  onOpenChange={(details) => model.setOpen(details.open)}
  {getRootNode}
  positioning={{ placement: popup.placement, strategy: 'fixed' }}
>
  <Tooltip
    open={hint.open}
    openDelay={0}
    {getRootNode}
    positioning={{ placement: 'top', strategy: 'fixed' }}
  >
    <Tooltip.Trigger>
      {#snippet element(triggerProps)}
        <Popover.Trigger
          {...triggerProps}
          {...hint.trigger}
          onpointerenter={hint.enter}
          onpointerleave={hint.leave}
          class="border-surface-400-600 rounded-base h-full w-full cursor-pointer border p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          data-color-trigger><ColorSwatch {value} /></Popover.Trigger
        >
      {/snippet}
    </Tooltip.Trigger>
    <TooltipContent
      target={getPortalTarget()}
      positionerClass="pointer-events-none"
      class="card preset-filled-surface-950-50 pointer-events-none px-3 py-2 text-sm shadow-xl"
      >{title}</TooltipContent
    >
  </Tooltip>
  <Portal target={getPortalTarget()}
    ><Popover.Positioner
      ><Popover.Content
        class="card preset-filled-surface-50-950 max-h-[var(--color-popup-max-height)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-y-contain border p-3 shadow-xl"
        style={`--color-popup-max-height: ${popup.maxHeight}px`}
        >{#if model.open}{@render content()}{/if}</Popover.Content
      ></Popover.Positioner
    ></Portal
  >
</Popover>
