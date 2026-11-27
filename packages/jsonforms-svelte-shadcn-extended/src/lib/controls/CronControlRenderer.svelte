<script lang="ts">
  import { CalendarClock as PickerIcon, XIcon } from '@lucide/svelte';
  import {
    type ControlProps,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    useCron,
    useCronField,
    CronPickerFields,
    DEFAULT_CRON,
  } from '@chobantonov/jsonforms-svelte-extended';
  import {
    PopoverContent,
    TooltipContent,
    ControlWrapper,
    useShadcnControl,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import CronSelect from './components/CronSelect.svelte';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  const props: ControlProps = $props();
  const model = useCron(props);
  const binding = useShadcnControl(model.binding);
  const message = useRendererMessages();
  const componentId = $props.id();
  const triggerId = `cron-${componentId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const field = useCronField(
    model,
    binding,
    () => binding.shadcnProps('input')['aria-describedby'],
  );
  const { error, describedBy } = $derived(field);
</script>

{#snippet picker()}
  <CronPickerFields {model} {CronSelect}>
    {#snippet input(attributes)}<Input class="w-full pe-9" {...attributes} />{/snippet}
    {#snippet clear(label, attributes)}<Button
        {...attributes}
        variant="ghost"
        size="icon-xs"
        class="invisible absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within/cron-expression:visible group-focus-within/cron-expression:opacity-100 group-hover/cron-expression:visible group-hover/cron-expression:opacity-100"
        aria-label={label}><XIcon class="size-4" aria-hidden="true" /></Button
      >{/snippet}
    {#snippet button(label, attributes)}<Button {...attributes} variant="outline">{label}</Button
      >{/snippet}
  </CronPickerFields>
{/snippet}
<ControlWrapper {...binding.controlWrapper} errors={error}>
  <Popover.Root bind:open={() => model.open, model.setOpen}
    ><div class="group/cron relative min-w-0" data-cron-input>
      <Input
        {...field.input}
        class="w-full ps-10 pe-10"
        placeholder={binding.appliedOptions.placeholder ?? DEFAULT_CRON}
      /><Tooltip.Provider
        ><Tooltip.Root
          ><Tooltip.Trigger>
            {#snippet child({ props: triggerProps })}
              <Popover.Trigger
                {...triggerProps}
                id={triggerId}
                disabled={model.disabled}
                title={message('cron.choose')}
                aria-label={message('cron.choose')}
                aria-describedby={describedBy}
                {...binding.focusEvents(triggerProps)}
                class="hover:bg-accent absolute inset-y-0 start-1 my-auto inline-flex size-8 items-center justify-center rounded-md"
                ><PickerIcon class="size-4" aria-hidden="true" /></Popover.Trigger
              >
            {/snippet}
          </Tooltip.Trigger><TooltipContent>{message('cron.choose')}</TooltipContent></Tooltip.Root
        ></Tooltip.Provider
      >{#if binding.clearable && model.expression !== ''}<Tooltip.Provider
          ><Tooltip.Root
            ><Tooltip.Trigger>
              {#snippet child({ props: triggerProps })}
                <Button
                  {...triggerProps}
                  type="button"
                  class="invisible absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within/cron:visible group-focus-within/cron:opacity-100 group-hover/cron:visible group-hover/cron:opacity-100"
                  data-cron-clear
                  onmousedown={(event: MouseEvent) => event.preventDefault()}
                  variant="ghost"
                  size="icon-xs"
                  disabled={model.disabled}
                  aria-label={message('control.clearValue')}
                  onclick={() => model.input('')}
                  ><XIcon class="size-4" aria-hidden="true" /></Button
                >
              {/snippet}
            </Tooltip.Trigger><TooltipContent>{message('control.clearValue')}</TooltipContent
            ></Tooltip.Root
          ></Tooltip.Provider
        >{/if}
    </div>
    <PopoverContent
      align="start"
      class="max-h-[min(32rem,var(--bits-popover-content-available-height,32rem),calc(100dvh-2rem))] w-96 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-y-contain"
      >{@render picker()}</PopoverContent
    ></Popover.Root
  >
</ControlWrapper>
