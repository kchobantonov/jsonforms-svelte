/** Place a picker on the side of its trigger with more viewport space. */
export function usePopupPlacement(initialHeight: number, maximumHeight = initialHeight) {
  let placement = $state<'top-start' | 'bottom-start'>('bottom-start');
  let maxHeight = $state(initialHeight);
  function fit(trigger: HTMLElement) {
    const view = trigger.ownerDocument.defaultView;
    if (!view) return;
    const bounds = trigger.getBoundingClientRect();
    const above = bounds.top - 12;
    const below = view.innerHeight - bounds.bottom - 12;
    placement = above > below ? 'top-start' : 'bottom-start';
    maxHeight = Math.max(64, Math.min(maximumHeight, Math.max(above, below) - 16));
  }
  return {
    fit,
    get placement() {
      return placement;
    },
    get maxHeight() {
      return maxHeight;
    },
  };
}
