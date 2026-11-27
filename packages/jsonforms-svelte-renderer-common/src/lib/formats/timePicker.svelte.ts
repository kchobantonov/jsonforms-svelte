import type { Snippet } from 'svelte';
import { temporalTimeColumns } from './temporalOptions';
interface TimePickerOptions {
  value?: string | null;
  min?: string;
  max?: string;
  isAllowed?: (value: string) => boolean;
  useSeconds: boolean;
  views?: unknown;
  ampm: boolean;
  onchange?: (value: string) => void;
  onrejected?: () => void;
}

export interface TimePickerActionParams {
  selectedTime: string | undefined;
}
export interface TimePickerProps extends Omit<TimePickerOptions, 'useSeconds' | 'ampm'> {
  useSeconds?: boolean;
  ampm?: boolean;
  disabled?: boolean;
  actionSlot?: Snippet<[TimePickerActionParams]>;
  class?: string;
}
export function useTimePicker(
  options: () => TimePickerOptions,
  setValue: (value: string | undefined) => void,
) {
  const { value, min, max, isAllowed, useSeconds, views, ampm } = $derived(options());
  const columns = $derived(temporalTimeColumns(views));
  const showHours = $derived(columns?.hours ?? true);
  const showMinutes = $derived(columns?.minutes ?? true);
  const showSeconds = $derived(columns?.seconds ?? useSeconds);

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

    const h = clockHour(hours);
    const hStr = String(h).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    const sStr = String(seconds ?? 0).padStart(2, '0');
    return useSeconds ? `${hStr}:${mStr}:${sStr}` : `${hStr}:${mStr}`;
  });

  // Check if time is within min/max bounds
  function isTimeValid(h: number, m: number, s: number): boolean {
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (isAllowed && !isAllowed(useSeconds ? timeStr : timeStr.substring(0, 5))) return false;

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

  function acceptTime(h: number, m: number, s: number): boolean {
    const valid = isTimeValid(h, m, s);
    if (!valid) options().onrejected?.();
    return valid;
  }

  function initializeHiddenParts() {
    if (!showHours && hours === undefined) hours = ampm ? 12 : 0;
    if (!showMinutes && minutes === undefined) minutes = 0;
  }

  function updateTime() {
    initializeHiddenParts();
    if (hours === undefined || minutes === undefined) {
      setValue(undefined);
      return;
    }

    const h = clockHour(hours);

    const s = seconds ?? 0;
    if (acceptTime(h, minutes, s)) {
      setValue(formattedTime);
      if (formattedTime) {
        options().onchange?.(formattedTime);
      }
    }
  }

  function stepHours(amount: -1 | 1) {
    const currentHour =
      hours === undefined ? undefined : ampm ? (isPM ? (hours % 12) + 12 : hours % 12) : hours;
    const nextHour =
      currentHour === undefined
        ? amount === 1
          ? ampm
            ? 1
            : 0
          : ampm
            ? 0
            : 23
        : (currentHour + amount + 24) % 24;
    if (!acceptTime(nextHour, minutes ?? 0, seconds ?? 0)) return;
    hours = ampm ? nextHour % 12 || 12 : nextHour;
    if (ampm) isPM = nextHour >= 12;
    if (minutes === undefined) minutes = 0;
    if (useSeconds && seconds === undefined) seconds = 0;
    updateTime();
  }

  function incrementHours() {
    stepHours(1);
  }

  function decrementHours() {
    stepHours(-1);
  }

  function clockHour(hour = hours ?? (ampm ? 12 : 0), pm = isPM) {
    if (!ampm) return hour;
    return (hour === 12 ? 0 : hour) + (pm ? 12 : 0);
  }

  function setMinuteOrSecond(unit: 'minute' | 'second', value: number | undefined) {
    if (unit === 'minute') minutes = value;
    else seconds = value;
    updateTime();
  }

  function allowedPart(unit: 'minute' | 'second', next: number) {
    return acceptTime(
      clockHour(),
      unit === 'minute' ? next : (minutes ?? 0),
      unit === 'second' ? next : (seconds ?? 0),
    );
  }

  function initializePart(unit: 'minute' | 'second') {
    hours ??= ampm ? 12 : 0;
    if (unit === 'second') minutes ??= 0;
    if (unit === 'minute' && useSeconds) seconds ??= 0;
  }

  function stepPart(unit: 'minute' | 'second', direction: -1 | 1) {
    const current = unit === 'minute' ? minutes : seconds;
    if (current === undefined) {
      initializePart(unit);
      setMinuteOrSecond(unit, direction === 1 ? 0 : 59);
      return;
    }
    let next = current + direction;
    if (current >= 59 && direction === 1) next = 0;
    if (current <= 0 && direction === -1) next = 59;
    if (allowedPart(unit, next)) setMinuteOrSecond(unit, next);
  }

  function togglePeriod() {
    const nextPM = !isPM;
    if (hours !== undefined && minutes !== undefined) {
      const nextHour = (hours === 12 ? 0 : hours) + (nextPM ? 12 : 0);
      if (!acceptTime(nextHour, minutes, seconds ?? 0)) return;
    }
    isPM = nextPM;
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

    const parsed = parseInt(inputValue) || 0;
    const maxHours = ampm ? 12 : 23;
    const minHours = ampm ? 1 : 0;

    const val = Math.max(minHours, Math.min(maxHours, parsed));

    const h = clockHour(val);

    if (acceptTime(h, minutes ?? 0, seconds ?? 0)) {
      hours = val;
      updateTime();
    }
  }

  function handlePartInput(unit: 'minute' | 'second', event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value === '') {
      setMinuteOrSecond(unit, undefined);
      return;
    }
    const next = Math.max(0, Math.min(59, parseInt(input.value) || 0));
    if (allowedPart(unit, next)) setMinuteOrSecond(unit, next);
  }
  return {
    get showHours() {
      return showHours;
    },
    get showMinutes() {
      return showMinutes;
    },
    get showSeconds() {
      return showSeconds;
    },
    get hours() {
      return hours;
    },
    get minutes() {
      return minutes;
    },
    get seconds() {
      return seconds;
    },
    get isPM() {
      return isPM;
    },
    get formattedTime() {
      return formattedTime;
    },
    incrementHours,
    decrementHours,
    incrementMinutes: () => stepPart('minute', 1),
    decrementMinutes: () => stepPart('minute', -1),
    incrementSeconds: () => stepPart('second', 1),
    decrementSeconds: () => stepPart('second', -1),
    togglePeriod,
    handleHourInput,
    handleMinuteInput: (event: Event) => handlePartInput('minute', event),
    handleSecondInput: (event: Event) => handlePartInput('second', event),
  };
}
