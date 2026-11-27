import { usePopupPlacement } from '../popupPlacement.svelte';
import { onMount, untrack } from 'svelte';
import {
  parseColor,
  serializeColor,
  rgbToHsb,
  hsbToRgb,
  type ColorSaveFormat,
  type Rgba,
} from './colorProfile';

export interface ColorPickerProps {
  id: string;
  value: unknown;
  format: ColorSaveFormat;
  disabled: boolean;
  clearable: boolean;
  label: string;
  title: string;
  required?: boolean;
  invalid: boolean;
  describedBy?: string;
  onfocus?: () => void;
  onblur?: () => void;
  onchange(value: string): void;
  onclear(): void;
}

export function useColorPickerHint(
  props: ColorPickerProps,
  fit: (trigger: HTMLElement) => void,
  hoverDelay: number,
  onEscape?: () => void,
) {
  let focused = $state(false);
  let hovered = $state(false);
  let dismissed = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  function dismiss(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      dismissed = true;
      onEscape?.();
    }
  }
  onMount(() => () => {
    clearTimeout(timer);
    window.removeEventListener('keydown', dismiss, true);
  });
  return {
    get open() {
      return (focused || hovered) && !dismissed;
    },
    get trigger() {
      return {
        id: props.id,
        disabled: props.disabled,
        title: props.title,
        'aria-label': props.label,
        'aria-required': props.required || undefined,
        'aria-invalid': props.invalid,
        'aria-describedby': props.describedBy,
        onfocus(event: FocusEvent) {
          props.onfocus?.();
          fit(event.currentTarget as HTMLElement);
          focused = true;
          dismissed = false;
          window.addEventListener('keydown', dismiss, true);
        },
        onblur() {
          props.onblur?.();
          focused = false;
          window.removeEventListener('keydown', dismiss, true);
        },
        onpointerdown(event: PointerEvent) {
          fit(event.currentTarget as HTMLElement);
        },
      };
    },
    enter() {
      clearTimeout(timer);
      const show = () => {
        hovered = true;
        dismissed = false;
      };
      if (hoverDelay) timer = setTimeout(show, hoverDelay);
      else show();
    },
    leave() {
      clearTimeout(timer);
      hovered = false;
    },
  };
}

export function useRendererColorPicker(props: ColorPickerProps) {
  return useColorPicker({
    get identity() {
      return props.id;
    },
    get value() {
      return props.value;
    },
    get format() {
      return props.format;
    },
    get enabled() {
      return !props.disabled;
    },
    change: (value) => props.onchange(value),
  });
}

type View = 'hex' | 'rgb' | 'hsb';
type Binding = {
  readonly identity: string;
  readonly value: unknown;
  readonly format: ColorSaveFormat;
  readonly enabled: boolean;
  change(value: string): void;
};

/** Channel presentation is independent of the configured storage format. */
export function useColorPicker(binding: Binding) {
  let open = $state(false);
  let view = $state<View>('hex');
  let draft = $state<Record<string, string>>({});
  let problem = $state<'invalid' | 'hex3Transparency' | undefined>();
  let lastIdentity = untrack(() => binding.identity);
  let lastValue = untrack(() => binding.value);
  let lastFormat = untrack(() => binding.format);
  let committed: unknown;
  const parsed = $derived(parseColor(binding.value));
  $effect(() => {
    const identity = binding.identity;
    const value = binding.value;
    const format = binding.format;
    const enabled = binding.enabled;
    untrack(() => {
      if (!enabled || identity !== lastIdentity) open = false;
      if (
        !enabled ||
        identity !== lastIdentity ||
        format !== lastFormat ||
        (value !== lastValue && value !== committed)
      ) {
        draft = {};
        problem = undefined;
      }
      if (format !== lastFormat) view = format === 'hex3' ? 'hex' : format;
      lastIdentity = identity;
      lastValue = value;
      lastFormat = format;
    });
  });
  function setOpen(next: boolean) {
    if (next && !binding.enabled) return;
    if (next && !open) {
      view = binding.format === 'hex3' ? 'hex' : binding.format;
      draft = {};
      problem = undefined;
    }
    open = next;
  }
  function field(key: string): string {
    if (draft[key] !== undefined) return draft[key];
    if (!parsed) return key === 'alpha' ? '100' : '';
    if (key === 'hex') return serializeColor(parsed, 'hex')!;
    if (key === 'alpha') return String(Math.round(parsed.a * 100));
    if (view === 'rgb') return String(parsed[key as 'r' | 'g' | 'b']);
    const hsv = rgbToHsb(parsed);
    return String(Math.round(hsv[key as 'h' | 's' | 'b']));
  }
  function number(key: string, max: number) {
    const text = field(key);
    const value = Number(text);
    return text.trim() !== '' && Number.isFinite(value) && value >= 0 && value <= max
      ? value
      : undefined;
  }
  function input(key: string, value: string) {
    if (!binding.enabled) return;
    draft = { ...draft, [key]: value };
    let color: Rgba | undefined;
    const alpha = number('alpha', 100);
    if (view === 'hex') {
      color = /^#[\da-f]{3}(?:[\da-f]{3}(?:[\da-f]{2})?)?$/i.test(field('hex'))
        ? parseColor(field('hex'))
        : undefined;
      if (color && draft.alpha !== undefined && alpha !== undefined) color.a = alpha / 100;
    } else {
      const keys = view === 'rgb' ? ['r', 'g', 'b'] : ['h', 's', 'b'];
      const values = keys.map((channel, index) =>
        number(channel, view === 'rgb' ? 255 : index === 0 ? 360 : 100),
      );
      if (alpha !== undefined && values.every((channel) => channel !== undefined)) {
        const [a, b, c] = values as [number, number, number];
        if (view === 'rgb' && values.some((channel) => !Number.isInteger(channel)))
          color = undefined;
        else
          color = {
            ...(view === 'rgb' ? { r: a, g: b, b: c } : hsbToRgb(a, b, c)),
            a: draft.alpha === undefined && parsed ? parsed.a : alpha / 100,
          };
      }
    }
    if (!color || alpha === undefined) {
      problem = 'invalid';
      return;
    }
    const saved = serializeColor(color, binding.format);
    if (saved === undefined) {
      problem = 'hex3Transparency';
      return;
    }
    problem = undefined;
    committed = saved;
    binding.change(saved);
  }
  return {
    get open() {
      return open;
    },
    setOpen,
    get view() {
      return view;
    },
    setView(next: string) {
      if (!binding.enabled || !['hex', 'rgb', 'hsb'].includes(next)) return;
      view = next as View;
      draft = {};
      problem = undefined;
    },
    get problem() {
      return problem;
    },
    field,
    input,
    select(color: Rgba) {
      if (!binding.enabled) return;
      const saved = serializeColor(color, binding.format);
      if (saved === undefined) {
        problem = 'hex3Transparency';
        return;
      }
      draft = {};
      problem = undefined;
      committed = saved;
      binding.change(saved);
    },
  };
}

export function useColorPickerPopup(
  props: ColorPickerProps,
  hoverDelay: number,
  onEscape?: () => void,
) {
  const model = useRendererColorPicker(props);
  const popup = usePopupPlacement(512);
  const hint = useColorPickerHint(props, popup.fit, hoverDelay, onEscape);
  return { model, popup, hint };
}
