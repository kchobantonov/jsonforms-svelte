<script lang="ts">
  import { Button, Input, Select, Popover } from 'flowbite-svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    ColorChannels,
    ColorSwatch,
    useColorPickerPopup,
    ColorSpectrum,
    type ColorPickerProps,
  } from '@chobantonov/jsonforms-svelte-extended';
  const props: ColorPickerProps = $props();
  const { value, disabled, clearable, title, onclear } = $derived(props);
  const message = useRendererMessages();
  const { model, popup, hint } = useColorPickerPopup(props, 0, () => {
    model.setOpen(false);
    requestAnimationFrame(() => model.setOpen(false));
  });
</script>

{#snippet content()}
  <div class="grid max-h-[75vh] gap-3 overflow-auto p-1">
    <ColorSpectrum {value} {disabled} onchange={model.select} />
    <ColorChannels {model} {disabled} errorClass="text-red-600 dark:text-red-400">
      {#snippet input(props, attributes)}
        <label class="grid min-w-0 gap-1 text-sm"
          ><span class="sr-only">{props.label}</span>
          <Input class="h-8 w-full min-w-0 px-1 text-xs" {...attributes} />
        </label>
      {/snippet}
      {#snippet select(props)}<label class="grid gap-1 text-sm"
          ><span class="sr-only">{props.label}</span><Select
            class="h-8 w-full min-w-0 py-0 ps-1 text-xs"
            {disabled}
            value={props.value}
            placeholder=""
            items={props.choices.map((choice) => ({ value: choice.value, name: choice.label }))}
            aria-label={props.label}
            onchange={(event: Event) =>
              props.change((event.currentTarget as HTMLSelectElement).value)}
          /></label
        >{/snippet}
    </ColorChannels>
    {#if clearable && value !== undefined && value !== ''}<Button
        type="button"
        color="alternative"
        {disabled}
        onclick={onclear}>{message('control.clearValue')}</Button
      >{/if}
  </div>
{/snippet}
<Button
  {...hint.trigger}
  onmouseenter={hint.enter}
  onmouseleave={hint.leave}
  color="alternative"
  class="pointer-events-auto h-full w-full p-0.5"
  data-color-trigger><ColorSwatch {value} /></Button
>
<Popover
  trigger="click"
  triggerDelay={0}
  transitionParams={{ duration: 0 }}
  arrow={false}
  placement={popup.placement}
  bind:isOpen={() => model.open, model.setOpen}
  class="pointer-events-auto w-80 max-w-[calc(100vw-2rem)]"
  classes={{
    content: 'max-h-[var(--color-popup-max-height)] overflow-y-auto overscroll-y-contain',
  }}
  style={`--color-popup-max-height: ${popup.maxHeight}px`}
  >{#if model.open}{@render content()}{/if}</Popover
>
{#if hint.open}<span
    role="tooltip"
    class="pointer-events-none absolute start-0 bottom-full z-50 mb-2 max-w-[min(18rem,calc(100vw-2rem))] rounded-lg bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-700"
    >{title}</span
  >{/if}
