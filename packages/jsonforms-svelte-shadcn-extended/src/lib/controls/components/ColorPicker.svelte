<script lang="ts">
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import * as Select from '@jsonforms-svelte-shadcn-ui/select';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { getPortalTarget } from '@chobantonov/jsonforms-svelte-shadcn';
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
    <ColorChannels {model} errorClass="text-destructive">
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
      {#snippet select(props)}<div class="grid gap-1 text-sm">
          <span class="sr-only">{props.label}</span><Select.Root
            type="single"
            value={props.value}
            onValueChange={props.change}
            {disabled}
            ><Select.Trigger class="h-8 w-full min-w-0 px-1 text-xs" aria-label={props.label}
              >{props.choices.find((choice) => choice.value === props.value)?.label}</Select.Trigger
            ><Select.Content portalProps={{ to: getPortalTarget() }}
              >{#each props.choices as choice (choice.value)}<Select.Item value={choice.value}
                  >{choice.label}</Select.Item
                >{/each}</Select.Content
            ></Select.Root
          >
        </div>{/snippet}
    </ColorChannels>
    {#if clearable && value !== undefined && value !== ''}<Button
        type="button"
        variant="ghost"
        {disabled}
        onclick={onclear}>{message('control.clearValue')}</Button
      >{/if}
  </div>
{/snippet}
<Popover.Root open={model.open} onOpenChange={model.setOpen}>
  <Popover.Trigger
    {id}
    {disabled}
    {title}
    aria-label={label}
    aria-required={required || undefined}
    aria-invalid={invalid}
    class="border-input bg-background focus-visible:ring-ring h-full w-full cursor-pointer rounded border p-0.5 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
    data-color-trigger><ColorSwatch {value} /></Popover.Trigger
  >
  <Popover.Content portalProps={{ to: getPortalTarget() }} class="w-80 max-w-[calc(100vw-2rem)]"
    >{@render content()}</Popover.Content
  >
</Popover.Root>
