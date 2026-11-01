const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Manage the demo's narrow example drawer without changing desktop sidebar focus. */
export function manageNarrowDrawerFocus(
  drawer: HTMLElement,
  trigger: HTMLElement | null,
  { focusFirst = true, trapTab = true }: { focusFirst?: boolean; trapTab?: boolean } = {},
): () => void {
  const focusables = () =>
    Array.from(drawer.querySelectorAll<HTMLElement>(focusableSelector)).filter(
      (element) => element.getClientRects().length > 0,
    );

  if (focusFirst) focusables()[0]?.focus({ preventScroll: true });

  const onKeydown = (event: KeyboardEvent) => {
    if (!trapTab || event.key !== 'Tab') return;
    const items = focusables();
    const first = items[0];
    const last = items.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  drawer.addEventListener('keydown', onKeydown);

  return () => {
    drawer.removeEventListener('keydown', onKeydown);
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  };
}
