<script lang="ts">
  import { CalendarClock as PickerIcon, XIcon } from '@lucide/svelte';
  import { type ControlProps, useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import { useCron, CronPicker, DEFAULT_CRON } from '@chobantonov/jsonforms-svelte-extended';
  import {
    ControlWrapper,
    useShadcnControl,
    getPortalTarget,
    getPortalTargetResolver,
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
  const resolvePortalTarget = getPortalTargetResolver();
  const componentId = $props.id();
  const triggerId = `cron-${componentId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const error = $derived(
    binding.control.errors || (model.problem ? message(`cron.error.${model.problem}`) : ''),
  );
  const describedBy = $derived(
    [
      binding.shadcnProps('input')['aria-describedby'],
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
        autofocus={binding.initialFocus}
        required={binding.control.required}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        placeholder={binding.appliedOptions.placeholder ?? DEFAULT_CRON}
        oninput={(event: Event) => model.input((event.currentTarget as HTMLInputElement).value)}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
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
                onfocus={(event) => {
                  if (typeof triggerProps.onfocus === 'function') triggerProps.onfocus(event);
                  binding.handleFocus();
                }}
                onblur={(event) => {
                  if (typeof triggerProps.onblur === 'function') triggerProps.onblur(event);
                  binding.handleBlur();
                }}
                class="hover:bg-accent absolute inset-y-0 start-1 my-auto inline-flex size-8 items-center justify-center rounded-md"
                ><PickerIcon class="size-4" aria-hidden="true" /></Popover.Trigger
              >
            {/snippet}
          </Tooltip.Trigger><Tooltip.Content
            portalProps={{ to: resolvePortalTarget() ?? undefined }}
            >{message('cron.choose')}</Tooltip.Content
          ></Tooltip.Root
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
            </Tooltip.Trigger><Tooltip.Content
              portalProps={{ to: resolvePortalTarget() ?? undefined }}
              >{message('control.clearValue')}</Tooltip.Content
            ></Tooltip.Root
          ></Tooltip.Provider
        >{/if}
    </div>
    <Popover.Content
      portalProps={{ to: getPortalTarget() }}
      align="start"
      class="max-h-[min(32rem,var(--bits-popover-content-available-height,32rem),calc(100dvh-2rem))] w-96 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-y-contain"
      >{@render picker()}</Popover.Content
    ></Popover.Root
  >
</ControlWrapper>
