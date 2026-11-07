/** Shared array sort action setting. */
export function showArraySortButtons(options: Record<string, unknown> | undefined): boolean {
  return options?.showSortButtons === true;
}
