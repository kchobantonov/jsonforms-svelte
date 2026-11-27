import {
  controlHelpVisible,
  clearButtonAttributes,
  joinDescriptionIds,
} from '@chobantonov/jsonforms-svelte-renderer-common';
import { useTranslator } from '@chobantonov/jsonforms-svelte';
import {
  controlDataSegments,
  useRendererMessages,
  type ControlProps,
  type useJsonFormsControl,
} from '@chobantonov/jsonforms-svelte-renderer-common';
import { durationCompletions, durationFieldMax, type DurationUnit } from './duration';
import { useDurationDraft } from './durationDraft.svelte';

interface DurationControlBinding {
  control: ReturnType<typeof useJsonFormsControl>['control'];
  appliedOptions: Record<string, unknown> & { placeholder?: string };
  controlWrapper: { persistentHint?: boolean };
  isFocused: boolean;
  initialFocus: boolean;
  clearable?: boolean;
  handleFocus(): void;
  handleBlur(): void;
  onChange(value: unknown): void;
}

export function useDurationControl(
  props: ControlProps,
  binding: DurationControlBinding,
  clearValue: unknown,
) {
  const t = useTranslator();
  const message = useRendererMessages();
  const editor = useDurationDraft({
    get value() {
      return binding.control.data;
    },
    get path() {
      return binding.control.path;
    },
    get pathSegments() {
      return controlDataSegments(props, binding.control.path);
    },
    get schema() {
      return binding.control.schema;
    },
    get enabled() {
      return binding.control.enabled && !binding.control.readonly;
    },
    get showActions() {
      return binding.appliedOptions.showActions !== false;
    },
    clearValue,
    onChange: (value) => binding.onChange(value),
  });
  const inputValue = $derived(editor.text);
  const completions = $derived(durationCompletions(editor.text));
  const showActions = $derived(binding.appliedOptions.showActions !== false);
  const handleInputChange = (value: string | null) => editor.update(value);
  const cancel = () => editor.cancel();
  const confirm = () => editor.confirm();

  const cancelLabel = $derived(
    typeof binding.appliedOptions.cancelLabel === 'string'
      ? t.value(binding.appliedOptions.cancelLabel, binding.appliedOptions.cancelLabel)
      : message('duration.cancel'),
  );
  const okLabel = $derived(
    typeof binding.appliedOptions.okLabel === 'string'
      ? t.value(binding.appliedOptions.okLabel, binding.appliedOptions.okLabel)
      : message('duration.ok'),
  );

  function inputAttributes(authoredDescription: unknown) {
    const helpVisible = controlHelpVisible(binding);

    return {
      type: 'text',
      oninput: (event: Event) => handleInputChange((event.target as HTMLInputElement).value),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      id: `${binding.control.id}-input`,
      disabled: !binding.control.enabled,
      readonly: binding.control.readonly,
      autofocus: binding.initialFocus,
      placeholder: binding.appliedOptions.placeholder,
      value: inputValue,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors || editor.invalidText,
      'aria-describedby': joinDescriptionIds(
        authoredDescription,
        helpVisible ? `${binding.control.id}-help` : undefined,
        editor.invalidText ? `${binding.control.id}-duration-draft` : undefined,
      ),
      list: `${binding.control.id}-duration-completions`,
    };
  }
  const disabled = $derived(!binding.control.enabled || !!binding.control.readonly);
  return {
    triggerAttributes(description: string | undefined) {
      const label = message('duration.open');
      return {
        disabled,
        title: label,
        'aria-label': label,
        'aria-describedby': description,
        onfocus: binding.handleFocus,
        onblur: binding.handleBlur,
      };
    },
    get clearButton() {
      return {
        disabled,
        ...clearButtonAttributes(message('control.clearValue'), () => handleInputChange(null)),
      };
    },
    editor,
    handleInputChange,
    cancel,
    confirm,
    inputAttributes,
    get disabled() {
      return disabled;
    },
    fieldAttributes(unit: DurationUnit) {
      return {
        type: 'number' as const,
        min: 0,
        max: durationFieldMax,
        step: 1,
        disabled: !binding.control.enabled || binding.control.readonly,
        value: editor.fields[unit] ?? '',
        oninput: (event: Event) =>
          editor.updateField(unit, (event.target as HTMLInputElement).value),
      };
    },
    cancelClick(event: MouseEvent) {
      event.stopPropagation();
      cancel();
    },
    confirmClick(event: MouseEvent) {
      event.stopPropagation();
      confirm();
    },
    get showClear() {
      return binding.clearable && inputValue !== undefined && inputValue !== '';
    },
    get inputValue() {
      return inputValue;
    },
    get completions() {
      return completions;
    },
    get showActions() {
      return showActions;
    },
    get cancelLabel() {
      return cancelLabel;
    },
    get okLabel() {
      return okLabel;
    },
  };
}
