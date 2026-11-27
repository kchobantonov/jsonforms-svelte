import type { ControlProps, useJsonFormsControl } from '../core/jsonFormsCompositions.svelte';
import { scopeDataSegments } from '../core/schemaScope';
import { controlHelpVisible, joinDescriptionIds } from './controlHelp';
import { useJsonForms } from '@chobantonov/jsonforms-svelte';
import { dataPathSegments, hasArrayParent } from '../core/dataPath.js';
import { useRendererMessages } from '../locale/rendererMessages.svelte.js';

/** Keep absent and invalid values distinct from an explicit false answer. */
export function useBooleanState(data: () => unknown, path?: () => string | readonly string[]) {
  const form = useJsonForms();
  const parts = $derived.by(() => {
    const value = path?.() ?? '';
    return typeof value === 'string' ? dataPathSegments(value) : value;
  });
  const arrayItem = $derived(hasArrayParent(form.core?.data, parts));
  const message = useRendererMessages();
  const value = $derived(data());
  const committed = $derived(typeof value === 'boolean');
  const hint = $derived(
    committed ? undefined : message(value === undefined ? 'boolean.notSet' : 'boolean.invalid'),
  );
  return {
    get arrayItem() {
      return arrayItem;
    },
    describeWith(existing: unknown, stateId: string) {
      return (
        [
          typeof existing === 'string' ? existing : undefined,
          hint === undefined ? undefined : stateId,
        ]
          .filter(Boolean)
          .join(' ') || undefined
      );
    },
    get checked() {
      return value === true;
    },
    get indeterminate() {
      return !committed;
    },
    get hint() {
      return hint;
    },
  };
}

export function useBooleanControl(
  props: ControlProps,
  binding: Parameters<typeof controlHelpVisible>[0] & {
    control: ReturnType<typeof useJsonFormsControl>['control'];
    clearable: boolean | undefined;
    initialFocus?: boolean;
    handleFocus?: () => void;
    handleBlur?: () => void;
    onChange(value: unknown): void;
  },
  clearValue: unknown,
) {
  const state = useBooleanState(
    () => binding.control.data,
    () => [
      ...(props.pathSegments ?? dataPathSegments(props.path)),
      ...scopeDataSegments(props.uischema.scope),
    ],
  );
  const stateId = $derived(`${binding.control.id}-boolean-state`);
  const canClear = $derived(
    binding.control.visible && binding.clearable && binding.control.data !== undefined,
  );
  function describedBy(authored: unknown) {
    return joinDescriptionIds(
      state.describeWith(authored, stateId),
      controlHelpVisible(binding) ? `${binding.control.id}-help` : undefined,
    );
  }
  return {
    state,
    get stateId() {
      return stateId;
    },
    get canClear() {
      return canClear;
    },
    clear() {
      if (canClear) binding.onChange(state.arrayItem ? false : clearValue);
    },
    change(value: boolean) {
      if (binding.control.enabled && !binding.control.readonly) binding.onChange(value);
    },
    describedBy,
    inputAttributes(authored: unknown) {
      return {
        id: `${binding.control.id}-input`,
        autofocus: binding.initialFocus,
        'aria-required': binding.control.required,
        'aria-describedby': describedBy(authored) || undefined,
        'aria-label': binding.appliedOptions.hideControlWrapper ? binding.control.label : undefined,
        'aria-invalid': !!binding.control.errors,
        onfocus: binding.handleFocus,
        onblur: binding.handleBlur,
      };
    },
  };
}
