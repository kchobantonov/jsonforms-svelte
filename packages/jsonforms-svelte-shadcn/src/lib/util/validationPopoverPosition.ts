export function validationPopoverPosition(
  trigger: HTMLElement,
  align: 'start' | 'end',
  height: number,
) {
  const bounds = trigger.getBoundingClientRect();
  const below = window.innerHeight - bounds.bottom;
  const above = bounds.top;
  const placeBelow = below >= Math.min(280, above);
  const width = Math.min(448, window.innerWidth * 0.8);
  const anchor = align === 'start' ? bounds.left : bounds.right - width;
  return {
    availableHeight: Math.max(80, Math.min(height, (placeBelow ? below : above) - 12)),
    left: Math.max(8, Math.min(anchor, window.innerWidth - width - 8)),
    top: placeBelow ? bounds.bottom + 4 : undefined,
    bottom: placeBelow ? undefined : window.innerHeight - bounds.top + 4,
  };
}
