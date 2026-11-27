import { useOverrideControl, withReactiveProps } from '@chobantonov/jsonforms-svelte';
import type {
  JsonSchema,
  ControlElement,
  DispatchPropsOfControl,
  DispatchPropsOfMultiEnumControl,
} from '@jsonforms/core';
import { useControlInteraction } from '../interaction/controlInteraction.svelte';

export interface PresentationControl {
  schema: JsonSchema;
  data?: unknown;
  uischema: ControlElement;
  path: string;
  pathSegments?: readonly string[];
  config: unknown;
  label: string;
  description: string;
  required: boolean;
  errors: string;
  id: string;
  visible: boolean;
  enabled: boolean;
  readonly?: boolean;
}

export function useControlPresentation<
  I extends { control: PresentationControl } & (
    | DispatchPropsOfControl
    | DispatchPropsOfMultiEnumControl
  ),
  O extends Record<string, unknown> & { clearable?: boolean },
  S,
  Vendor extends object,
  V,
>(
  input: I,
  appliedOptions: { readonly value: O },
  styles: { readonly value: S },
  computedLabel: { readonly value: string },
  vendor: Vendor,
  adaptValue: (value: V) => unknown,
  debounceWait?: number,
  focusable?: () => boolean,
) {
  const interaction = useControlInteraction(
    input,
    appliedOptions,
    adaptValue,
    debounceWait,
    focusable,
  );
  const { onChange, handleBlur, handleFocus, persistentHint, initialFocus } = interaction;
  const overriddenInput = useOverrideControl(input, {
    get errors() {
      return interaction.errors;
    },
  });

  const controlWrapper = $derived({
    id: overriddenInput.control.id,
    schema: overriddenInput.control.schema,
    description: overriddenInput.control.description,
    errors: overriddenInput.control.errors,
    label: overriddenInput.control.uischema.label === false ? '' : overriddenInput.control.label,
    visible: overriddenInput.control.visible,
    required: overriddenInput.control.required,
    persistentHint: persistentHint(),
    isFocused: interaction.isFocused,
    get styles() {
      return styles.value;
    },
    get appliedOptions() {
      return appliedOptions.value;
    },
  });

  const clearable = $derived(
    (appliedOptions.value.clearable ?? true) && input.control.enabled && !input.control.readonly,
  );

  return withReactiveProps(overriddenInput, {
    get styles() {
      return styles.value;
    },
    get isFocused() {
      return interaction.isFocused;
    },
    get appliedOptions() {
      return appliedOptions.value;
    },
    initialFocus,
    get controlWrapper() {
      return controlWrapper;
    },
    onChange,
    ...vendor,
    persistentHint,
    get computedLabel() {
      return computedLabel.value;
    },
    get clearable() {
      return clearable;
    },
    get touched() {
      return interaction.touched;
    },
    handleBlur,
    handleFocus,
    focusEvents: interaction.focusEvents,
    get rawErrors() {
      return input.control.errors;
    },
  });
}
