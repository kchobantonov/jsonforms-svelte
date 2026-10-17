<script lang="ts">
  import { type ControlProps, useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import { useCron, CronPicker, DEFAULT_CRON } from '@chobantonov/jsonforms-svelte-extended';
  import { ControlWrapper, useFlowbiteControl } from '@chobantonov/jsonforms-svelte-flowbite';
  import CronSelect from './components/CronSelect.svelte';
  import { Input, Button, Popover } from 'flowbite-svelte';
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
      <label class="grid gap-1 text-sm"
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
  <div class="flex gap-1">
    <Input
      id={`${binding.control.id}-input`}
      class="min-w-0 flex-1"
      value={model.expression}
      disabled={model.disabled}
      aria-invalid={!!error}
      placeholder={binding.appliedOptions.placeholder ?? DEFAULT_CRON}
      oninput={(event: Event) => model.input((event.currentTarget as HTMLInputElement).value)}
      onfocus={binding.handleFocus}
      onblur={binding.handleBlur}
    /><Button
      id={triggerId}
      type="button"
      color="alternative"
      disabled={model.disabled}
      aria-label={message('cron.choose')}>{message('cron.choose')}</Button
    >
    <Popover
      trigger="click"
      triggerDelay={0}
      transitionParams={{ duration: 0 }}
      bind:isOpen={() => model.open, model.setOpen}
      arrow={false}
      placement="bottom-start"
      class="w-96 max-w-[calc(100vw-2rem)]"
      >{#if model.open}{@render picker()}{/if}</Popover
    >
    {#if binding.appliedOptions.clearable !== false && model.binding.control.data !== undefined}<Button
        type="button"
        color="alternative"
        disabled={model.disabled}
        aria-label={message('control.clearValue')}
        onclick={() => model.input('')}>×</Button
      >{/if}
  </div>
</ControlWrapper>
