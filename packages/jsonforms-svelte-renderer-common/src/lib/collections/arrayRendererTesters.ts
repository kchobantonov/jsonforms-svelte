import {
  and,
  hasType,
  isObjectArrayControl,
  isObjectArrayWithNesting,
  isPrimitiveArrayControl,
  or,
  rankWith,
  schemaMatches,
  schemaSubPathMatches,
  uiTypeIs,
  type JsonSchema,
  type RankedTester,
  type Tester,
} from '@jsonforms/core';
import { resolveSchema } from '../mixed/jsonTypeUtils';

const arrayItemsMatch = (matches: (item: JsonSchema) => boolean): Tester =>
  and(
    uiTypeIs('Control'),
    schemaMatches((schema) => hasType(schema, 'array') && !Array.isArray(schema.items)),
    schemaSubPathMatches('items', (item, root) => matches(resolveSchema(item, root))),
  );

const nullItems = arrayItemsMatch((item) => hasType(item, 'null'));
const nestedItems = arrayItemsMatch((item) => hasType(item, 'array'));
const composedItems = arrayItemsMatch((item) =>
  [item.oneOf, item.anyOf, item.allOf].some(
    (alternatives) => Array.isArray(alternatives) && alternatives.length > 0,
  ),
);
const simpleArray = or(isObjectArrayControl, isPrimitiveArrayControl, nullItems);
const tableArray = or(simpleArray, composedItems);
const wantsTable = (options: Record<string, unknown> | undefined) =>
  options?.table === true || options?.format === 'table';

export const arrayTableTester: RankedTester = (ui, schema, context) => {
  if (!tableArray(ui, schema, context)) return -1;
  return wantsTable(ui.options) ? 5 : 3;
};

export const arrayLayoutTester = rankWith(4, (ui, schema, context) => {
  if (nestedItems(ui, schema, context)) return true;
  if (composedItems(ui, schema, context) && !wantsTable(ui.options)) return true;
  if (!simpleArray(ui, schema, context)) return false;
  if (isObjectArrayWithNesting(ui, schema, context)) return true;
  const detail = ui.options?.detail;
  return (
    ui.options?.table === false ||
    (detail != null && !(typeof detail === 'string' && detail.toUpperCase() === 'DEFAULT'))
  );
});

export const enumArrayTester = rankWith(
  5,
  and(
    schemaMatches((schema) => schema.uniqueItems === true),
    arrayItemsMatch(
      (item) =>
        Array.isArray(item.enum) ||
        (Array.isArray(item.oneOf) &&
          item.oneOf.length > 0 &&
          item.oneOf.every((branch) => branch.const !== undefined)),
    ),
  ),
);
