<script lang="ts">
  import {
    useTimePicker,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const message = useRendererMessages();
  import { Button, ToolbarButton, Input } from 'flowbite-svelte';
  import { ChevronDownOutline, ChevronUpOutline } from 'flowbite-svelte-icons';
  import type { Snippet } from 'svelte';
  import { twMerge } from 'tailwind-merge';

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
        <ToolbarButton
          color="default"
          size="xs"
          class="p-1 focus:ring-0"
          aria-label={message('temporal.increase', { unit: message('temporal.hours') })}
          onclick={picker.incrementHours}
          {disabled}
        >
          <ChevronUpOutline class="h-5 w-5" />
        </ToolbarButton>
        <Input {disabled}>
          {#snippet children(props)}
            <input
              type="number"
              {...props}
              class={[props.class, 'time-input w-16 p-2 text-center text-2xl font-semibold']}
              value={picker.hours ?? ''}
              placeholder="--"
              min={ampm ? 1 : 0}
              max={ampm ? 12 : 23}
              aria-label={message('temporal.hours')}
              oninput={picker.handleHourInput}
            />
          {/snippet}
        </Input>
        <ToolbarButton
          color="default"
          size="xs"
          class="p-1 focus:ring-0"
          aria-label={message('temporal.decrease', { unit: message('temporal.hours') })}
          onclick={picker.decrementHours}
          {disabled}
        >
          <ChevronDownOutline class="h-5 w-5" />
        </ToolbarButton>
      </div>
    {/if}
    {#if picker.showHours && picker.showMinutes}<span aria-hidden="true">:</span>{/if}
    {#if picker.showMinutes}
      <!-- Minutes Column -->
      <div class="flex flex-col items-center">
        <ToolbarButton
          color="default"
          size="xs"
          class="p-1 focus:ring-0"
          aria-label={message('temporal.increase', { unit: message('temporal.minutes') })}
          onclick={picker.incrementMinutes}
          {disabled}
        >
          <ChevronUpOutline class="h-5 w-5" />
        </ToolbarButton>
        <Input {disabled}>
          {#snippet children(props)}
            <input
              type="number"
              {...props}
              class={[props.class, 'time-input w-16 p-2 text-center text-2xl font-semibold']}
              value={picker.minutes ?? ''}
              placeholder="--"
              min="0"
              max="59"
              aria-label={message('temporal.minutes')}
              oninput={picker.handleMinuteInput}
            />
          {/snippet}
        </Input>
        <ToolbarButton
          color="default"
          size="xs"
          class="p-1 focus:ring-0"
          aria-label={message('temporal.decrease', { unit: message('temporal.minutes') })}
          onclick={picker.decrementMinutes}
          {disabled}
        >
          <ChevronDownOutline class="h-5 w-5" />
        </ToolbarButton>
      </div>
    {/if}
    {#if picker.showSeconds}
      {#if picker.showHours || picker.showMinutes}<span class="text-2xl font-semibold">:</span>{/if}

      <!-- Seconds Column -->
      <div class="flex flex-col items-center">
        <ToolbarButton
          color="default"
          size="xs"
          class="p-1 focus:ring-0"
          aria-label={message('temporal.increase', { unit: message('temporal.seconds') })}
          onclick={picker.incrementSeconds}
          {disabled}
        >
          <ChevronUpOutline class="h-5 w-5" />
        </ToolbarButton>
        <Input {disabled}>
          {#snippet children(props)}
            <input
              type="number"
              {...props}
              class={[props.class, 'time-input w-16 p-2 text-center text-2xl font-semibold']}
              value={picker.seconds ?? ''}
              placeholder="--"
              min="0"
              max="59"
              aria-label={message('temporal.seconds')}
              oninput={picker.handleSecondInput}
            />
          {/snippet}
        </Input>
        <ToolbarButton
          color="default"
          size="xs"
          class="p-1 focus:ring-0"
          aria-label={message('temporal.decrease', { unit: message('temporal.seconds') })}
          onclick={picker.decrementSeconds}
          {disabled}
        >
          <ChevronDownOutline class="h-5 w-5" />
        </ToolbarButton>
      </div>
    {/if}

    {#if ampm}
      <!-- AM/PM Toggle -->
      <div class="ml-2 flex flex-col gap-1">
        <Button
          size="sm"
          color={!picker.isPM ? 'primary' : 'alternative'}
          aria-label={message('temporal.amAriaLabel')}
          onclick={() => {
            if (picker.isPM) picker.togglePeriod();
          }}
          {disabled}
        >
          {message('temporal.am')}
        </Button>
        <Button
          size="sm"
          color={picker.isPM ? 'primary' : 'alternative'}
          aria-label={message('temporal.pmAriaLabel')}
          onclick={() => {
            if (!picker.isPM) picker.togglePeriod();
          }}
          {disabled}
        >
          {message('temporal.pm')}
        </Button>
      </div>
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
