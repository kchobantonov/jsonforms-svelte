<script lang="ts">
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
      <label class="grid gap-1 text-sm"
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
    ><div class="flex gap-1">
      <input
        id={`${binding.control.id}-input`}
        class="input min-w-0 flex-1"
        value={model.expression}
        disabled={model.disabled}
        aria-invalid={!!error}
        placeholder={binding.appliedOptions.placeholder ?? DEFAULT_CRON}
        oninput={(event: Event) => model.input((event.currentTarget as HTMLInputElement).value)}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
      /><Popover.Trigger
        disabled={model.disabled}
        aria-label={message('cron.choose')}
        class="btn preset-outlined">{message('cron.choose')}</Popover.Trigger
      >{#if binding.appliedOptions.clearable !== false && model.binding.control.data !== undefined}<button
          type="button"
          class="btn preset-outlined"
          disabled={model.disabled}
          aria-label={message('control.clearValue')}
          onclick={() => model.input('')}>×</button
        >{/if}
    </div>
    <Portal target={getPortalTarget()}
      ><Popover.Positioner
        ><Popover.Content
          class="card preset-filled-surface-50-950 w-96 max-w-[calc(100vw-2rem)] border p-3 shadow-xl"
          >{@render picker()}</Popover.Content
        ></Popover.Positioner
      ></Portal
    ></Popover
  >
</ControlWrapper>
