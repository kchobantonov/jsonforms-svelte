import isEqual from 'lodash/isEqual';

export interface EnumChoice {
  value: unknown;
  label: string;
}

/** Native UI values are opaque IDs; JSON values never serve as DOM keys. */
export function enumChoices<T extends EnumChoice>(options: readonly T[] | undefined) {
  return (options ?? []).map((option, index) => ({ ...option, id: `choice-${index}` }));
}

/** Compare JSON content so a parsed host replacement retains its selection. */
export function selectedEnumId(options: readonly EnumChoice[] | undefined, value: unknown): string {
  const index = (options ?? []).findIndex((option) => isEqual(option.value, value));
  return index < 0 ? '' : `choice-${index}`;
}

export function hasEnumValue(data: unknown, value: unknown): boolean {
  return Array.isArray(data) && data.some((item) => isEqual(item, value));
}

export function addEnumValue(data: unknown, value: unknown): unknown[] {
  if (data === undefined || data === null) return [value];
  if (Array.isArray(data)) return hasEnumValue(data, value) ? data : [...data, value];
  return [data, value];
}

export function removeEnumValue(data: unknown, value: unknown): unknown {
  if (data === undefined || data === null) return data;
  if (Array.isArray(data)) {
    const index = data.findIndex((item) => isEqual(item, value));
    return index < 0 ? data : data.filter((_, itemIndex) => itemIndex !== index);
  }
  return isEqual(data, value) ? [] : [data];
}

/** Keep imported out-of-domain members visible and removable without changing their values. */
export function enumChoicesWithImportedValues(
  options: readonly EnumChoice[] | undefined,
  data: unknown,
): EnumChoice[] {
  const result = [...(options ?? [])];
  if (Array.isArray(data)) {
    for (const value of data) {
      if (result.some((option) => isEqual(option.value, value))) continue;
      result.push({
        value,
        label: typeof value === 'string' ? value : (JSON.stringify(value) ?? String(value)),
      });
    }
  }
  return result;
}

export function enumChoiceDisabled(
  data: unknown,
  value: unknown,
  schema: { minItems?: number; maxItems?: number },
  restrict: boolean,
): boolean {
  if (!restrict) return false;
  const count = Array.isArray(data) ? data.length : 0;
  return hasEnumValue(data, value)
    ? schema.minItems !== undefined && count <= schema.minItems
    : schema.maxItems !== undefined && count >= schema.maxItems;
}
