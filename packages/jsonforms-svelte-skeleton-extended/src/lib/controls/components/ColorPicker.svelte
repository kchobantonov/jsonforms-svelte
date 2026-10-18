<script lang="ts">
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import { getPortalTarget, getPortalRootNodeGetter } from '@chobantonov/jsonforms-svelte-skeleton';
  const getRootNode = getPortalRootNodeGetter();
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
    <ColorChannels {model} errorClass="text-error-600-400">
      {#snippet input(props)}
        <label class="grid min-w-0 gap-1 text-sm"
          ><span class="sr-only">{props.label}</span>
          <input
            class="input h-8 w-full min-w-0 px-1 text-xs"
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
  positioning={{ placement: 'bottom-start' }}
>
  <Popover.Trigger
    {disabled}
    {title}
    aria-label={label}
    aria-required={required || undefined}
    aria-invalid={invalid}
    class="border-surface-400-600 rounded-base h-full w-full cursor-pointer border p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
    data-color-trigger><ColorSwatch {value} /></Popover.Trigger
  >
  <Portal target={getPortalTarget()}
    ><Popover.Positioner
      ><Popover.Content
        class="card preset-filled-surface-50-950 w-80 max-w-[calc(100vw-2rem)] border p-3 shadow-xl"
        >{#if model.open}{@render content()}{/if}</Popover.Content
      ></Popover.Positioner
    ></Portal
  >
</Popover>
