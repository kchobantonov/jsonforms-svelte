<script lang="ts">
  import { ClockOutline as PickerIcon } from 'flowbite-svelte-icons';
  import { type ControlProps, useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import { useCron, CronPicker, DEFAULT_CRON } from '@chobantonov/jsonforms-svelte-extended';
  import { ControlWrapper, useFlowbiteControl } from '@chobantonov/jsonforms-svelte-flowbite';
  import CronSelect from './components/CronSelect.svelte';
  import { Input, Button, Popover, CloseButton, Tooltip } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  const props: ControlProps = $props();
  const model = useCron(props);
  const binding = useFlowbiteControl(model.binding);
  const message = useRendererMessages();
  const componentId = $props.id();
  const triggerId = `cron-${componentId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  let chooseFocused = $state(false);
  let chooseHovered = $state(false);
  let chooseDismissed = $state(false);
  const chooseHintOpen = $derived((chooseFocused || chooseHovered) && !chooseDismissed);
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
  const dismissChooseHint = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      chooseDismissed = true;
      model.setOpen(false);
      requestAnimationFrame(() => model.setOpen(false));
    }
  };
  onMount(() => () => window.removeEventListener('keydown', dismissChooseHint, true));
  const error = $derived(
    binding.control.errors || (model.problem ? message(`cron.error.${model.problem}`) : ''),
  );
  const describedBy = $derived(
    [
      binding.flowbiteProps('Input')['aria-describedby'],
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
        >{props.label}<Input
          class="w-full"
          bind:value={() => props.value, (value) => props.change(String(value ?? ''))}
          aria-label={props.label}
          aria-invalid={props.invalid}
          disabled={model.disabled}
        /></label
      >
    {/snippet}
    {#snippet button(props)}<Button
        type="button"
        color="alternative"
        disabled={model.disabled || props.disabled}
        onclick={props.click}>{props.label}</Button
      >{/snippet}
  </CronPicker>
{/snippet}
<ControlWrapper {...binding.controlWrapper} errors={error}>
  <div class="group/cron relative min-w-0" class:z-50={model.open} data-cron-input>
    <Input
      id={`${binding.control.id}-input`}
      class="w-full ps-10 pe-10"
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
    /><Button
      id={triggerId}
      class="absolute inset-y-0 start-1 my-auto size-8 p-0"
      type="button"
      color="alternative"
      disabled={model.disabled}
      title={message('cron.choose')}
      aria-label={message('cron.choose')}
      aria-describedby={describedBy}
      onfocus={(event: FocusEvent) => {
        binding.handleFocus();
        fitPopup(event.currentTarget as HTMLElement);
        chooseFocused = true;
        chooseDismissed = false;
        window.addEventListener('keydown', dismissChooseHint, true);
      }}
      onblur={() => {
        binding.handleBlur();
        chooseFocused = false;
        window.removeEventListener('keydown', dismissChooseHint, true);
      }}
      onmouseenter={() => {
        chooseHovered = true;
        chooseDismissed = false;
      }}
      onmouseleave={() => (chooseHovered = false)}
      onpointerdown={(event: PointerEvent) => fitPopup(event.currentTarget as HTMLElement)}
      ><PickerIcon class="size-4" aria-hidden="true" /></Button
    >
    <Popover
      trigger="click"
      triggerDelay={0}
      transitionParams={{ duration: 0 }}
      bind:isOpen={() => model.open, model.setOpen}
      arrow={false}
      strategy="fixed"
      placement={popupPlacement}
      class="w-80 max-w-[calc(100vw-2rem)]"
      classes={{
        content: 'max-h-[var(--cron-popup-max-height)] overflow-y-auto overscroll-y-contain',
      }}
      style={`--cron-popup-max-height: ${popupMaxHeight}px`}
      >{#if model.open}{@render picker()}{/if}</Popover
    >
    {#if chooseHintOpen}<span
        role="tooltip"
        class="pointer-events-none absolute start-1 bottom-full z-50 mb-2 max-w-[min(18rem,calc(100vw-2rem))] rounded-lg bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-700"
        >{message('cron.choose')}</span
      >{/if}
    {#if binding.clearable && model.expression !== ''}<CloseButton
        type="button"
        class="invisible absolute inset-y-0 end-1 my-auto size-7 p-0 group-focus-within/cron:visible group-hover/cron:visible"
        data-cron-clear
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        color="none"
        disabled={model.disabled}
        ariaLabel={message('control.clearValue')}
        name={message('control.clearValue')}
        onclick={() => model.input('')}
      /><Tooltip>{message('control.clearValue')}</Tooltip>{/if}
  </div>
</ControlWrapper>
