import {
  controlHelpVisible,
  joinDescriptionIds,
} from '@chobantonov/jsonforms-svelte-renderer-common';
import { useTranslator, useJsonForms } from '@chobantonov/jsonforms-svelte';
import type { useJsonFormsControl } from '@chobantonov/jsonforms-svelte-renderer-common';
import { untrack } from 'svelte';
import {
  isTransparentColor,
  parseColor,
  serializeColor,
  resolveColorOptions,
  colorMessage,
} from './color';

interface ColorBinding {
  control: ReturnType<typeof useJsonFormsControl>['control'];
  handleBlur(): void;
  onChange(value: unknown): void;
}

export function useColorEditor(binding: ColorBinding, clearValue: unknown) {
  const form = useJsonForms();
  const t = useTranslator();
  const profile = $derived(
    resolveColorOptions(binding.control.config, binding.control.uischema.options),
  );
  const hex3 = $derived(profile.saveFormat === 'hex3');
  const message = (key: Parameters<typeof colorMessage>[1]) => {
    const translationKey =
      key === 'choose'
        ? 'editor.chooseColor'
        : key === 'clear'
          ? 'control.clearValue'
          : `color.${key}`;
    return (
      t.value(translationKey, colorMessage(form.i18n?.locale, key)) ??
      colorMessage(form.i18n?.locale, key)
    );
  };
  let draftText = $state<string | undefined>();
  const inputValue = $derived(
    draftText ??
      (typeof binding.control.data === 'string'
        ? binding.control.data
        : binding.control.data === undefined
          ? ''
          : JSON.stringify(binding.control.data)),
  );
  const transparentHex3 = $derived(hex3 && isTransparentColor(inputValue));
  const invalidText = $derived(inputValue !== '' && !parseColor(inputValue));
  const placeholder = $derived(
    t.value(
      `color.placeholder.${profile.saveFormat}`,
      {
        hex: '#RRGGBB',
        hex3: '#RGB',
        rgb: 'rgb(0, 128, 255)',
        hsb: 'hsb(210, 100%, 100%)',
      }[profile.saveFormat],
    ),
  );
  const settings = () =>
    JSON.stringify([
      binding.control.path,
      binding.control.enabled,
      binding.control.readonly,
      profile.saveFormat,
      profile.textEntry,
    ]);
  let lastSettings = untrack(settings);
  let lastExternal = untrack(() => JSON.stringify(binding.control.data));
  let lastCommitted: string | undefined;
  $effect(() => {
    const nextSettings = settings();
    const nextExternal = JSON.stringify(binding.control.data);
    if (
      nextSettings !== lastSettings ||
      (nextExternal !== lastExternal && binding.control.data !== lastCommitted)
    ) {
      draftText = undefined;
      lastCommitted = undefined;
    }
    lastSettings = nextSettings;
    lastExternal = nextExternal;
  });

  function handleTextInput(event: Event) {
    if (!binding.control.enabled || binding.control.readonly) return;
    const input = event.currentTarget as HTMLInputElement;
    if (input.value === '') {
      draftText = undefined;
      binding.onChange(clearValue);
      return;
    }
    const parsed = parseColor(input.value);
    const saved = parsed && serializeColor(parsed, profile.saveFormat);
    if (saved === undefined) {
      draftText = input.value;
      return;
    }
    // A valid three-digit prefix must not expand under the user's caret
    // while they are still typing a six- or eight-digit color.
    draftText = input.value;
    lastCommitted = saved;
    binding.onChange(saved);
  }

  function handleTextBlur() {
    binding.handleBlur();
    if (parseColor(inputValue) && !transparentHex3) draftText = undefined;
  }

  function clearColor() {
    if (!binding.control.enabled || binding.control.readonly) return;
    draftText = undefined;
    binding.onChange(clearValue);
  }

  function selectColor(value: string | undefined) {
    draftText = undefined;
    binding.onChange(value);
  }
  return {
    inputProps(
      presentation: Parameters<typeof controlHelpVisible>[0] & {
        appliedOptions: { placeholder?: string };
        initialFocus: boolean;
        handleFocus(): void;
      },
      description: unknown,
    ) {
      return {
        type: 'text' as const,
        placeholder: presentation.appliedOptions.placeholder ?? placeholder,
        id: `${binding.control.id}-input`,
        disabled: !binding.control.enabled,
        readonly: binding.control.readonly,
        autofocus: presentation.initialFocus,
        value: inputValue,
        oninput: handleTextInput,
        onfocus: presentation.handleFocus,
        onblur: handleTextBlur,
        required: binding.control.required,
        'aria-invalid': !!binding.control.errors || invalidText || transparentHex3,
        'aria-describedby': joinDescriptionIds(
          description,
          controlHelpVisible(presentation) ? `${binding.control.id}-help` : undefined,
          invalidText || transparentHex3 ? `${binding.control.id}-color-error` : undefined,
        ),
      };
    },
    pickerProps(clearable: boolean, onfocus: () => void, describedBy: string | undefined) {
      const title = message(inputValue === '' ? 'chooseEmpty' : 'choose');
      return {
        id: `${binding.control.id}-${profile.textEntry ? 'picker' : 'input'}`,
        value: binding.control.data,
        format: profile.saveFormat,
        disabled: !binding.control.enabled || binding.control.readonly === true,
        clearable,
        required: binding.control.required,
        invalid: !!binding.control.errors || invalidText || transparentHex3,
        describedBy,
        onfocus,
        onblur: binding.handleBlur,
        label: profile.textEntry ? title : binding.control.label || message('choose'),
        title,
        onchange: selectColor,
        onclear: clearColor,
      };
    },
    handleTextInput,
    handleTextBlur,
    clearColor,
    selectColor,
    message,
    get profile() {
      return profile;
    },
    get inputValue() {
      return inputValue;
    },
    get transparentHex3() {
      return transparentHex3;
    },
    get invalidText() {
      return invalidText;
    },
    get placeholder() {
      return placeholder;
    },
  };
}
