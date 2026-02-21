<script lang="ts">
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
    useSeconds?: boolean;
    ampm?: boolean;
    disabled?: boolean;
    onchange?: (value: string) => void;
    actionSlot?: Snippet<[ActionSlotParams]>;
    class?: string;
  };

  let {
    value = $bindable(),
    min,
    max,
    useSeconds = false,
    ampm = false,
    disabled = false,
    onchange,
    actionSlot,
    class: className,
  }: TimePickerProps = $props();

  // Parse current value or leave uninitialized
  let hours = $state<number | undefined>(undefined);
  let minutes = $state<number | undefined>(undefined);
  let seconds = $state<number | undefined>(undefined);
  let isPM = $state(false);

  // Initialize from value
  $effect(() => {
    if (value) {
      const parts = value.split(':');
      const h = parseInt(parts[0]) || 0;
      const m = parseInt(parts[1]) || 0;
      const s = parseInt(parts[2]) || 0;

      if (ampm) {
        isPM = h >= 12;
        hours = h === 0 ? 12 : h > 12 ? h - 12 : h;
      } else {
        hours = h;
      }
      minutes = m;
      seconds = s;
    } else {
      // Leave uninitialized
      hours = undefined;
      minutes = undefined;
      seconds = undefined;
      isPM = false;
    }
  });

  // Generate formatted time string
  const formattedTime = $derived.by(() => {
    if (hours === undefined || minutes === undefined) {
      return undefined;
    }

    let h = hours;
    if (ampm) {
      h = isPM ? (hours === 12 ? 12 : hours + 12) : hours === 12 ? 0 : hours;
    }
    const hStr = String(h).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    const sStr = String(seconds ?? 0).padStart(2, '0');
    return useSeconds ? `${hStr}:${mStr}:${sStr}` : `${hStr}:${mStr}`;
  });

  // Check if time is within min/max bounds
  function isTimeValid(h: number, m: number, s: number): boolean {
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    if (min) {
      const minCompare = useSeconds ? min : min.substring(0, 5);
      const timeCompare = useSeconds ? timeStr : timeStr.substring(0, 5);
      if (timeCompare < minCompare) return false;
    }

    if (max) {
      const maxCompare = useSeconds ? max : max.substring(0, 5);
      const timeCompare = useSeconds ? timeStr : timeStr.substring(0, 5);
      if (timeCompare > maxCompare) return false;
    }

    return true;
  }

  function updateTime() {
    if (hours === undefined || minutes === undefined) {
      value = undefined;
      return;
    }

    let h = hours;
    if (ampm) {
      h = isPM ? (hours === 12 ? 12 : hours + 12) : hours === 12 ? 0 : hours;
    }

    const s = seconds ?? 0;
    if (isTimeValid(h, minutes, s)) {
      value = formattedTime;
      if (onchange && formattedTime) {
        onchange(formattedTime);
      }
    }
  }

  function incrementHours() {
    const maxHours = ampm ? 12 : 23;
    const minHours = ampm ? 1 : 0;

    // Initialize if undefined
    if (hours === undefined) {
      hours = minHours;
      if (minutes === undefined) minutes = 0;
      if (useSeconds && seconds === undefined) seconds = 0;
      updateTime();
      return;
    }

    const newHours = hours >= maxHours ? minHours : hours + 1;

    let h = newHours;
    if (ampm) {
      h = isPM ? (newHours === 12 ? 12 : newHours + 12) : newHours === 12 ? 0 : newHours;
    }

    if (isTimeValid(h, minutes ?? 0, seconds ?? 0)) {
      hours = newHours;
      updateTime();
    }
  }

  function decrementHours() {
    const maxHours = ampm ? 12 : 23;
    const minHours = ampm ? 1 : 0;

    // Initialize if undefined
    if (hours === undefined) {
      hours = maxHours;
      if (minutes === undefined) minutes = 0;
      if (useSeconds && seconds === undefined) seconds = 0;
      updateTime();
      return;
    }

    const newHours = hours <= minHours ? maxHours : hours - 1;

    let h = newHours;
    if (ampm) {
      h = isPM ? (newHours === 12 ? 12 : newHours + 12) : newHours === 12 ? 0 : newHours;
    }

    if (isTimeValid(h, minutes ?? 0, seconds ?? 0)) {
      hours = newHours;
      updateTime();
    }
  }

  function incrementMinutes() {
    // Initialize if undefined
    if (minutes === undefined) {
      if (hours === undefined) hours = ampm ? 12 : 0;
      minutes = 0;
      if (useSeconds && seconds === undefined) seconds = 0;
      updateTime();
      return;
    }

    const newMinutes = minutes >= 59 ? 0 : minutes + 1;
    let h = hours ?? (ampm ? 12 : 0);
    if (ampm) {
      h = isPM ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
    }

    if (isTimeValid(h, newMinutes, seconds ?? 0)) {
      minutes = newMinutes;
      updateTime();
    }
  }

  function decrementMinutes() {
    // Initialize if undefined
    if (minutes === undefined) {
      if (hours === undefined) hours = ampm ? 12 : 0;
      minutes = 59;
      if (useSeconds && seconds === undefined) seconds = 0;
      updateTime();
      return;
    }

    const newMinutes = minutes <= 0 ? 59 : minutes - 1;
    let h = hours ?? (ampm ? 12 : 0);
    if (ampm) {
      h = isPM ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
    }

    if (isTimeValid(h, newMinutes, seconds ?? 0)) {
      minutes = newMinutes;
      updateTime();
    }
  }

  function incrementSeconds() {
    // Initialize if undefined
    if (seconds === undefined) {
      if (hours === undefined) hours = ampm ? 12 : 0;
      if (minutes === undefined) minutes = 0;
      seconds = 0;
      updateTime();
      return;
    }

    const newSeconds = seconds >= 59 ? 0 : seconds + 1;
    let h = hours ?? (ampm ? 12 : 0);
    if (ampm) {
      h = isPM ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
    }

    if (isTimeValid(h, minutes ?? 0, newSeconds)) {
      seconds = newSeconds;
      updateTime();
    }
  }

  function decrementSeconds() {
    // Initialize if undefined
    if (seconds === undefined) {
      if (hours === undefined) hours = ampm ? 12 : 0;
      if (minutes === undefined) minutes = 0;
      seconds = 59;
      updateTime();
      return;
    }

    const newSeconds = seconds <= 0 ? 59 : seconds - 1;
    let h = hours ?? (ampm ? 12 : 0);
    if (ampm) {
      h = isPM ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
    }

    if (isTimeValid(h, minutes ?? 0, newSeconds)) {
      seconds = newSeconds;
      updateTime();
    }
  }

  function togglePeriod() {
    isPM = !isPM;
    updateTime();
  }

  function handleHourInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const inputValue = input.value;

    // Allow empty input
    if (inputValue === '') {
      hours = undefined;
      updateTime();
      return;
    }

    let val = parseInt(inputValue) || 0;
    const maxHours = ampm ? 12 : 23;
    const minHours = ampm ? 1 : 0;

    if (val > maxHours) val = maxHours;
    if (val < minHours) val = minHours;

    let h = val;
    if (ampm) {
      h = isPM ? (val === 12 ? 12 : val + 12) : val === 12 ? 0 : val;
    }

    if (isTimeValid(h, minutes ?? 0, seconds ?? 0)) {
      hours = val;
      updateTime();
    }
  }

  function handleMinuteInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const inputValue = input.value;

    // Allow empty input
    if (inputValue === '') {
      minutes = undefined;
      updateTime();
      return;
    }

    let val = parseInt(inputValue) || 0;

    if (val > 59) val = 59;
    if (val < 0) val = 0;

    let h = hours ?? (ampm ? 12 : 0);
    if (ampm) {
      h = isPM ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
    }

    if (isTimeValid(h, val, seconds ?? 0)) {
      minutes = val;
      updateTime();
    }
  }

  function handleSecondInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const inputValue = input.value;

    // Allow empty input
    if (inputValue === '') {
      seconds = undefined;
      updateTime();
      return;
    }

    let val = parseInt(inputValue) || 0;

    if (val > 59) val = 59;
    if (val < 0) val = 0;

    let h = hours ?? (ampm ? 12 : 0);
    if (ampm) {
      h = isPM ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
    }

    if (isTimeValid(h, minutes ?? 0, val)) {
      seconds = val;
      updateTime();
    }
  }
