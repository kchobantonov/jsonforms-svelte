import { controlHelpVisible, stringDescriptionIds } from './controlHelp';
import type { useJsonFormsControl } from '../core/jsonFormsCompositions.svelte';
import { untrack } from 'svelte';
import type { JsonSchema } from '@jsonforms/core';
import { registerDetailDialogChange } from '../interaction/detailDialog.svelte.js';
import { useRendererMessages } from '../locale/rendererMessages.svelte.js';
import { useUIDiagnosticReporter } from '../validation/authorDiagnostic.svelte.js';
import { numericBounds, numericBoundViolation, numericStep, parseNumericInput } from './numeric';

interface NumericBinding {
  readonly data: unknown;
  readonly path: string;
  readonly schema: JsonSchema;
  readonly options: Record<string, unknown>;
  readonly step: unknown;
  readonly enabled: boolean;
  readonly clearValue: unknown;
  onChange(value: unknown): void;
}
interface NumericIssue {
  key: string;
  params?: Record<string, unknown>;
}

/** Native numeric input with an isolated draft for rejected/incomplete entries. */
export function useNumericInput(binding: NumericBinding, integer: boolean) {
  const message = useRendererMessages();
  const reportDiagnostic = useUIDiagnosticReporter();
  const displayValue = (value: unknown) =>
    typeof value === 'number' || typeof value === 'string' ? value : undefined;
  let display = $state<string | number | null | undefined>(
    untrack(() => displayValue(binding.data)),
  );
  let draft = $state<{ text: string; badInput: boolean }>();
  let issue = $state<NumericIssue>();
  let lastExternal = untrack(() => binding.data);
  let lastPath = untrack(() => binding.path);
  let lastCommitted: unknown;
  let hasCommitted = false;
  const step = $derived(numericStep(binding.schema, binding.step, integer));
  let warnedStepPath: string | undefined;
  let warnedStepValue: unknown;
  let hasWarnedStep = false;
  $effect(() => {
    const invalid = step.invalid;
    const path = binding.path;
    const authored = binding.step;
    if (!invalid) {
      hasWarnedStep = false;
      return;
    }
    if (hasWarnedStep && warnedStepPath === path && Object.is(warnedStepValue, authored)) return;
    hasWarnedStep = true;
    warnedStepPath = path;
    warnedStepValue = authored;
    reportDiagnostic('numeric.invalidStep', {
      severity: 'warning',
      message: integer
        ? 'The explicit integer step must be a finite positive integer.'
        : 'The explicit number step must be a finite positive number.',
      details: {
        path,
        option: 'step',
        kind: integer ? 'integer' : 'number',
        valueType: typeof authored,
      },
    });
  });
  const restricted = $derived(binding.options.restrict !== false);
  const bounds = $derived(numericBounds(binding.schema));

  $effect(() => {
    const value = binding.data;
    const path = binding.path;
    if (path !== lastPath || !Object.is(value, lastExternal)) {
      if (path !== lastPath || !hasCommitted || !Object.is(value, lastCommitted)) {
        draft = undefined;
        issue = undefined;
        display = displayValue(value);
      }
      lastExternal = value;
      lastPath = path;
    }
  });

  function commit() {
    if (!binding.enabled || !draft) return;
    const parsed = draft.badInput
      ? ({ kind: 'invalid', reason: 'incomplete' } as const)
      : parseNumericInput(draft.text, integer);
    if (parsed.kind === 'invalid') {
      issue = { key: `numeric.${parsed.reason}` };
      return;
    }
    if (parsed.kind === 'value' && restricted) {
      const violation = numericBoundViolation(binding.schema, parsed.value, binding.data);
      if (violation) {
        const bound = bounds[violation]!;
        issue = {
          key: `numeric.${bound.exclusive ? 'exclusive' + (violation === 'minimum' ? 'Minimum' : 'Maximum') : violation}`,
          params: { limit: bound.value },
        };
        return;
      }
    }
    issue = undefined;
    lastCommitted = parsed.kind === 'empty' ? binding.clearValue : parsed.value;
    hasCommitted = true;
    binding.onChange(lastCommitted);
  }
  registerDetailDialogChange({
    flush: () => {
      if (issue) commit();
    },
    isBlocked: () => issue !== undefined,
  });

  return {
    get value(): string | number | null | undefined {
      return display;
    },
    // Svelte native component bindings report their own numeric value after
    // oninput. Echo that view value without interpreting it as form data.
    nativeValue(value: unknown) {
      display = value === null ? null : displayValue(value);
    },
    get hasValue() {
      return draft
        ? draft.badInput || draft.text !== ''
        : display !== undefined && display !== null && display !== '';
    },
    get step() {
      return step.value;
    },
    get minimum() {
      return restricted ? bounds.minimum?.value : undefined;
    },
    get maximum() {
      return restricted ? bounds.maximum?.value : undefined;
    },
    get error() {
      return issue ? message(issue.key, issue.params) : '';
    },
    input(event: Event) {
      if (!binding.enabled) return;
      const target = event.currentTarget as HTMLInputElement;
      draft = { text: target.value, badInput: target.validity.badInput };
      // Keep the last rendered prop during native incomplete entry. Reassigning
      // an empty value would erase the browser's internal sign/exponent draft.
      if (!draft.badInput) display = draft.text;
      commit();
    },
    blur() {
      if (issue) commit();
      if (!issue) {
        draft = undefined;
        display = displayValue(binding.data);
      }
    },
    clear() {
      if (!binding.enabled) return;
      draft = undefined;
      issue = undefined;
      display = displayValue(binding.clearValue);
      lastCommitted = binding.clearValue;
      hasCommitted = true;
      binding.onChange(lastCommitted);
    },
  };
}

