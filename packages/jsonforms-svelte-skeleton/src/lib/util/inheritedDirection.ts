export type TextDirection = 'ltr' | 'rtl';

/** Keep native widgets aligned with the nearest host/container direction. */
export function observeInheritedDirection(
  node: HTMLElement,
  onChange: (direction: TextDirection) => void,
) {
  const update = () => onChange(getComputedStyle(node).direction === 'rtl' ? 'rtl' : 'ltr');
  const observer = new MutationObserver(update);
  let ancestor: Node | null = node;
  while (ancestor) {
    if (ancestor instanceof Element) {
      observer.observe(ancestor, {
        attributes: true,
        attributeFilter: ['dir', 'class', 'style'],
      });
    }
    ancestor = ancestor.parentNode ?? (ancestor instanceof ShadowRoot ? ancestor.host : null);
  }
  update();
  return { destroy: () => observer.disconnect() };
}
