import { onDestroy, tick } from 'svelte';

const editorFocus =
  'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="combobox"]:not([aria-disabled="true"]), [role="radio"]:not([aria-disabled="true"]), [role="slider"]:not([aria-disabled="true"])';
const fallbackFocus = 'button:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href]';

/** Focus follows a dynamic renderer replacement only when it owned the old focus. */
export function useDynamicFocusTransfer(
  selected: () => unknown,
  boundary: () => HTMLElement | undefined,
  targetIdentity: () => unknown = () => undefined,
) {
  let previous: unknown;
  let previousTarget: unknown;
  let initialized = false;
  let lastFocused: Element | undefined;
  let generation = 0;
  onDestroy(() => generation++);
  $effect.pre(() => {
    const component = selected();
    const targetIdentityValue = targetIdentity();
    if (!initialized) {
      previous = component;
      previousTarget = targetIdentityValue;
      initialized = true;
      return;
    }
    if (component === previous && targetIdentityValue === previousTarget) return;
    previous = component;
    previousTarget = targetIdentityValue;
    const focused = lastFocused;
    const container = boundary();
    if (!focused || !container) return;
    const request = ++generation;
    void tick().then(() => {
      if (request !== generation || focused.isConnected || !container.isConnected) return;
      const root = container.getRootNode();
      const browserFallback =
        document.activeElement === document.body ||
        document.activeElement === container ||
        (root instanceof ShadowRoot && document.activeElement === root.host && !root.activeElement);
      if (!browserFallback) return;
      const target = [
        ...container.querySelectorAll(editorFocus),
        ...container.querySelectorAll(fallbackFocus),
      ].find(
        (element) =>
          element instanceof HTMLElement &&
          element.checkVisibility() &&
          !(element instanceof HTMLInputElement && element.type === 'hidden'),
      );
      if (target instanceof HTMLElement && target.checkVisibility()) {
        target.focus({ preventScroll: true });
        return;
      }
      let fallback = container.parentElement;
      while (fallback && getComputedStyle(fallback).display === 'contents')
        fallback = fallback.parentElement;
      if (!fallback) return;
      const original = fallback.getAttribute('tabindex');
      if (original === null) {
        fallback.setAttribute('tabindex', '-1');
        fallback.addEventListener('blur', () => fallback.removeAttribute('tabindex'), {
          once: true,
        });
      }
      fallback.focus({ preventScroll: true });
    });
  });
  return {
    onfocusout(event: FocusEvent) {
      // Removal may dispatch focusout without a destination. In that case the
      // post-update check still decides whether focus needs transferring.
      if (event.relatedTarget instanceof Node && !boundary()?.contains(event.relatedTarget))
        lastFocused = undefined;
      else if (event.target instanceof Element && !event.relatedTarget) {
        const departed = event.target;
        queueMicrotask(() => {
          if (departed.isConnected && lastFocused === departed) lastFocused = undefined;
        });
      }
    },
    onfocusin(event: FocusEvent) {
      if (event.target instanceof Element) lastFocused = event.target;
    },
  };
}

/** Restore focus after a temporary loading lock without taking it back from another control. */
export function useDynamicLoadingFocus(
  pending: () => boolean,
  boundary: () => HTMLElement | undefined,
) {
  let saved: HTMLElement | undefined;
  let generation = 0;
  onDestroy(() => generation++);
  $effect.pre(() => {
    const locked = pending();
    const container = boundary();
    const request = ++generation;
    if (!container) return;
    const root = container.getRootNode() as Document | ShadowRoot;
    if (locked) {
      const active = root.activeElement;
      if (active instanceof HTMLElement && container.contains(active)) saved = active;
      return;
    }
    const prior = saved;
    saved = undefined;
    if (!prior) return;
    void tick().then(() => {
      if (request !== generation || !container.isConnected) return;
      const active = root.activeElement;
      if (active && active !== document.body && active !== prior) return;
      const target = prior.isConnected
        ? prior
        : container.querySelector<HTMLElement>(`${editorFocus}, ${fallbackFocus}`);
      if (target?.checkVisibility() && !target.closest('[inert]'))
        target.focus({ preventScroll: true });
    });
  });
}
