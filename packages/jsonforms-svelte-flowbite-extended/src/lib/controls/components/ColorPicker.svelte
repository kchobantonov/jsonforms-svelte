<script lang="ts">
  import { Button, Input, Select, Popover } from 'flowbite-svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import {
    ColorChannels,
    ColorSwatch,
    useColorPicker,
    ColorSpectrum,
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
</script>

{#snippet content()}
  <div class="grid max-h-[75vh] gap-3 overflow-auto p-1">
    <ColorSpectrum {value} {disabled} onchange={model.select} />
    <ColorChannels {model} errorClass="text-red-600 dark:text-red-400">
      {#snippet input(props)}
        <label class="grid min-w-0 gap-1 text-sm"
          ><span class="sr-only">{props.label}</span>
          <Input
            class="h-8 w-full min-w-0 px-1 text-xs"
            title={props.label}
            type={props.type}
            value={props.value}
            min={props.type === 'number' ? 0 : undefined}
            max={props.max}
            step={props.type === 'number' ? 1 : undefined}
            {disabled}
            aria-label={props.label}
            aria-invalid={!!model.problem}
            oninput={(event: Event) =>
              props.change((event.currentTarget as HTMLInputElement).value)}
          />
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
  {id}
  {disabled}
  {title}
  aria-label={label}
  aria-required={required || undefined}
  aria-invalid={invalid}
  color="alternative"
  class="pointer-events-auto h-full w-full p-0.5"
  data-color-trigger><ColorSwatch {value} /></Button
>
<Popover
  trigger="click"
  triggerDelay={0}
  transitionParams={{ duration: 0 }}
  arrow={false}
  placement="bottom-start"
  bind:isOpen={() => model.open, model.setOpen}
  class="pointer-events-auto w-80 max-w-[calc(100vw-2rem)]"
  >{#if model.open}{@render content()}{/if}</Popover
>
