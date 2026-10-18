<script lang="ts">
  import { ClockOutline as PickerIcon } from 'flowbite-svelte-icons';
  import { type ControlProps, useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import { useCron, CronPicker, DEFAULT_CRON } from '@chobantonov/jsonforms-svelte-extended';
  import { ControlWrapper, useFlowbiteControl } from '@chobantonov/jsonforms-svelte-flowbite';
  import CronSelect from './components/CronSelect.svelte';
  import { Input, Button, Popover, CloseButton } from 'flowbite-svelte';
  const props: ControlProps = $props();
  const model = useCron(props);
  const binding = useFlowbiteControl(model.binding);
  const message = useRendererMessages();
  const componentId = $props.id();
  const triggerId = `cron-${componentId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const error = $derived(
    binding.control.errors || (model.problem ? message(`cron.error.${model.problem}`) : ''),
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
  <div class="group/cron relative min-w-0" data-cron-input>
    <Input
      id={`${binding.control.id}-input`}
      class="w-full ps-10 pe-10"
      value={model.expression}
      disabled={model.disabled}
      aria-invalid={!!error}
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
      aria-label={message('cron.choose')}><PickerIcon class="size-4" aria-hidden="true" /></Button
    >
    <Popover
      trigger="click"
      triggerDelay={0}
      transitionParams={{ duration: 0 }}
      bind:isOpen={() => model.open, model.setOpen}
      arrow={false}
      placement="bottom-start"
      class="w-80 max-w-[calc(100vw-2rem)]"
      >{#if model.open}{@render picker()}{/if}</Popover
    >
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
      />{/if}
  </div>
</ControlWrapper>
