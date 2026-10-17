interface HandleOptions {
  resizable: boolean;
  label: string;
  nativeRtl?: boolean;
  minimumSizes?: number[];
  maximumSizes?: number[];
}

// Nested adapters must not translate the same forwarded event twice.
const forwarded = new WeakSet<Event>();

/** Flowbite 1.33.1 lacks RTL, disabled-handle and label props, and retains drag
 * listeners on removal. Keep native panels, constraints and resize state;
 * adapt only the immediate group's handles, never nested splitters.
 */
export function flowbiteSplitHandles(node: HTMLElement, initial: HandleOptions) {
  let options = initial;
  let active:
    | {
        cursor: string;
        userSelect: string;
        handle: HTMLElement;
        endType: 'mouseup' | 'touchend';
        rtl: boolean;
        touchId?: number;
      }
    | undefined;
  const handles = () =>
    Array.from(node.firstElementChild?.children ?? []).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element.getAttribute('role') === 'separator',
    );
  const ownedHandle = (event: Event) =>
    event.target instanceof Element
      ? handles().find((handle) => handle.contains(event.target as Node))
      : undefined;
  const isRtl = (handle: HTMLElement) =>
    !options.nativeRtl &&
    handle.getAttribute('aria-orientation') === 'vertical' &&
    getComputedStyle(handle).direction === 'rtl';
  const restore = (snapshot: { cursor: string; userSelect: string }) => {
    document.body.style.cursor = snapshot.cursor;
    document.body.style.userSelect = snapshot.userSelect;
  };
  const send = (target: EventTarget, event: Event) => {
    forwarded.add(event);
    target.dispatchEvent(event);
  };
  const consume = (event: Event) => {
    if (event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
  };
  const nativeEnd = (snapshot: NonNullable<typeof active>) =>
    snapshot.rtl ? 'mouseup' : snapshot.endType;
  const stop = () => {
    if (!active) return;
    const snapshot = active;
    active = undefined;
    send(window, new Event(nativeEnd(snapshot)));
    restore(snapshot);
  };
  const sync = () => {
    if (active && (!options.resizable || !node.contains(active.handle))) stop();
    for (const [index, handle] of handles().entries()) {
      handle.setAttribute('aria-valuemin', String(options.minimumSizes?.[index] ?? 0));
      handle.setAttribute('aria-valuemax', String(options.maximumSizes?.[index] ?? 100));
      handle.inert = !options.resizable;
      handle.tabIndex = options.resizable ? 0 : -1;
      handle.setAttribute('aria-label', options.label);
      handle.setAttribute('aria-disabled', String(!options.resizable));
      handle.style.cursor = options.resizable ? '' : 'default';
      const value = handle.getAttribute('aria-valuenow');
      if (value !== null) handle.setAttribute('aria-valuetext', `${value}%`);
    }
  };
  // Reflect only coordinates sent to the native resize handler. Original
  // browser events and DOM order remain unchanged. Touch uses the same native
  // mouse resize path, avoiding platform-dependent synthetic Touch constructors.
  const mouse = (type: string, point: { clientX: number; clientY: number }) =>
    new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      button: 0,
      buttons: type === 'mouseup' ? 0 : 1,
      clientX: -point.clientX,
      clientY: point.clientY,
    });
  const start = (event: Event) => {
    if (forwarded.has(event)) return;
    const handle = ownedHandle(event);
    if (!handle) return;
    if (!options.resizable) {
      consume(event);
      return;
    }
    if (event.type === 'mousedown' && (event as MouseEvent).button !== 0) {
      consume(event);
      return;
    }
    const rtl = isRtl(handle);
    if (event instanceof KeyboardEvent) {
      if (rtl && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        const translated = new KeyboardEvent(event.type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          key: event.key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft',
          repeat: event.repeat,
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
        });
        consume(event);
        send(handle, translated);
      }
      return;
    }
    const touch = event.type === 'touchstart' ? (event as TouchEvent).changedTouches[0] : undefined;
    if (event.type === 'touchstart' && (!touch || active)) {
      consume(event);
      return;
    }
    stop();
    active = {
      handle,
      rtl,
      touchId: touch?.identifier,
      endType: touch ? 'touchend' : 'mouseup',
      cursor: document.body.style.cursor,
      userSelect: document.body.style.userSelect,
    };
    if (rtl) {
      consume(event);
      send(handle, mouse('mousedown', touch ?? (event as MouseEvent)));
    }
  };
  const move = (event: Event) => {
    if (forwarded.has(event) || !active) return;
    if (
      !options.resizable ||
      !node.contains(active.handle) ||
      isRtl(active.handle) !== active.rtl
    ) {
      stop();
      return;
    }
    if (!active.rtl) return;
    if (event.type === 'mousemove' && active.endType === 'mouseup') {
      consume(event);
      send(window, mouse('mousemove', event as MouseEvent));
    } else if (event.type === 'touchmove' && active.endType === 'touchend') {
      const touch = Array.from((event as TouchEvent).touches).find(
        (touch) => touch.identifier === active?.touchId,
      );
      if (!touch) return;
      consume(event);
      send(window, mouse('mousemove', touch));
    }
  };
  const end = (event: Event) => {
    if (forwarded.has(event) || !active) return;
    if (
      event.type !== active.endType &&
      !(event.type === 'touchcancel' && active.endType === 'touchend')
    )
      return;
    if (active.rtl && active.endType === 'touchend') {
      const changed = Array.from((event as TouchEvent).changedTouches);
      if (changed.length && !changed.some((touch) => touch.identifier === active?.touchId)) return;
    }
    const snapshot = active;
    active = undefined;
    if (snapshot.rtl && snapshot.endType === 'touchend') {
      consume(event);
      send(window, new MouseEvent('mouseup'));
    }
    queueMicrotask(() => restore(snapshot));
  };
  const observer = new MutationObserver(sync);
  observer.observe(node, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-valuenow'],
  });
  node.addEventListener('mousedown', start, true);
  node.addEventListener('touchstart', start, { capture: true, passive: false });
  node.addEventListener('keydown', start, true);
  window.addEventListener('mousemove', move, true);
  window.addEventListener('touchmove', move, { capture: true, passive: false });
  window.addEventListener('mouseup', end);
  window.addEventListener('touchend', end, { capture: true, passive: false });
  window.addEventListener('touchcancel', end, true);
  window.addEventListener('blur', stop);
  sync();
  return {
    update(next: HandleOptions) {
      options = next;
      sync();
    },
    destroy() {
      stop();
      observer.disconnect();
      node.removeEventListener('mousedown', start, true);
      node.removeEventListener('touchstart', start, true);
      node.removeEventListener('keydown', start, true);
      window.removeEventListener('mousemove', move, true);
      window.removeEventListener('touchmove', move, true);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchend', end, true);
      window.removeEventListener('touchcancel', end, true);
      window.removeEventListener('blur', stop);
    },
  };
}
