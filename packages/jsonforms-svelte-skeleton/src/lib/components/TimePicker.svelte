<script lang="ts" module>
  export type { TimePickerActionParams as ActionSlotParams } from '@chobantonov/jsonforms-svelte-renderer-common';
</script>

<script lang="ts">
  import {
    TimePickerColumns,
    type TimePickerProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    ChevronDownIcon as ChevronDownOutline,
    ChevronUpIcon as ChevronUpOutline,
  } from '@lucide/svelte';
  import { twMerge } from 'tailwind-merge';

  let {
    value = $bindable(),
    disabled = false,
    class: className,
    ...options
  }: TimePickerProps = $props();

  const timeStepButtonClass =
    'bg-transparent hover:preset-tonal inline-flex h-8 w-8 min-h-0 min-w-0 items-center justify-center rounded-base border-0 p-0 text-surface-600-400 shadow-none';
  const timePeriodInactiveButtonClass =
    'bg-transparent hover:preset-tonal inline-flex h-8 min-h-0 items-center justify-center rounded-base border-0 px-3 text-sm font-medium text-surface-950-50 shadow-none';
</script>

<TimePickerColumns
  periodClass="ms-2 flex flex-col gap-1"
  {disabled}
  bind:value
  {...options}
  class={twMerge('w-full', className)}
>
  {#snippet step(up, attributes)}
    {@const Icon = up ? ChevronUpOutline : ChevronDownOutline}
    <button type="button" class={timeStepButtonClass} {...attributes}
      ><Icon class="h-5 w-5" /></button
    >
  {/snippet}
  {#snippet numericInput(attributes)}
    <input class="input time-input w-16 p-2 text-center text-2xl font-semibold" {...attributes} />
  {/snippet}
  {#snippet periodButton(active, label, attributes)}
    <button
      type="button"
      class={active ? 'btn btn-sm preset-filled' : timePeriodInactiveButtonClass}
      {...attributes}>{label}</button
    >
  {/snippet}
</TimePickerColumns>
