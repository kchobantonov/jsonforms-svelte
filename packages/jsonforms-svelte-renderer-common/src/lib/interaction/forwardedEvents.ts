/** Keep nested handlers from translating the same synthetic event twice. */
export function createEventForwarder() {
  const forwarded = new WeakSet<Event>();
  return {
    isForwarded: (event: Event) => forwarded.has(event),
    send(target: EventTarget, event: Event) {
      forwarded.add(event);
      target.dispatchEvent(event);
    },
    consume(event: Event) {
      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
    },
  };
}