export function useNumericControl(
  binding: Pick<ReturnType<typeof useJsonFormsControl>, 'control'> & {
    appliedOptions: Record<string, unknown>;
    onChange(value: unknown): void;
  },
  clearValue: unknown,
  integer: boolean,
) {
  return useNumericInput(
    {
      get data() {
        return binding.control.data;
      },
      get path() {
        return binding.control.path;
      },
      get schema() {
        return binding.control.schema;
      },
      get options() {
        return binding.appliedOptions;
      },
      get step() {
        return binding.control.uischema.options?.step;
      },
      get enabled() {
        return binding.control.enabled && !binding.control.readonly;
      },
      clearValue,
      onChange: binding.onChange,
    },
    integer,
  );
}

export function useNumericField(
  binding: Parameters<typeof useNumericControl>[0] &
    Parameters<typeof controlHelpVisible>[0] & {
      initialFocus: boolean;
      controlWrapper: { errors?: string };
      handleFocus(): void;
      handleBlur(): void;
    },
  clearValue: unknown,
  integer: boolean,
) {
  const numeric = useNumericControl(binding, clearValue, integer);
  const incompatible = $derived(
    binding.control.data != null && typeof binding.control.data !== 'number',
  );
  const hintId = $derived(`${binding.control.id}-incompatible-value`);
  return {
    numeric,
    get incompatible() {
      return incompatible;
    },
    get hintId() {
      return hintId;
    },
    get errors() {
      return [binding.controlWrapper.errors, numeric.error].filter(Boolean).join('\n');
    },
    attributes(existingDescription: unknown) {
      const help = controlHelpVisible(
        binding,
        !!binding.controlWrapper.errors?.trim() || !!numeric.error?.trim(),
      );
      return {
        type: 'number' as const,
        step: numeric.step,
        min: numeric.minimum,
        max: numeric.maximum,
        id: `${binding.control.id}-input`,
        disabled: !binding.control.enabled,
        readonly: binding.control.readonly,
        autofocus: binding.initialFocus,
        'aria-describedby':
          stringDescriptionIds(
            existingDescription,
            incompatible ? hintId : undefined,
            help ? `${binding.control.id}-help` : undefined,
          ) || undefined,
        oninput: numeric.input,
        onfocus: binding.handleFocus,
        onblur() {
          numeric.blur();
          binding.handleBlur();
        },
        required: binding.control.required,
        'aria-invalid': !!binding.control.errors || !!numeric.error,
      };
    },
  };
}
