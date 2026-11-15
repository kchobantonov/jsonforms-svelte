export interface RowDetailSelection {
  index: number;
  source: unknown;
}

/** Reconcile a selected occurrence without assigning duplicate values by position. */
export function reconcileRowDetailSelection(
  selection: RowDetailSelection | undefined,
  previous: readonly unknown[] | undefined,
  rows: readonly unknown[] | undefined,
): RowDetailSelection | undefined {
  if (!selection || rows === previous) return selection;
  if (!rows || !previous) return undefined;
  const matches = (values: readonly unknown[]) =>
    values.flatMap((value, index) => (Object.is(value, selection.source) ? [index] : []));
  const before = matches(previous);
  const after = matches(rows);
  // Equal primitive values and repeated object references identify values, not
  // occurrences. An external update provides no evidence of which one survived.
  if (before.length !== 1 || after.length > 1) return undefined;
  if (after.length === 1) return { index: after[0], source: selection.source };
  // Preserve the existing immutable edit behavior when only the selected row
  // changed. Structural changes and multi-row replacements invalidate selection.
  if (
    rows.length === previous.length &&
    rows.every((value, index) => index === selection.index || Object.is(value, previous[index]))
  ) {
    return { index: selection.index, source: rows[selection.index] };
  }
  return undefined;
}
