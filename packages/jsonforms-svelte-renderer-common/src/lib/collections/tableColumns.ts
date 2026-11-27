import type { JsonSchema } from '@jsonforms/core';

export interface TableColumn {
  field: string;
  scope?: '#';
  width?: number;
  minWidth?: number;
  maxWidth?: number;
}

const positive = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;

/** Portable columns select presentation fields without narrowing the item schema. */
export function resolveTableColumns(schema: JsonSchema, option: unknown): TableColumn[] {
  if (!Array.isArray(option)) {
    return schema.type === 'object' && schema.properties
      ? Object.keys(schema.properties).map((field) => ({ field }))
      : [{ field: '', scope: '#' }];
  }
  const seen = new Set<string>();
  return option.flatMap((value: unknown) => {
    if (!value || typeof value !== 'object') return [];
    const column = value as Record<string, unknown>;
    if (typeof column.field !== 'string' || seen.has(column.field)) return [];
    seen.add(column.field);
    if (column.scope !== '#' && !Object.hasOwn(schema.properties ?? {}, column.field)) return [];
    const minWidth = positive(column.minWidth);
    const maxWidth = positive(column.maxWidth);
    const width = positive(column.width);
    return [
      {
        field: column.field,
        ...(column.scope === '#' ? { scope: '#' as const } : {}),
        ...(minWidth !== undefined ? { minWidth } : {}),
        ...(maxWidth !== undefined ? { maxWidth: Math.max(maxWidth, minWidth ?? 0) } : {}),
        ...(width !== undefined
          ? {
              width: Math.min(
                Math.max(width, minWidth ?? 0),
                Math.max(maxWidth ?? Infinity, minWidth ?? 0),
              ),
            }
          : {}),
      },
    ];
  });
}
