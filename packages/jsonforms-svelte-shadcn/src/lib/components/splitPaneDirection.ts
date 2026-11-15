// PaneForge 1.0.2 checks document.dir instead of the group's computed direction.
// Translate only mismatched horizontal input; native panes retain all resize state.
const forwarded = new WeakSet<Event>();

export function splitPaneDirection(node: HTMLElement) {
  const doc = node.ownerDocument;
  const win = doc.defaultView!;
  let active: { handle: HTMLElement; touchId?: number } | undefined;
  const mismatched = (handle: HTMLElement) =>
    handle.dataset.direction === 'horizontal' &&
    (getComputedStyle(handle).direction === 'rtl') !== (doc.dir === 'rtl');
  const send = (target: EventTarget, event: Event) => {
    forwarded.add(event);
    target.dispatchEvent(event);
  };
  const consume = (event: Event) => {
    if (event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
  };
  const mouse = (type: string, point: { clientX: number; clientY: number }) =>
    new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      button: 0,
      buttons: 1,
      clientX: -point.clientX,
      clientY: point.clientY,
    });
  const stop = () => {
    if (!active) return;
    active = undefined;
    send(win, new MouseEvent('mouseup'));
  };
  const start = (event: Event) => {
    if (forwarded.has(event) || !(event.target instanceof Element)) return;
    const handle = event.target.closest<HTMLElement>('[data-pane-resizer]');
    if (
      !handle ||
      handle.closest('[data-pane-group]') !== node.firstElementChild ||
      handle.dataset.enabled === 'false' ||
      !mismatched(handle)
    )
      return;
    if (event instanceof KeyboardEvent) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      consume(event);
      send(
        handle,
        new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          composed: true,
          key: event.key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft',
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
          repeat: event.repeat,
        }),
      );
      return;
    }
    const touch = event.type === 'touchstart' ? (event as TouchEvent).changedTouches[0] : undefined;
    if (event instanceof MouseEvent && event.button !== 0) return;
    if (event.type === 'touchstart' && (!touch || active)) {
      consume(event);
      return;
    }
    stop();
    active = { handle, touchId: touch?.identifier };
    consume(event);
    send(handle, mouse('mousedown', touch ?? (event as MouseEvent)));
  };
  const move = (event: Event) => {
    if (forwarded.has(event) || !active) return;
    if (
      !node.contains(active.handle) ||
      active.handle.dataset.enabled === 'false' ||
      !mismatched(active.handle)
    ) {
      stop();
      return;
    }
    const touch =
      event.type === 'touchmove'
        ? Array.from((event as TouchEvent).touches).find(
            (touch) => touch.identifier === active?.touchId,
          )
        : undefined;
    if (event.type === 'touchmove' && !touch) {
      if (active.touchId !== undefined) consume(event);
      return;
    }
    if (event.type === 'mousemove' && active.touchId !== undefined) return;
    consume(event);
    send(doc.body, mouse('mousemove', touch ?? (event as MouseEvent)));
  };
  const end = (event: Event) => {
    if (forwarded.has(event) || !active) return;
    if (event.type === 'mouseup') {
      if (active.touchId === undefined) active = undefined;
      return;
    }
    if (active.touchId === undefined) return;
    consume(event);
    const changed = Array.from((event as TouchEvent).changedTouches);
    if (changed.length && !changed.some((touch) => touch.identifier === active?.touchId)) return;
    stop();
  };
  node.addEventListener('keydown', start, true);
  node.addEventListener('mousedown', start, true);
  node.addEventListener('touchstart', start, { capture: true, passive: false });
  win.addEventListener('mousemove', move, true);
  win.addEventListener('touchmove', move, { capture: true, passive: false });
  win.addEventListener('mouseup', end, true);
  win.addEventListener('touchend', end, { capture: true, passive: false });
  win.addEventListener('touchcancel', end, true);
  win.addEventListener('blur', stop);
  return {
    destroy() {
      stop();
      node.removeEventListener('keydown', start, true);
      node.removeEventListener('mousedown', start, true);
      node.removeEventListener('touchstart', start, true);
      win.removeEventListener('mousemove', move, true);
      win.removeEventListener('touchmove', move, true);
      win.removeEventListener('mouseup', end, true);
      win.removeEventListener('touchend', end, true);
      win.removeEventListener('touchcancel', end, true);
      win.removeEventListener('blur', stop);
    },
  };
}
