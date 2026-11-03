<script lang="ts">
  import { Popover, Portal, Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
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
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  let hintDismissed = $state(false);
  const hintOpen = $derived((hintFocused || hintHovered) && !hintDismissed);
  const dismissHint = (event: KeyboardEvent) => {
    if (event.key === 'Escape') hintDismissed = true;
  };
  onMount(() => () => {
    clearTimeout(hoverTimer);
    window.removeEventListener('keydown', dismissHint, true);
  });
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
  positioning={{ placement: popupPlacement, strategy: 'fixed' }}
>
  <Tooltip
    open={hintOpen}
    openDelay={0}
    {getRootNode}
    positioning={{ placement: 'top', strategy: 'fixed' }}
  >
    <Tooltip.Trigger>
      {#snippet element(triggerProps)}
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
          onpointerenter={() => {
            clearTimeout(hoverTimer);
            hoverTimer = setTimeout(() => {
              hintHovered = true;
              hintDismissed = false;
            }, 80);
          }}
          onpointerdown={(event) => fitPopup(event.currentTarget as HTMLElement)}
          onpointerleave={() => {
            clearTimeout(hoverTimer);
            hintHovered = false;
          }}
          class="border-surface-400-600 rounded-base h-full w-full cursor-pointer border p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          data-color-trigger><ColorSwatch {value} /></Popover.Trigger
        >
      {/snippet}
    </Tooltip.Trigger>
    <Portal target={getPortalTarget()}>
      <Tooltip.Context>
        {#snippet children(tooltip)}
          <div {...tooltip().getPositionerProps()} class="pointer-events-none">
            <Tooltip.Content
              class="card preset-filled-surface-950-50 pointer-events-none px-3 py-2 text-sm shadow-xl"
              >{title}</Tooltip.Content
            >
          </div>
        {/snippet}
      </Tooltip.Context>
    </Portal>
  </Tooltip>
  <Portal target={getPortalTarget()}
    ><Popover.Positioner
      ><Popover.Content
        class="card preset-filled-surface-50-950 max-h-[var(--color-popup-max-height)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-y-contain border p-3 shadow-xl"
        style={`--color-popup-max-height: ${popupMaxHeight}px`}
        >{#if model.open}{@render content()}{/if}</Popover.Content
      ></Popover.Positioner
    ></Portal
  >
</Popover>
