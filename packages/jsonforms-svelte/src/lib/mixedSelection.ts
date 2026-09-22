/** Reconcile JSON Forms dot-separated data paths after an explicit deletion. */
export function selectionAfterDelete(
  selected: string,
  deleted: string,
  parent: string,
  arrayIndex?: number,
): string {
  if (selected === deleted || selected.startsWith(deleted + '.')) return parent;
  if (arrayIndex === undefined) return selected;
  const prefix = parent ? parent + '.' : '';
  if (!selected.startsWith(prefix)) return selected;
  const relative = selected.slice(prefix.length);
  const [index, ...descendants] = relative.split('.');
  if (!/^\d+$/.test(index) || Number(index) <= arrayIndex) return selected;
  return prefix + [String(Number(index) - 1), ...descendants].join('.');
}
