<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useTimePicker, type TimePickerProps } from './timePicker.svelte';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  interface Column {
    label: string;
    value: number | undefined;
    min: number;
    max: number;
    increment(): void;
    decrement(): void;
    input(event: Event): void;
  }
  let {
    value = $bindable(),
    useSeconds = false,
    ampm = false,
    class: className,
    actionSlot,
    column: customColumn,
    step,
    numericInput,
    periodButton,
    periodClass,
    period,
    ...options
  }: TimePickerProps & {
    column?: Snippet<[Column]>;
    numericInput?: Snippet<
      [
        {
          type: 'number';
          value: number | '';
          placeholder: string;
          min: number;
          max: number;
          'aria-label': string;
          oninput(event: Event): void;
          disabled?: boolean;
        },
      ]
    >;
    step?: Snippet<[boolean, { 'aria-label': string; onclick(): void; disabled: boolean }]>;
    periodClass?: string;
    periodButton?: Snippet<
      [boolean, string, { 'aria-label': string; onclick(): void; disabled: boolean }]
    >;

    period?: Snippet<[ReturnType<typeof useTimePicker>]>;
  } = $props();
  const message = useRendererMessages();
  const picker = useTimePicker(
    () => ({ ...options, value, useSeconds, ampm }),
    (next) => {
      value = next;
    },
  );
</script>

{#snippet periodControls()}
  {#if ampm}
    {#if period}{@render period(picker)}
    {:else if periodButton}
      <div class={periodClass}>
        {#each ['am', 'pm'] as periodName (periodName)}
          {@const active = (periodName === 'pm') === picker.isPM}
          {@render periodButton(active, message(`temporal.${periodName}`), {
            'aria-label': message(`temporal.${periodName}AriaLabel`),
            disabled: !!options.disabled,
            onclick: () => {
              if (!active) picker.togglePeriod();
            },
          })}
        {/each}
      </div>
    {/if}
  {/if}
{/snippet}

{#snippet column(part: Column)}
  {#if customColumn}
    {@render customColumn(part)}
  {:else if step && numericInput}
    <div class="flex flex-col items-center">
      {@render step(true, {
        'aria-label': message('temporal.increase', { unit: part.label }),
        onclick: part.increment,
        disabled: !!options.disabled,
      })}
      {@render numericInput({
        type: 'number',
        value: part.value ?? '',
        placeholder: '--',
        min: part.min,
        max: part.max,
        'aria-label': part.label,
        oninput: part.input,
        disabled: options.disabled,
      })}
      {@render step(false, {
        'aria-label': message('temporal.decrease', { unit: part.label }),
        onclick: part.decrement,
        disabled: !!options.disabled,
      })}
    </div>
  {/if}
{/snippet}
<div class={['time-picker', className]}>
  <div class="flex items-center justify-center gap-2">
    {#if picker.showHours}
      {@render column({
        label: message('temporal.hours'),
        value: picker.hours,
        min: ampm ? 1 : 0,
        max: ampm ? 12 : 23,
        increment: picker.incrementHours,
        decrement: picker.decrementHours,
        input: picker.handleHourInput,
      })}
    {/if}
    {#if picker.showHours && picker.showMinutes}<span aria-hidden="true">:</span>{/if}
    {#if picker.showMinutes}
      {@render column({
        label: message('temporal.minutes'),
        value: picker.minutes,
        min: 0,
        max: 59,
        increment: picker.incrementMinutes,
        decrement: picker.decrementMinutes,
        input: picker.handleMinuteInput,
      })}
    {/if}
    {#if picker.showSeconds}
      {#if picker.showHours || picker.showMinutes}<span class="text-2xl font-semibold">:</span>{/if}
      {@render column({
        label: message('temporal.seconds'),
        value: picker.seconds,
        min: 0,
        max: 59,
        increment: picker.incrementSeconds,
        decrement: picker.decrementSeconds,
        input: picker.handleSecondInput,
      })}
    {/if}
    {@render periodControls()}
  </div>
  {@render actionSlot?.({ selectedTime: picker.formattedTime })}
</div>

<style>
  .time-picker :global(.time-input) {
    appearance: textfield;
    -moz-appearance: textfield;
  }
  .time-picker :global(.time-input)::-webkit-outer-spin-button,
  .time-picker :global(.time-input)::-webkit-inner-spin-button {
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
  }
</style>
