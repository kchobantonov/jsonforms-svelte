<script lang="ts">
  import { type ControlProps, useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import { useCron, CronPicker, DEFAULT_CRON } from '@chobantonov/jsonforms-svelte-extended';
  import {
    ControlWrapper,
    useShadcnControl,
    getPortalTarget,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import CronSelect from './components/CronSelect.svelte';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  const props: ControlProps = $props();
  const model = useCron(props);
  const binding = useShadcnControl(model.binding);
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
          value={props.value}
          aria-label={props.label}
          aria-invalid={props.invalid}
          disabled={model.disabled}
          oninput={(event: Event) => props.change((event.currentTarget as HTMLInputElement).value)}
        /></label
      >
    {/snippet}
    {#snippet button(props)}<Button
        type="button"
        variant="outline"
        disabled={model.disabled || props.disabled}
        onclick={props.click}>{props.label}</Button
      >{/snippet}
  </CronPicker>
{/snippet}
<ControlWrapper {...binding.controlWrapper} errors={error}>
  <Popover.Root bind:open={() => model.open, model.setOpen}
    ><div class="flex gap-1">
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
      /><Popover.Trigger
        id={triggerId}
        disabled={model.disabled}
        aria-label={message('cron.choose')}
        class="border-input rounded-md border px-2">{message('cron.choose')}</Popover.Trigger
      >{#if binding.appliedOptions.clearable !== false && model.binding.control.data !== undefined}<Button
          type="button"
          variant="outline"
          disabled={model.disabled}
          aria-label={message('control.clearValue')}
          onclick={() => model.input('')}>×</Button
        >{/if}
    </div>
    <Popover.Content portalProps={{ to: getPortalTarget() }} class="w-96 max-w-[calc(100vw-2rem)]"
      >{@render picker()}</Popover.Content
    ></Popover.Root
  >
</ControlWrapper>
