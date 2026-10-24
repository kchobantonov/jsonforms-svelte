import { expect, it } from 'vite-plus/test';
import { resolveTableColumns } from './tableColumns';
const schema = {
  type: 'object',
  properties: { name: { type: 'string' }, email: { type: 'string' } },
};
it('selects portable fields in order, keeps the first duplicate, and distinguishes empty from omitted', () => {
  expect(resolveTableColumns(schema, undefined).map((column) => column.field)).toEqual([
    'name',
    'email',
  ]);
  expect(resolveTableColumns(schema, [])).toEqual([]);
  expect(
    resolveTableColumns(schema, [
      { field: 'email', width: 120, minWidth: 100, maxWidth: 200 },
      { field: 'name' },
      { field: 'email', width: 300 },
      { field: 'unknown' },
    ]),
  ).toEqual([{ field: 'email', width: 120, minWidth: 100, maxWidth: 200 }, { field: 'name' }]);
});
it('supports whole-row presentation keys and bounded widths without mutating definitions', () => {
  const columns = [{ field: 'row', scope: '#', width: 30, minWidth: 100, maxWidth: 200 }];
  expect(resolveTableColumns(schema, columns)).toEqual([
    { field: 'row', scope: '#', width: 100, minWidth: 100, maxWidth: 200 },
  ]);
  expect(columns[0].width).toBe(30);
});
