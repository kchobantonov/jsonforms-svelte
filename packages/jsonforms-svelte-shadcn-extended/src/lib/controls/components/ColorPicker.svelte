<script lang="ts">
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  import * as ExtrasColorPicker from '@jsonforms-svelte-shadcn-ui/color-picker';
  import {
    parseColor as parseExtrasColor,
    hsvaToRgba,
  } from '@jsonforms-svelte-shadcn-ui/color-picker/color';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { getPortalTarget } from '@chobantonov/jsonforms-svelte-shadcn';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import { untrack } from 'svelte';
  import {
    ColorSwatch,
    useColorPicker,
    parseColor,
    serializeColor,
    type ColorSaveFormat,
  } from '@chobantonov/jsonforms-svelte-extended';
  let {
    id,
    value,
    format,
    disabled,
    clearable,
    label,
    title,
    required,
    invalid,
    describedBy,
    onfocus,
    onblur,
    onchange,
    onclear,
  }: {
    id: string;
    value: unknown;
    format: ColorSaveFormat;
    disabled: boolean;
    clearable: boolean;
    label: string;
    title: string;
    required?: boolean;
    invalid: boolean;
    describedBy?: string;
    onfocus?: () => void;
    onblur?: () => void;
    onchange(value: string): void;
    onclear(): void;
  } = $props();
  const message = useRendererMessages();
  const model = useColorPicker({
    get identity() {
      return id;
    },
    get value() {
      return value;
    },
    get format() {
      return format;
    },
    get enabled() {
      return !disabled;
    },
    change: (value) => onchange(value),
  });
  const initialPickerValue = () =>
    value == null || value === ''
      ? ''
      : typeof value === 'string' && parseColor(value)
        ? value
        : '#000000';
  const initialPickerFormat = (): 'hex' | 'rgb' | 'hsb' => (format === 'hex3' ? 'hex' : format);
  let pickerValue = $state(initialPickerValue());
  let pickerFormat = $state(untrack(initialPickerFormat));
  let armed = false;
  let lastPickerValue = untrack(() => pickerValue);
  let lastExternal = untrack(() => value);
  let lastCommitted: string | undefined;
  $effect(() => {
    if (value !== lastExternal && value !== lastCommitted) {
      armed = false;
      pickerValue = initialPickerValue();
    }
    lastExternal = value;
  });
  $effect(() => {
    const next = pickerValue;
    if (next === lastPickerValue) return;
    lastPickerValue = next;
    if (!armed || disabled) return;
    const picked = parseExtrasColor(next);
    const rgba = picked && hsvaToRgba(picked);
    const saved =
      rgba &&
      serializeColor(
        { r: Math.round(rgba.r), g: Math.round(rgba.g), b: Math.round(rgba.b), a: rgba.a },
        format,
      );
    if (!saved) return;
    const current = parseColor(value);
    if (current && serializeColor(current, format) === saved) return;
    lastCommitted = saved;
    onchange(saved);
  });
  function setOpen(next: boolean) {
    if (next) {
      armed = false;
      pickerValue = initialPickerValue();
      pickerFormat = initialPickerFormat();
    }
    model.setOpen(next);
  }
  function clearPicker() {
    armed = false;
    pickerValue = '';
    lastPickerValue = '';
    lastCommitted = undefined;
    onclear();
  }
</script>

{#snippet content()}
  <div class="grid max-h-[75vh] gap-3 overflow-auto p-1">
    <ExtrasColorPicker.Root
      bind:value={pickerValue}
      bind:format={pickerFormat}
      {disabled}
      class="w-full"
      onpointerdown={() => (armed = true)}
      onkeydown={() => (armed = true)}
      oninput={() => (armed = true)}
    >
      <ExtrasColorPicker.Area />
      <ExtrasColorPicker.HueSlider thumbLabel={message('color.hsb.h')} />
      {#if format !== 'hex3'}<ExtrasColorPicker.AlphaSlider />{/if}
      <div
        class="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)_3.5rem] items-end gap-1"
        data-color-channels
      >
        <ExtrasColorPicker.FormatSelect
          formats={['hex', 'rgb', 'hsb']}
          aria-label={message('color.channelView')}
          portalTarget={getPortalTarget()}
        />
        <div class="grid min-w-0 grid-cols-3 gap-1">
          {#if pickerFormat === 'hex'}
            <ExtrasColorPicker.Input
              class="col-span-3 min-w-0 px-1"
              aria-label={message('color.hex')}
            />
          {:else}
            <ExtrasColorPicker.ChannelInputs
              class="min-w-0 px-1"
              getLabel={(channel) =>
                message(
                  pickerFormat === 'rgb'
                    ? `color.rgb.${({ red: 'r', green: 'g', blue: 'b' } as Record<string, string>)[channel]}`
                    : `color.hsb.${({ hue: 'h', saturation: 's', brightness: 'b' } as Record<string, string>)[channel]}`,
                )}
            />
          {/if}
        </div>
        {#if format !== 'hex3'}
          <ExtrasColorPicker.AlphaInput class="min-w-0 px-1" aria-label={message('color.alpha')} />
        {/if}
      </div>
    </ExtrasColorPicker.Root>
    {#if clearable && value !== undefined && value !== ''}<Button
        type="button"
        variant="ghost"
        {disabled}
        onclick={clearPicker}>{message('control.clearValue')}</Button
      >{/if}
  </div>
{/snippet}
<Popover.Root open={model.open} onOpenChange={setOpen}>
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props: triggerProps })}
          <Popover.Trigger
            {...triggerProps}
            {id}
            {disabled}
            {title}
            aria-label={label}
            aria-required={required || undefined}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            onfocus={(event) => {
              if (typeof triggerProps.onfocus === 'function') triggerProps.onfocus(event);
              onfocus?.();
            }}
            onblur={(event) => {
              if (typeof triggerProps.onblur === 'function') triggerProps.onblur(event);
              onblur?.();
            }}
            class="border-input bg-background focus-visible:ring-ring h-full w-full cursor-pointer rounded border p-0.5 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            data-color-trigger><ColorSwatch {value} /></Popover.Trigger
          >
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content portalProps={{ to: getPortalTarget() }}>{title}</Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
  <Popover.Content
    portalProps={{ to: getPortalTarget() }}
    class="max-h-[min(32rem,var(--bits-popover-content-available-height,32rem),calc(100dvh-2rem))] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-y-contain"
    >{@render content()}</Popover.Content
  >
</Popover.Root>
