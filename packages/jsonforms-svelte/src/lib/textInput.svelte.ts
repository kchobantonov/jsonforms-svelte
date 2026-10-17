import { onDestroy, untrack } from 'svelte';
import { registerDetailDialogChange } from './detailDialog.svelte';
import { useOwnedErrors } from './ownedErrors.svelte';

/** Keep native text drafts intact until an IME completes, then commit schema-length-safe edits. */
export function useTextInput(
  binding: {
    readonly control: {
      data: unknown;
      path: string;
      enabled: boolean;
      readonly?: boolean;
      schema: { maxLength?: number };
    };
    readonly appliedOptions: { restrict?: boolean };
    onChange: (value: string) => void;
    handleBlur: () => void;
  },
  delay = 300,
) {
  const display = (value: unknown) => (value == null ? '' : String(value));
  let value = $state(display(binding.control.data));
  let composing = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending = false;
  let beforeComposition = '';
  let observed = binding.control.data;
  let path = binding.control.path;
  let schema = binding.control.schema;
  let lastWritten: string | undefined;
  const owner = useOwnedErrors()?.createOwner();
  const editable = () => binding.control.enabled && !binding.control.readonly;

  function cancel() {
    clearTimeout(timer);
    timer = undefined;
    pending = false;
    composing = false;
    owner?.clear();
  }
  function flush() {
    if (composing || !pending) return;
    clearTimeout(timer);
    timer = undefined;
    pending = false;
    if (!editable() || path !== binding.control.path || schema !== binding.control.schema) return;
    if (!Object.is(observed, binding.control.data) && display(binding.control.data) !== lastWritten)
      return;
    value = restrictValue(value, display(observed));
    lastWritten = value;
    binding.onChange(value);
  }
  function restrictValue(next: string, previous: string) {
    const limit = binding.control.schema.maxLength;
    const points = Array.from(next);
    const before = Array.from(previous);
    if (
      !binding.appliedOptions.restrict ||
      typeof limit !== 'number' ||
      !Number.isInteger(limit) ||
      limit < 0 ||
      points.length <= limit
    )
      return next;
    // Imported invalid strings can be corrected without truncating unrelated characters.
    if (before.length > limit) return points.length <= before.length ? next : previous;
    let prefix = 0;
    while (prefix < before.length && before[prefix] === points[prefix]) prefix++;
    let suffix = 0;
    while (
      suffix < before.length - prefix &&
      before[before.length - suffix - 1] === points[points.length - suffix - 1]
    )
      suffix++;
    // Limit only the inserted text, retaining the unchanged text after the selection.
    const inserted = Math.max(0, limit - prefix - suffix);
    next =
      points.slice(0, prefix + inserted).join('') + (suffix ? points.slice(-suffix).join('') : '');
    return next;
  }
  function change(next: string) {
    if (!editable() || composing) return;
    next = restrictValue(next, value);
    if (next === value && !pending) return;
    value = next;
    pending = true;
    clearTimeout(timer);
    if (delay) timer = setTimeout(flush, delay);
    else flush();
  }
  function input(event: Event) {
    const target = event.currentTarget as HTMLInputElement | HTMLTextAreaElement;
    if (!editable()) {
      target.value = value;
      return;
    }
    if (composing || (event as InputEvent).isComposing) {
      value = target.value;
      return;
    }
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const direction = target.selectionDirection;
    const entered = target.value;
    change(target.value);
    if (target.value !== value) {
      target.value = value;
      const retainedPoints = Array.from(value);
      const enteredPoints = Array.from(entered);
      let matching = 0;
      while (
        matching < retainedPoints.length &&
        retainedPoints[matching] === enteredPoints[matching]
      )
        matching++;
      const prefix = retainedPoints.slice(0, matching).join('').length;
      const removed = entered.length - value.length;
      const position = (offset: number | null) =>
        Math.min(
          value.length,
          offset == null
            ? value.length
            : offset <= prefix
              ? offset
              : Math.max(prefix, offset - removed),
        );
      target.setSelectionRange(position(start), position(end), direction ?? undefined);
    }
  }
  $effect(() => {
    const data = binding.control.data;
    const nextPath = binding.control.path;
    const nextSchema = binding.control.schema;
    const enabled = editable();
    untrack(() => {
      if (!Object.is(data, observed) || path !== nextPath || schema !== nextSchema || !enabled) {
        const ownFeedback =
          enabled && path === nextPath && schema === nextSchema && display(data) === lastWritten;
        observed = data;
        path = nextPath;
        schema = nextSchema;
        if (!ownFeedback) {
          cancel();
          lastWritten = undefined;
          value = display(data);
        }
      }
    });
  });
  registerDetailDialogChange({ flush, cancel, isBlocked: () => composing });
  onDestroy(() => {
    cancel();
    owner?.dispose();
  });
  return {
    get value() {
      return value;
    },
    get isComposing() {
      return composing;
    },
    change,
    oninput: input,
    oncompositionstart() {
      if (!editable()) return;
      clearTimeout(timer);
      beforeComposition = value;
      composing = true;
      owner?.begin('', true);
    },
    oncompositionend(event: Event) {
      if (!composing) {
        (event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value = value;
        return;
      }
      composing = false;
      value = beforeComposition;
      owner?.clear();
      input(event);
    },
    onblur() {
      flush();
      binding.handleBlur();
    },
    clear() {
      cancel();
      change('');
      flush();
    },
  };
}
