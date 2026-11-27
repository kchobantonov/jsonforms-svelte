import { textInputAttributes, useTextInput } from './textInput.svelte';
import { getContext } from 'svelte';
import { CellPresentationContextSymbol } from '../core/types';
import type { useJsonFormsControl } from '../core/jsonFormsCompositions.svelte';
import { useRendererMessages } from '../locale/rendererMessages.svelte';

export function usePasswordControl(
  binding: Pick<ReturnType<typeof useJsonFormsControl>, 'control'> & {
    initialFocus: boolean;
    onChange(value: unknown): void;
    handleFocus(): void;
    handleBlur(): void;
  },
) {
  const cell = getContext<boolean>(CellPresentationContextSymbol) ?? false;
  const otpLength = $derived(binding.control.schema.maxLength);
  const segmented = $derived(
    !cell &&
      binding.control.uischema.options?.variant === 'otp' &&
      typeof binding.control.schema.minLength === 'number' &&
      typeof otpLength === 'number' &&
      Number.isInteger(otpLength) &&
      otpLength > 0 &&
      (binding.control.data === undefined ||
        (typeof binding.control.data === 'string' &&
          Array.from(binding.control.data).length <= otpLength)),
  );
  const message = useRendererMessages();
  function changeValue(value: unknown) {
    if (binding.control.enabled) binding.onChange(value);
  }
  return {
    changeValue,
    get otpLength() {
      return otpLength;
    },
    get segmented() {
      return segmented;
    },
    get showLabel() {
      return message('password.show');
    },
    get hideLabel() {
      return message('password.hide');
    },
    get clearLabel() {
      return message('control.clearValue');
    },
    segmentAttributes(revealed: boolean, describedBy: string | undefined) {
      return {
        value: typeof binding.control.data === 'string' ? binding.control.data : '',
        length: otpLength!,
        autofocus: binding.initialFocus,
        schema: binding.control.schema,
        path: binding.control.path,
        id: `${binding.control.id}-input`,
        label: binding.control.label ?? '',
        revealed,
        disabled: !binding.control.enabled,
        readonly: binding.control.readonly,
        invalid: !!binding.control.errors,
        describedBy,
        required: !!binding.control.required,
        onchange(value: string) {
          changeValue(value);
          binding.handleBlur();
        },
        onfocus: binding.handleFocus,
        onblur: binding.handleBlur,
      };
    },
  };
}

export function usePasswordField(
  binding: Parameters<typeof usePasswordControl>[0] &
    Parameters<typeof useTextInput>[0] &
    Parameters<typeof textInputAttributes>[0] & { clearable?: boolean },
) {
  const password = usePasswordControl(binding);
  const text = useTextInput(binding);
  let revealed = $state(false);
  return {
    password,
    text,
    segmentAttributes(description: Parameters<typeof password.segmentAttributes>[1]) {
      return password.segmentAttributes(revealed, description);
    },
    get revealed() {
      return revealed;
    },
    get showClear() {
      return text.showClear;
    },
    get toggleProps() {
      return {
        label: revealed ? password.hideLabel : password.showLabel,
        revealed,
        disabled: !binding.control.enabled,
        onclick: () => {
          revealed = !revealed;
        },
      };
    },
    inputAttributes(description: unknown) {
      return {
        type: revealed ? 'text' : 'password',
        ...textInputAttributes(binding, text, description),
        value: text.value,
      };
    },
    clearSegments(value: unknown) {
      password.changeValue(value);
      binding.handleBlur();
    },
  };
}
