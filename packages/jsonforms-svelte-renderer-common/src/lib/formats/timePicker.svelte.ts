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

  function updateTime() {
    if (!showHours && hours === undefined) hours = ampm ? 12 : 0;
    if (!showMinutes && minutes === undefined) minutes = 0;
    if (hours === undefined || minutes === undefined) {
      setValue(undefined);
      return;
    }

    let h = hours;
    if (ampm) {
      h = isPM ? (hours === 12 ? 12 : hours + 12) : hours === 12 ? 0 : hours;
    }

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

    if (acceptTime(h, newMinutes, seconds ?? 0)) {
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

    if (acceptTime(h, newMinutes, seconds ?? 0)) {
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

    if (acceptTime(h, minutes ?? 0, newSeconds)) {
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

    if (acceptTime(h, minutes ?? 0, newSeconds)) {
      seconds = newSeconds;
      updateTime();
    }
  }

  function togglePeriod() {
    const nextPM = !isPM;
    if (hours !== undefined && minutes !== undefined) {
      const nextHour = nextPM ? (hours === 12 ? 12 : hours + 12) : hours === 12 ? 0 : hours;
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

    let val = parseInt(inputValue) || 0;
    const maxHours = ampm ? 12 : 23;
    const minHours = ampm ? 1 : 0;

    if (val > maxHours) val = maxHours;
    if (val < minHours) val = minHours;

    let h = val;
    if (ampm) {
      h = isPM ? (val === 12 ? 12 : val + 12) : val === 12 ? 0 : val;
    }

    if (acceptTime(h, minutes ?? 0, seconds ?? 0)) {
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

    if (acceptTime(h, val, seconds ?? 0)) {
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

    if (acceptTime(h, minutes ?? 0, val)) {
      seconds = val;
      updateTime();
    }
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
    incrementMinutes,
    decrementMinutes,
    incrementSeconds,
    decrementSeconds,
    togglePeriod,
    handleHourInput,
    handleMinuteInput,
    handleSecondInput,
  };
}
