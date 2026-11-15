import type { useRendererMessages } from '@chobantonov/jsonforms-svelte';

type Message = ReturnType<typeof useRendererMessages>;
type Owner = { root: HTMLElement; message: Message };
type Announcer = {
  owners: Map<HTMLElement, Owner>;
  active?: Owner;
  observer: MutationObserver;
  capture: (event: Event) => void;
  translate: (records: MutationRecord[]) => void;
};
const announcers = new WeakMap<Document, Announcer>();
const events = ['pointerdown', 'keydown', 'click'] as const;

/** Bits UI 2.18.1 has a document-wide date announcer without translation hooks. */
export function registerCalendarAnnouncements(root: HTMLElement, message: Message) {
  const document = root.ownerDocument;
  let state = announcers.get(document);
  if (!state) {
    const owners = new Map<HTMLElement, Owner>();
    const translate = (records: MutationRecord[]) => {
      const owner = state?.active;
      if (!owner) return;
      for (const record of records)
        for (const added of record.addedNodes) {
          if (added.nodeType !== 1) continue;
          const element = added as HTMLElement;
          if (!element.closest('[data-bits-announcer]')) continue;
          const text = element.textContent ?? '';
          // Match only the native Calendar messages, never other widgets' announcements.
          if (text.startsWith('Selected Date: ')) {
            element.textContent = owner.message('calendar.selectedDate', {
              date: text.slice('Selected Date: '.length),
            });
          } else if (text === 'Selected date is now empty.') {
            element.textContent = owner.message('calendar.emptySelection');
          }
        }
    };
    const capture = (event: Event) => {
      const path = event.composedPath();
      if (state) state.active = [...owners.values()].find((owner) => path.includes(owner.root));
    };
    const observer = new MutationObserver(translate);
    state = { owners, translate, capture, observer };
    announcers.set(document, state);
    observer.observe(document.body, { childList: true, subtree: true });
    for (const event of events) document.addEventListener(event, capture, true);
  }
  state.owners.set(root, { root, message });
  return () => {
    if (!state) return;
    // Selection can close/unmount the popup before the observer callback runs.
    state.translate(state.observer.takeRecords());
    state.owners.delete(root);
    if (state.active?.root === root) state.active = undefined;
    if (!state.owners.size) {
      state.observer.disconnect();
      for (const event of events) document.removeEventListener(event, state.capture, true);
      announcers.delete(document);
    }
  };
}
