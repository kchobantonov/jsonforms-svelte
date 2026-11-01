/** The generic flag and the legacy presentation-specific flag are ORed after option merging. */
export function showArraySortButtons(
  options: Record<string, unknown> | undefined,
  presentation: 'layout' | 'table',
): boolean {
  return (
    options?.showSortButtons === true ||
    options?.[
      presentation === 'layout' ? 'showArrayLayoutSortButtons' : 'showArrayTableSortButtons'
    ] === true
  );
}
