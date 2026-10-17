import { untrack } from 'svelte';
import type { JsonSchema } from '@jsonforms/core';
import { registerDetailDialogChange } from './detailDialog.svelte';
import { useRendererMessages } from './rendererMessages.svelte';
import { numericBounds, numericBoundViolation, numericStep, parseNumericInput } from './numeric';

interface NumericBinding {
  readonly data: unknown;
  readonly path: string;
  readonly schema: JsonSchema;
  readonly options: Record<string, unknown>;
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
  const step = $derived(numericStep(binding.schema, binding.options.step, integer));
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
    get diagnostic() {
      return step.invalid ? message(integer ? 'numeric.integerStep' : 'numeric.step') : '';
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