</script>

<div class={twMerge('w-full', className)}>
  <div class="flex items-center justify-center gap-2">
    <!-- Hours Column -->
    <div class="flex flex-col items-center">
      <ToolbarButton
        color="default"
        size="xs"
        class="p-1 focus:ring-0"
        onclick={incrementHours}
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
            value={hours ?? ''}
            placeholder="--"
            min={ampm ? 1 : 0}
            max={ampm ? 12 : 23}
            oninput={handleHourInput}
          />
        {/snippet}
      </Input>
      <ToolbarButton
        color="default"
        size="xs"
        class="p-1 focus:ring-0"
        onclick={decrementHours}
        {disabled}
      >
        <ChevronDownOutline class="h-5 w-5" />
      </ToolbarButton>
    </div>

    <span class="text-2xl font-semibold select-none">:</span>

    <!-- Minutes Column -->
    <div class="flex flex-col items-center">
      <ToolbarButton
        color="default"
        size="xs"
        class="p-1 focus:ring-0"
        onclick={incrementMinutes}
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
            value={minutes ?? ''}
            placeholder="--"
            min="0"
            max="59"
            oninput={handleMinuteInput}
          />
        {/snippet}
      </Input>
      <ToolbarButton
        color="default"
        size="xs"
        class="p-1 focus:ring-0"
        onclick={decrementMinutes}
        {disabled}
      >
        <ChevronDownOutline class="h-5 w-5" />
      </ToolbarButton>
    </div>

    {#if useSeconds}
      <span class="text-2xl font-semibold">:</span>

      <!-- Seconds Column -->
      <div class="flex flex-col items-center">
        <ToolbarButton
          color="default"
          size="xs"
          class="p-1 focus:ring-0"
          onclick={incrementSeconds}
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
              value={seconds ?? ''}
              placeholder="--"
              min="0"
              max="59"
              oninput={handleSecondInput}
            />
          {/snippet}
        </Input>
        <ToolbarButton
          color="default"
          size="xs"
          class="p-1 focus:ring-0"
          onclick={decrementSeconds}
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
          color={!isPM ? 'primary' : 'alternative'}
          onclick={() => {
            if (isPM) togglePeriod();
          }}
          {disabled}
        >
          AM
        </Button>
        <Button
          size="sm"
          color={isPM ? 'primary' : 'alternative'}
          onclick={() => {
            if (!isPM) togglePeriod();
          }}
          {disabled}
        >
          PM
        </Button>
      </div>
    {/if}
  </div>

  {#if actionSlot}
    {@render actionSlot({ selectedTime: formattedTime })}
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
