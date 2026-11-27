<script lang="ts">
  import {
    useTimePicker,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const message = useRendererMessages();
  import {
    ChevronDownIcon as ChevronDownOutline,
    ChevronUpIcon as ChevronUpOutline,
  } from '$lib/components/icons';
  import type { Snippet } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import * as ToggleGroup from '@jsonforms-svelte-shadcn-ui/toggle-group';

  export interface ActionSlotParams {
    selectedTime: string | undefined;
  }

  type TimePickerProps = {
    value?: string | null;
    min?: string;
    max?: string;
    isAllowed?: (value: string) => boolean;
    useSeconds?: boolean;
    views?: unknown;
    ampm?: boolean;
    disabled?: boolean;
    onchange?: (value: string) => void;
    onrejected?: () => void;
    actionSlot?: Snippet<[ActionSlotParams]>;
    class?: string;
  };

  let {
    value = $bindable(),
    min,
    max,
    isAllowed,
    useSeconds = false,
    views,
    ampm = false,
    disabled = false,
    onchange,
    onrejected,
    actionSlot,
    class: className,
  }: TimePickerProps = $props();

  const picker = useTimePicker(
    () => ({ value, min, max, isAllowed, useSeconds, views, ampm, onchange, onrejected }),
    (next) => {
      value = next;
    },
  );
</script>

<div class={twMerge('w-full', className)}>
  <div class="flex items-center justify-center gap-2">
    {#if picker.showHours}
      <!-- Hours Column -->
      <div class="flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          aria-label={message('temporal.increase', { unit: message('temporal.hours') })}
          onclick={picker.incrementHours}
          {disabled}
        >
          <ChevronUpOutline class="h-5 w-5" />
        </Button>
        <Input
          type="number"
          class="time-input h-12 w-16 text-center text-2xl font-semibold"
          value={picker.hours ?? ''}
          placeholder="--"
          min={ampm ? 1 : 0}
          max={ampm ? 12 : 23}
          aria-label={message('temporal.hours')}
          oninput={picker.handleHourInput}
          {disabled}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label={message('temporal.decrease', { unit: message('temporal.hours') })}
          onclick={picker.decrementHours}
          {disabled}
        >
          <ChevronDownOutline class="h-5 w-5" />
        </Button>
      </div>
    {/if}
    {#if picker.showHours && picker.showMinutes}<span aria-hidden="true">:</span>{/if}
    {#if picker.showMinutes}
      <!-- Minutes Column -->
      <div class="flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          aria-label={message('temporal.increase', { unit: message('temporal.minutes') })}
          onclick={picker.incrementMinutes}
          {disabled}
        >
          <ChevronUpOutline class="h-5 w-5" />
        </Button>
        <Input
          type="number"
          class="time-input h-12 w-16 text-center text-2xl font-semibold"
          value={picker.minutes ?? ''}
          placeholder="--"
          min="0"
          max="59"
          aria-label={message('temporal.minutes')}
          oninput={picker.handleMinuteInput}
          {disabled}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label={message('temporal.decrease', { unit: message('temporal.minutes') })}
          onclick={picker.decrementMinutes}
          {disabled}
        >
          <ChevronDownOutline class="h-5 w-5" />
        </Button>
      </div>
    {/if}
    {#if picker.showSeconds}
      {#if picker.showHours || picker.showMinutes}<span class="text-2xl font-semibold">:</span>{/if}

      <!-- Seconds Column -->
      <div class="flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          aria-label={message('temporal.increase', { unit: message('temporal.seconds') })}
          onclick={picker.incrementSeconds}
          {disabled}
        >
          <ChevronUpOutline class="h-5 w-5" />
        </Button>
        <Input
          type="number"
          class="time-input h-12 w-16 text-center text-2xl font-semibold"
          value={picker.seconds ?? ''}
          placeholder="--"
          min="0"
          max="59"
          aria-label={message('temporal.seconds')}
          oninput={picker.handleSecondInput}
          {disabled}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label={message('temporal.decrease', { unit: message('temporal.seconds') })}
          onclick={picker.decrementSeconds}
          {disabled}
        >
          <ChevronDownOutline class="h-5 w-5" />
        </Button>
      </div>
    {/if}

    {#if ampm}
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
      </ToggleGroup.Root>
    {/if}
  </div>

  {#if actionSlot}
    {@render actionSlot({ selectedTime: picker.formattedTime })}
  {/if}
</div>

<style>
  .time-input {
    appearance: textfield;
    -moz-appearance: textfield;
  }
  .time-input::-webkit-outer-spin-button,
  .time-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
  }
</style>
