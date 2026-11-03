<script lang="ts">
  import { Button, Input, Select, Popover } from 'flowbite-svelte';
  import { onMount } from 'svelte';
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
  let hintFocused = $state(false);
  let hintHovered = $state(false);
  let hintDismissed = $state(false);
  const hintOpen = $derived((hintFocused || hintHovered) && !hintDismissed);
  const dismissHint = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      hintDismissed = true;
      model.setOpen(false);
      requestAnimationFrame(() => model.setOpen(false));
    }
  };
  onMount(() => () => window.removeEventListener('keydown', dismissHint, true));
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
  let popupPlacement = $state<'top-start' | 'bottom-start'>('bottom-start');
  let popupMaxHeight = $state(512);
  function fitPopup(trigger: HTMLElement) {
    const view = trigger.ownerDocument.defaultView;
    if (!view) return;
    const bounds = trigger.getBoundingClientRect();
    const above = bounds.top - 12;
    const below = view.innerHeight - bounds.bottom - 12;
    popupPlacement = above > below ? 'top-start' : 'bottom-start';
    popupMaxHeight = Math.max(64, Math.min(512, Math.max(above, below) - 16));
  }
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
  aria-describedby={describedBy}
  onfocus={(event: FocusEvent) => {
    onfocus?.();
    fitPopup(event.currentTarget as HTMLElement);
    hintFocused = true;
    hintDismissed = false;
    window.addEventListener('keydown', dismissHint, true);
  }}
  onblur={() => {
    onblur?.();
    hintFocused = false;
    window.removeEventListener('keydown', dismissHint, true);
  }}
  onmouseenter={() => {
    hintHovered = true;
    hintDismissed = false;
  }}
  onmouseleave={() => (hintHovered = false)}
  onpointerdown={(event: PointerEvent) => fitPopup(event.currentTarget as HTMLElement)}
  color="alternative"
  class="pointer-events-auto h-full w-full p-0.5"
  data-color-trigger><ColorSwatch {value} /></Button
>
<Popover
  trigger="click"
  triggerDelay={0}
  transitionParams={{ duration: 0 }}
  arrow={false}
  placement={popupPlacement}
  bind:isOpen={() => model.open, model.setOpen}
  class="pointer-events-auto w-80 max-w-[calc(100vw-2rem)]"
  classes={{
    content: 'max-h-[var(--color-popup-max-height)] overflow-y-auto overscroll-y-contain',
  }}
  style={`--color-popup-max-height: ${popupMaxHeight}px`}
  >{#if model.open}{@render content()}{/if}</Popover
>
{#if hintOpen}<span
    role="tooltip"
    class="pointer-events-none absolute start-0 bottom-full z-50 mb-2 max-w-[min(18rem,calc(100vw-2rem))] rounded-lg bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-700"
    >{title}</span
  >{/if}
