<script lang="ts" module>
  export type { TimePickerActionParams as ActionSlotParams } from '@chobantonov/jsonforms-svelte-renderer-common';
</script>

<script lang="ts">
  import {
    TimePickerColumns,
    type TimePickerProps,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const message = useRendererMessages();
  import {
    ChevronDownIcon as ChevronDownOutline,
    ChevronUpIcon as ChevronUpOutline,
  } from '$lib/components/icons';
  import { twMerge } from 'tailwind-merge';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import * as ToggleGroup from '@jsonforms-svelte-shadcn-ui/toggle-group';

  let {
    value = $bindable(),
    disabled = false,
    class: className,
    ...options
  }: TimePickerProps = $props();
</script>

<TimePickerColumns {disabled} bind:value {...options} class={twMerge('w-full', className)}>
  {#snippet step(up, attributes)}
    {@const Icon = up ? ChevronUpOutline : ChevronDownOutline}
    <Button variant="ghost" size="icon" {...attributes}><Icon class="h-5 w-5" /></Button>
  {/snippet}
  {#snippet numericInput(attributes)}
    <Input class="time-input h-12 w-16 text-center text-2xl font-semibold" {...attributes} />
  {/snippet}
  {#snippet period(picker)}
    <!-- AM/PM Toggle -->
    <ToggleGroup.Root
      type="single"
      variant="outline"
      orientation="vertical"
      value={picker.isPM ? 'pm' : 'am'}
      onValueChange={(period) =>
        period && (period === 'pm') !== picker.isPM && picker.togglePeriod()}
      {disabled}
      class="ms-2 flex-col"
    >
      <ToggleGroup.Item value="am" aria-label={message('temporal.amAriaLabel')}
        >{message('temporal.am')}</ToggleGroup.Item
      >
      <ToggleGroup.Item value="pm" aria-label={message('temporal.pmAriaLabel')}
        >{message('temporal.pm')}</ToggleGroup.Item
      >
    </ToggleGroup.Root>{/snippet}
</TimePickerColumns>
