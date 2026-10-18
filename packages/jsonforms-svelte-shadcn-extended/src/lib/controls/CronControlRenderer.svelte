<script lang="ts">
  import { CalendarClock as PickerIcon, XIcon } from '@lucide/svelte';
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
      <label class="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2 text-sm"
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
    ><div class="group/cron relative min-w-0" data-cron-input>
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
      /><Popover.Trigger
        id={triggerId}
        disabled={model.disabled}
        title={message('cron.choose')}
        aria-label={message('cron.choose')}
        class="hover:bg-accent absolute inset-y-0 start-1 my-auto inline-flex size-8 items-center justify-center rounded-md"
        ><PickerIcon class="size-4" aria-hidden="true" /></Popover.Trigger
      >{#if binding.clearable && model.expression !== ''}<Button
          type="button"
          class="invisible absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within/cron:visible group-focus-within/cron:opacity-100 group-hover/cron:visible group-hover/cron:opacity-100"
          data-cron-clear
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          variant="ghost"
          size="icon-xs"
          disabled={model.disabled}
          aria-label={message('control.clearValue')}
          onclick={() => model.input('')}><XIcon class="size-4" aria-hidden="true" /></Button
        >{/if}
    </div>
    <Popover.Content
      portalProps={{ to: getPortalTarget() }}
      align="start"
      class="w-96 max-w-[calc(100vw-2rem)]">{@render picker()}</Popover.Content
    ></Popover.Root
  >
</ControlWrapper>
