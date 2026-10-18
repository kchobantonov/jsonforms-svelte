<script lang="ts">
  import { CalendarClock as PickerIcon, XIcon } from '@lucide/svelte';
  import { type ControlProps, useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import { useCron, CronPicker, DEFAULT_CRON } from '@chobantonov/jsonforms-svelte-extended';
  import {
    ControlWrapper,
    useSkeletonControl,
    getPortalTarget,
    getPortalRootNodeGetter,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import CronSelect from './components/CronSelect.svelte';
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  const getRootNode = getPortalRootNodeGetter();
  const props: ControlProps = $props();
  const model = useCron(props);
  const binding = useSkeletonControl(model.binding);
  const message = useRendererMessages();

  const error = $derived(
    binding.control.errors || (model.problem ? message(`cron.error.${model.problem}`) : ''),
  );
</script>

{#snippet picker()}
  <CronPicker {model}>
    {#snippet select(props)}<CronSelect {...props} disabled={model.disabled} />{/snippet}
    {#snippet input(props)}
      <label class="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2 text-sm"
        >{props.label}<input
          class="input w-full"
          value={props.value}
          aria-label={props.label}
          aria-invalid={props.invalid}
          disabled={model.disabled}
          oninput={(event: Event) => props.change((event.currentTarget as HTMLInputElement).value)}
        /></label
      >
    {/snippet}
    {#snippet button(props)}<button
        type="button"
        class="btn preset-outlined"
        disabled={model.disabled || props.disabled}
        onclick={props.click}>{props.label}</button
      >{/snippet}
  </CronPicker>
{/snippet}
<ControlWrapper {...binding.controlWrapper} errors={error}>
  <Popover
    open={model.open}
    onOpenChange={(details) => model.setOpen(details.open)}
    {getRootNode}
    positioning={{ placement: 'bottom-start' }}
    ><div class="group/cron relative min-w-0" data-cron-input>
      <input
        id={`${binding.control.id}-input`}
        class="input w-full ps-10 pe-10"
        value={model.expression}
        disabled={model.disabled}
        aria-invalid={!!error}
        placeholder={binding.appliedOptions.placeholder ?? DEFAULT_CRON}
        oninput={(event: Event) => model.input((event.currentTarget as HTMLInputElement).value)}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
      /><Popover.Trigger
        disabled={model.disabled}
        title={message('cron.choose')}
        aria-label={message('cron.choose')}
        class="hover:preset-tonal rounded-base absolute inset-y-0 start-1 my-auto inline-flex size-7 items-center justify-center"
        ><PickerIcon class="size-4" aria-hidden="true" /></Popover.Trigger
      >{#if binding.clearable && model.expression !== ''}<button
          type="button"
          class="hover:preset-tonal rounded-base text-surface-600-400 invisible absolute inset-y-0 end-1 my-auto inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within/cron:visible group-focus-within/cron:opacity-100 group-hover/cron:visible group-hover/cron:opacity-100"
          data-cron-clear
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          disabled={model.disabled}
          aria-label={message('control.clearValue')}
          onclick={() => model.input('')}><XIcon class="size-4" aria-hidden="true" /></button
        >{/if}
    </div>
    <Portal target={getPortalTarget()}
      ><Popover.Positioner
        ><Popover.Content
          class="card preset-filled-surface-50-950 w-80 max-w-[calc(100vw-2rem)] border p-3 shadow-xl"
          >{@render picker()}</Popover.Content
        ></Popover.Positioner
      ></Portal
    ></Popover
  >
</ControlWrapper>
