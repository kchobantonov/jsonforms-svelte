import { expect, it } from 'vitest';
import { selectionAfterDelete } from './mixedSelection';
it.each([
  ['root.itemCode', 'root.item', 'root', undefined, 'root.itemCode'],
  ['root.item.name', 'root.item', 'root', undefined, 'root'],
  ['root.item', 'root.item', 'root', undefined, 'root'],
  ['people.2.name', 'people.0', 'people', 0, 'people.1.name'],
  ['people.10', 'people.1', 'people', 1, 'people.9'],
  ['people.1.name', 'people.1', 'people', 1, 'people'],
  ['people.0', 'people.1', 'people', 1, 'people.0'],
  ['people', 'people.1', 'people', 1, 'people'],
  ['peopleCode.2', 'people.1', 'people', 1, 'peopleCode.2'],
  ['2.name', '0', '', 0, '1.name'],
])('reconciles %s after deleting %s', (selected, deleted, parent, index, expected) => {
  expect(
    selectionAfterDelete(
      selected as string,
      deleted as string,
      parent as string,
      index as number | undefined,
    ),
  ).toBe(expected);
});
