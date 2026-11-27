import { sliderDescriptionIds } from './controlHelp';
import { withReactiveProps } from '@chobantonov/jsonforms-svelte';
import { clearButtonAttributes } from './clearButton';
import type { ControlProps, useJsonFormsControl } from '../core/jsonFormsCompositions.svelte';
import { scopeDataSegments } from '../core/schemaScope';
import { type JsonSchema } from '@jsonforms/core';
import { useJsonForms } from '@chobantonov/jsonforms-svelte';
import { dataPathSegments, hasArrayParent } from '../core/dataPath.js';
import { useRendererMessages } from '../locale/rendererMessages.svelte.js';
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
  function clear() {
    if (!binding.enabled || !binding.clearable || binding.data === undefined) return;
    const parts = binding.pathSegments ?? dataPathSegments(binding.path);
    binding.onChange(hasArrayParent(form.core?.data, parts) ? 0 : binding.clearValue);
  }
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
    clear,
    get clearButton() {
      return clearButtonAttributes(message('control.clearValue'), clear);
    },
  };
}

export function useSliderControl(
  props: ControlProps,
  binding: Parameters<typeof sliderDescriptionIds>[0] &
    Pick<ReturnType<typeof useJsonFormsControl>, 'control'> & {
      clearable: boolean;
      onChange(value: unknown): void;
    },
  clearValue: unknown,
) {
  const slider = useSliderInput({
    get data() {
      return binding.control.data;
    },
    get schema() {
      return binding.control.schema;
    },
    get path() {
      return binding.control.path;
    },
    get pathSegments() {
      return [
        ...(props.pathSegments ?? dataPathSegments(props.path)),
        ...scopeDataSegments(props.uischema.scope),
      ];
    },
    get enabled() {
      return binding.control.enabled && !binding.control.readonly;
    },
    get clearable() {
      return binding.clearable;
    },
    clearValue,
    onChange: binding.onChange,
  });
  const stateId = $derived(`${binding.control.id}-slider-state`);
  return withReactiveProps(slider, {
    get stateId() {
      return stateId;
    },
    describedBy(authored: unknown, focused = binding.isFocused) {
      return sliderDescriptionIds(binding, authored, stateId, slider.error, focused);
    },
  });
}
