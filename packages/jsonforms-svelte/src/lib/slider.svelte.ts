import { type JsonSchema } from '@jsonforms/core';
import { useJsonForms } from './jsonFormsCompositions.svelte';
import { dataPathSegments, hasArrayParent } from './dataPath';
import { useRendererMessages } from './rendererMessages.svelte';
import { sliderState } from './slider';

interface SliderBinding {
  readonly data: unknown;
  readonly schema: JsonSchema;
  readonly path: string;
  readonly pathSegments?: readonly string[];
  readonly enabled: boolean;
  readonly clearable: boolean;
  readonly clearValue: unknown;
  onChange(value: unknown): void;
}

/** Native slider state; fallback thumb positions never become implicit form writes. */
export function useSliderInput(binding: SliderBinding) {
  const form = useJsonForms();
  const message = useRendererMessages();
  const state = $derived(sliderState(binding.schema, binding.data));
  const text = $derived(
    state.missing
      ? message('control.notSet')
      : state.invalid
        ? `${message('numeric.incompatibleValue')}: ${JSON.stringify(binding.data)}`
        : String(binding.data),
  );
  return {
    get state() {
      return state;
    },
    get valueText() {
      return text;
    },
    get error() {
      return state.usable ? undefined : message('slider.unavailable');
    },
    get enabled() {
      return binding.enabled && state.usable;
    },
    get canClear() {
      return binding.enabled && binding.clearable && binding.data !== undefined;
    },
    activateSingleValue(event: KeyboardEvent | PointerEvent) {
      if (!binding.enabled || !state.usable || state.minimum !== state.maximum) return;
      if (
        'key' in event &&
        !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' '].includes(event.key)
      )
        return;
      if ('button' in event && event.button !== 0) return;
      event.preventDefault();
      binding.onChange(state.minimum);
    },
    change(value: unknown) {
      if (binding.enabled && state.accepts(value)) binding.onChange(value);
    },
    clear() {
      if (!binding.enabled || !binding.clearable || binding.data === undefined) return;
      const parts = binding.pathSegments ?? dataPathSegments(binding.path);
      binding.onChange(hasArrayParent(form.core?.data, parts) ? 0 : binding.clearValue);
    },
  };
}
