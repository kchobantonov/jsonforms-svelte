import { tick } from 'svelte';
import type { PinInput } from 'bits-ui';
import { useTextInput } from '@chobantonov/jsonforms-svelte';

/** Adapt Bits UI's UTF-16 input boundary while retaining its native OTP presentation. */
export function usePasswordOtp(
  binding: Parameters<typeof useTextInput>[0],
  length: () => number,
  active: () => boolean,
) {
  const text = useTextInput(
    {
      get control() {
        return { ...binding.control, enabled: binding.control.enabled && active() };
      },
      get appliedOptions() {
        return { ...binding.appliedOptions, restrict: true };
      },
      onChange: (value) => {
        binding.onChange(value);
        binding.handleBlur();
      },
      handleBlur: () => binding.handleBlur(),
    },
    0,
  );
  let input = $state<HTMLInputElement | null>(null);

  function normalizeSelection() {
    if (!input || text.isComposing) return;
    const root = input.getRootNode() as Document | ShadowRoot;
    if (root.activeElement !== input) return;
    const points = Array.from(input.value);
    const boundaries = [0];
    for (const point of points) boundaries.push(boundaries.at(-1)! + point.length);
    let start = input.selectionStart ?? 0;
    let end = input.selectionEnd ?? start;
    const originalStart = start;
    const originalEnd = end;
    start = boundaries.findLast((offset) => offset <= start) ?? 0;
    end = boundaries.find((offset) => offset >= end) ?? input.value.length;
    if (start === end && end === input.value.length && points.length >= length()) {
      start = boundaries.at(-2) ?? 0;
    }
    if (start !== originalStart || end !== originalEnd) {
      input.setSelectionRange(start, end, input.selectionDirection ?? undefined);
    }
  }

  $effect(() => {
    if (!active()) input = null;
  });

  $effect(() => {
    const target = input;
    if (!target) return;
    const document = target.ownerDocument;
    const window = document.defaultView;
    // Bits UI listens in document capture. Let the IME own its selection until completion.
    const protectComposition = (event: Event) => {
      if (
        text.isComposing &&
        (target.getRootNode() as Document | ShadowRoot).activeElement === target
      )
        event.stopImmediatePropagation();
    };
    window?.addEventListener('selectionchange', protectComposition, true);
    document.addEventListener('selectionchange', normalizeSelection);
    return () => {
      window?.removeEventListener('selectionchange', protectComposition, true);
      document.removeEventListener('selectionchange', normalizeSelection);
    };
  });

  $effect(() => {
    if (text.isComposing) input?.removeAttribute('maxlength');
    else input?.setAttribute('maxlength', String(length() * 2));
  });

  return {
    get value() {
      return text.value;
    },
    cells(cells: PinInput.CellProps['cell'][]) {
      const points = Array.from(text.value);
      let offset = 0;
      return Array.from({ length: length() }, (_, index) => {
        const char = points[index] ?? null;
        const size = char?.length ?? 1;
        const native = cells.slice(offset, offset + size);
        offset += size;
        const isActive =
          native.some((cell) => cell.isActive) ||
          (index === length() - 1 && points.length === length() && !!cells[offset]?.isActive);
        return { char, isActive, hasFakeCaret: !char && isActive };
      });
    },
    oninputcapture(event: Event) {
      input = event.currentTarget as HTMLInputElement;
      // Native input events are not cancelable; capture prevents Bits' code-unit truncation.
      event.stopImmediatePropagation();
      text.oninput(event);
    },
    onpastecapture(event: ClipboardEvent) {
      event.stopImmediatePropagation();
      if (text.isComposing) return;
      event.preventDefault();
      const target = event.currentTarget as HTMLInputElement;
      if (!active() || !binding.control.enabled || binding.control.readonly) return;
      normalizeSelection();
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? start;
      const pasted = event.clipboardData?.getData('text/plain') ?? '';
      target.value = target.value.slice(0, start) + pasted + target.value.slice(end);
      target.setSelectionRange(start + pasted.length, start + pasted.length);
      text.oninput(event);
      void tick().then(normalizeSelection);
    },
    oncompositionstart(event: CompositionEvent) {
      input = event.currentTarget as HTMLInputElement;
      if (!active() || !binding.control.enabled || binding.control.readonly) return;
      input?.removeAttribute('maxlength');
      text.oncompositionstart();
    },
    oncompositionend(event: CompositionEvent) {
      text.oncompositionend(event);
      input?.setAttribute('maxlength', String(length() * 2));
      void tick().then(normalizeSelection);
    },
    onfocus(event: FocusEvent) {
      input = event.currentTarget as HTMLInputElement;
      void tick().then(normalizeSelection);
    },
    onkeydowncapture: normalizeSelection,
    onblur: text.onblur,
    clear: text.clear,
  };
}
