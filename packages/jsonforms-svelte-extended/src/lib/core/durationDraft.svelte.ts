import { dataPathToPointer } from '@chobantonov/jsonforms-svelte';
import { onDestroy, untrack } from 'svelte';
import { registerDetailDialogChange, useOwnedErrors } from '@chobantonov/jsonforms-svelte';
import type { JsonSchema } from '@jsonforms/core';
import {
  durationComponentUnits,
  durationQuantity,
  emptyDurationParts,
  formatDuration,
  isWeeksDuration,
  parseDuration,
  sameDurationParts,
  type DurationMode,
  type DurationUnit,
} from './duration';

interface DurationBinding {
  readonly value: unknown;
  readonly path: string;
  readonly schema: JsonSchema;
  readonly enabled: boolean;
  readonly showActions: boolean;
  readonly clearValue: unknown;
  onChange(value: unknown): void;
}

/** Text and picker drafts never replace committed data with an incomplete quantity. */
export function useDurationDraft(binding: DurationBinding) {
  const owner = useOwnedErrors()?.createOwner();
  onDestroy(() => owner?.dispose());
  let text = $state(untrack(() => (typeof binding.value === 'string' ? binding.value : '')));
  let edited = $state(false);
  let open = $state(false);
  let mode = $state<DurationMode>('components');
  let active = $state<DurationUnit[]>(['hours']);
  let fields = $state<Partial<Record<DurationUnit, string>>>({ hours: '0' });
  let lastValue = untrack(() => binding.value);
  let lastPath = untrack(() => binding.path);
  let lastSchema = untrack(() => JSON.stringify(binding.schema));
  let committed: unknown = lastValue;
  const invalidText = $derived(edited && text !== '' && !parseDuration(text));
  const invalidFields = $derived(
    open && active.some((unit) => durationQuantity(fields[unit] ?? '') === undefined),
  );
  const invalid = $derived(binding.enabled && (invalidText || invalidFields));
  registerDetailDialogChange({ isBlocked: () => invalid });
  $effect(() => {
    // Pending state is separate from schema errors: no duplicate duration error is published.
    const blocked = invalid;
    const path = binding.path;
    untrack(() => {
      if (blocked) owner?.begin(dataPathToPointer(path), true);
      else owner?.clear();
    });
  });
  $effect(() => {
    const value = binding.value;
    const path = binding.path;
    const schema = JSON.stringify(binding.schema);
    const enabled = binding.enabled;
    untrack(() => {
      if (
        !enabled ||
        path !== lastPath ||
        schema !== lastSchema ||
        (value !== lastValue && value !== committed)
      ) {
        text = typeof value === 'string' ? value : '';
        edited = false;
        open = false;
      }
      lastValue = value;
      lastPath = path;
      lastSchema = schema;
    });
  });
  function commit(value: unknown) {
    committed = value;
    binding.onChange(value);
  }
  function initialize() {
    const parts = parseDuration(text) ?? parseDuration(binding.value) ?? { ...emptyDurationParts };
    mode = isWeeksDuration(text) ? 'weeks' : 'components';
    active =
      mode === 'weeks' ? ['weeks'] : durationComponentUnits.filter((unit) => parts[unit] > 0);
    if (!active.length) active = ['hours'];
    fields = Object.fromEntries(active.map((unit) => [unit, String(parts[unit])]));
  }
  function apply() {
    if (!binding.enabled || invalidFields) return;
    const parts = { ...emptyDurationParts };
    for (const unit of active) {
      const quantity = durationQuantity(fields[unit] ?? '');
      if (quantity === undefined) return;
      parts[unit] = quantity;
    }
    const current = parseDuration(binding.value);
    const equivalent =
      current &&
      sameDurationParts(current, parts) &&
      isWeeksDuration(binding.value) === (mode === 'weeks');
    const next = equivalent
      ? String(binding.value)
      : mode === 'weeks'
        ? `P${parts.weeks}W`
        : formatDuration(parts);
    text = next;
    edited = false;
    if (!equivalent) commit(next);
  }
  function immediate() {
    if (!binding.showActions) apply();
  }
  return {
    get text() {
      return text;
    },
    get invalidText() {
      return invalidText;
    },
    get invalidFields() {
      return invalidFields;
    },
    get mode() {
      return mode;
    },
    get active() {
      return active;
    },
    get fields() {
      return fields;
    },
    get available() {
      return durationComponentUnits.filter((unit) => !active.includes(unit));
    },
    get open() {
      return open;
    },
    set open(value: boolean) {
      if (value && !binding.enabled) return;
      if (value && !open) initialize();
      open = value;
    },
    update(value: string | null) {
      if (!binding.enabled) return;
      text = value ?? '';
      edited = true;
      if (!text) {
        edited = false;
        commit(binding.clearValue);
      } else if (parseDuration(text)) {
        edited = false;
        commit(text);
      }
    },
    setMode(value: DurationMode) {
      if (!binding.enabled || value === mode) return;
      mode = value;
      active = value === 'weeks' ? ['weeks'] : ['hours'];
      fields = { [active[0]]: '0' };
      immediate();
    },
    add(unit: DurationUnit) {
      if (!binding.enabled || mode !== 'components' || unit === 'weeks' || active.includes(unit))
        return;
      active = durationComponentUnits.filter(
        (candidate) => active.includes(candidate) || candidate === unit,
      );
      fields = { ...fields, [unit]: '0' };
      immediate();
    },
    remove(unit: DurationUnit) {
      if (!binding.enabled || mode === 'weeks' || active.length <= 1) return;
      active = active.filter((candidate) => candidate !== unit);
      immediate();
    },
    updateField(unit: DurationUnit, value: string) {
      if (!binding.enabled || !active.includes(unit)) return;
      fields = { ...fields, [unit]: value };
      immediate();
    },
    cancel() {
      open = false;
    },
    confirm() {
      if (!invalidFields && binding.enabled) {
        apply();
        open = false;
      }
    },
  };
}
