/** False and zero are data; empty containers and blank strings are not. */
export function hasGroupValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasGroupValue);
  if (typeof value === 'object') return Object.values(value).some(hasGroupValue);
  return true;
}
