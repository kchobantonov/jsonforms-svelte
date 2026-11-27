<script lang="ts" module>
  export type { TimePickerActionParams as ActionSlotParams } from '@chobantonov/jsonforms-svelte-renderer-common';
</script>

<script lang="ts">
  import {
    TimePickerColumns,
    type TimePickerProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Button, ToolbarButton, Input } from 'flowbite-svelte';
  import { ChevronDownOutline, ChevronUpOutline } from 'flowbite-svelte-icons';
  import { twMerge } from 'tailwind-merge';

  let {
    value = $bindable(),
    disabled = false,
    class: className,
    ...options
  }: TimePickerProps = $props();
</script>

<TimePickerColumns
  periodClass="ml-2 flex flex-col gap-1"
  {disabled}
  bind:value
  {...options}
  class={twMerge('w-full', className)}
>
  {#snippet step(up, attributes)}
    {@const Icon = up ? ChevronUpOutline : ChevronDownOutline}
    <ToolbarButton color="default" size="xs" class="p-1 focus:ring-0" {...attributes}
      ><Icon class="h-5 w-5" /></ToolbarButton
    >
  {/snippet}
  {#snippet numericInput(attributes)}
    <Input {disabled}>
      {#snippet children(props)}
        <input
          {...props}
          class={[props.class, 'time-input w-16 p-2 text-center text-2xl font-semibold']}
          {...attributes}
        />
      {/snippet}
    </Input>
  {/snippet}
  {#snippet periodButton(active, label, attributes)}
    <Button size="sm" color={active ? 'primary' : 'alternative'} {...attributes}>{label}</Button>
  {/snippet}
</TimePickerColumns>
