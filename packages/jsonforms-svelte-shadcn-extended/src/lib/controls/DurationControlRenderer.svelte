<script lang="ts">
  import {
    useRendererMessages,
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const message = useRendererMessages();
  import {
    PopoverContent,
    SelectContent,
    ControlWrapper,
    determineClearValue,
    useShadcnControl,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import * as Select from '@jsonforms-svelte-shadcn-ui/select';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import { Clock3Icon, XIcon } from '@lucide/svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    useDurationControl,
    DurationFields,
    DurationHints,
    type DurationUnit,
  } from '@chobantonov/jsonforms-svelte-extended';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useShadcnControl(useJsonFormsControl(props), (value) => value || clearValue);
  const duration = useDurationControl(props, binding, clearValue);
  const { editor } = duration;
  const { showActions, cancelLabel, okLabel } = $derived(duration);
  const inputProps = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');
    return {
      ...shadcnProps,
      ...duration.inputAttributes(shadcnProps['aria-describedby']),
      class: twMerge(
        binding.styles.control.input,
        shadcnProps.class,
        'input w-full ps-10',
        binding.clearable ? 'pe-10' : 'pe-4',
      ),
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Popover.Root {...binding.shadcnProps('Popover')} bind:open={editor.open}>
    <div class="group relative w-full">
      <Input {...inputProps} />

      <Popover.Trigger
        class="text-muted-foreground hover:bg-accent absolute inset-y-0 start-1 my-auto inline-flex size-8 items-center justify-center rounded-md"
        {...duration.triggerAttributes(inputProps['aria-describedby'])}
      >
        <Clock3Icon class="size-4" />
      </Popover.Trigger>

      {#if duration.showClear}
        <Button
          variant="ghost"
          size="icon"
          class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          {...duration.clearButton}
        >
          <XIcon class="size-4" />
        </Button>
      {/if}
    </div>

    <PopoverContent
      align="start"
      class="max-h-[min(20rem,var(--bits-popover-content-available-height,20rem),calc(100dvh-2rem))] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-y-contain p-4"
    >
      <DurationFields {duration} id={binding.control.id} wrappedLabel>
        {#snippet modeButton(mode, label, attributes)}<Button
            type="button"
            size="sm"
            variant={editor.mode === mode ? 'default' : 'outline'}
            {...attributes}>{label}</Button
          >{/snippet}
        {#snippet field(unit)}<Input {...duration.fieldAttributes(unit)} class="w-full" />{/snippet}
        {#snippet removeButton(attributes)}<Button
            type="button"
            size="icon"
            variant="ghost"
            class="size-8"
            {...attributes}><XIcon class="size-4" /></Button
          >{/snippet}
        {#snippet addUnit()}
          <Select.Root
            type="single"
            value=""
            disabled={duration.disabled}
            onValueChange={(value) => {
              if (value) editor.add(value as DurationUnit);
            }}
          >
            <Select.Trigger aria-label={message('duration.addUnit')} class="w-full"
              >{message('duration.addUnit')}</Select.Trigger
            >
            <SelectContent>
              {#each editor.available as unit (unit)}<Select.Item
                  value={unit}
                  label={message(`duration.${unit}`)}>{message(`duration.${unit}`)}</Select.Item
                >{/each}
            </SelectContent>
          </Select.Root>
        {/snippet}
      </DurationFields>

      {#if showActions}
        <div class="border-border mt-4 flex justify-end gap-2 border-t pt-3">
          <Button variant="outline" size="sm" onclick={duration.cancelClick}>
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            disabled={editor.invalidFields || duration.disabled}
            onclick={duration.confirmClick}
          >
            {okLabel}
          </Button>
        </div>
      {/if}
    </PopoverContent>
  </Popover.Root>
  <DurationHints {duration} id={binding.control.id} />
</ControlWrapper>
