import { useTextInput } from './textInput.svelte';

interface MaskEngine {
  masked(value: string): string;
  unmasked(value: string): string;
  isEager(): boolean;
}
type TextBinding = Parameters<typeof useTextInput>[0];

/** Use the reference mask engine with the shared Svelte draft/pending-edit lifecycle. */
export function useMaskedInput(
  binding: TextBinding,
  settings: {
    readonly engine: MaskEngine;
    readonly returnMaskedValue: boolean;
    readonly restrict: boolean;
  },
) {
  const stored = (value: string) =>
    settings.returnMaskedValue ? settings.engine.masked(value) : settings.engine.unmasked(value);
  const display = (data: unknown): string => {
    if (data == null) return '';
    const value = String(data);
    return stored(settings.engine.masked(value)) === value ? settings.engine.masked(value) : value;
  };
  // A changed mask invalidates an unfinished composition even if its display is unchanged.
  const schema = $derived.by(() => {
    void settings.engine;
    void settings.returnMaskedValue;
    return { ...binding.control.schema };
  });
  const text = useTextInput(
    {
      get control() {
        return { ...binding.control, data: display(binding.control.data), schema };
      },
      appliedOptions: { restrict: false },
      onChange: (value) => binding.onChange(stored(value)),
      handleBlur: binding.handleBlur,
    },
    0,
  );

  function normalize(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const raw = input.value;
    const caret = input.selectionStart;
    const deleting = (event as InputEvent).inputType?.startsWith('delete') ?? false;
    let masked =
      deleting && settings.engine.isEager() && settings.engine.unmasked(raw) === ''
        ? ''
        : settings.engine.masked(raw);
    const maximum = binding.control.schema.maxLength;
    const value = stored(masked);
    if (settings.restrict && typeof maximum === 'number' && Array.from(value).length > maximum) {
      const previous = String(binding.control.data ?? '');
      if (Array.from(value).length > Array.from(previous).length) masked = text.value;
    }
    input.value = masked;
    if (caret !== null && (caret !== raw.length || deleting)) {
      const count = settings.engine.unmasked(raw.slice(0, caret)).length;
      let next = deleting ? caret + masked.length - raw.length : 0;
      if (!deleting && count > 0) {
        next = masked.length;
        for (let index = 1; index <= masked.length; index++) {
          if (settings.engine.unmasked(masked.slice(0, index)).length >= count) {
            next = index;
            break;
          }
        }
      }
      input.setSelectionRange(Math.max(0, next), Math.max(0, next));
    }
  }
  return {
    get value() {
      return text.value;
    },
    clear: text.clear,
    onblur: text.onblur,
    oncompositionstart: text.oncompositionstart,
    oninput(event: Event) {
      if (
        binding.control.enabled &&
        !binding.control.readonly &&
        !text.isComposing &&
        !(event as InputEvent).isComposing
      )
        normalize(event);
      text.oninput(event);
    },
    oncompositionend(event: Event) {
      if (text.isComposing && binding.control.enabled && !binding.control.readonly)
        normalize(event);
      text.oncompositionend(event);
    },
  };
}
