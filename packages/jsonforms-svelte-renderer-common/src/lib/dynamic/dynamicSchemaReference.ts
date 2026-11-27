import type { JsonSchema } from '@jsonforms/core';

import { schemaChildren, isSchemaObject as object } from '../core/schemaChildren';

/** Dynamic scope cannot be preserved by JSON Forms' root-pointer resolver. */
export function dynamicSchemaReference(schema: JsonSchema): string | undefined {
  const seen = new WeakSet<object>();
  const find = (value: unknown): string | undefined => {
    if (!object(value) || seen.has(value)) return undefined;
    seen.add(value);
    if (typeof value.$dynamicRef === 'string') return value.$dynamicRef;
    for (const child of schemaChildren(value)) {
      const found = find(child);
      if (found !== undefined) return found;
    }
    return undefined;
  };
  return find(schema);
}
