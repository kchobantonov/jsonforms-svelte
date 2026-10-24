import { describe, it, expect } from 'vite-plus/test';
import { groupHasData, hasGroupValue, resolveCollapsed } from './groupState.svelte';
describe('group data presence', () => {
  it('distinguishes meaningful values from empty containers', () => {
    for (const value of [false, 0, 'text', [false], { count: 0 }])
      expect(hasGroupValue(value)).toBe(true);
    for (const value of [undefined, null, '', '  ', [], {}, { empty: [] }])
      expect(hasGroupValue(value)).toBe(false);
  });
  it('checks only bound descendants at the current data path', () => {
    const group = {
      type: 'Group',
      elements: [
        { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/a~1b' }] },
      ],
    };
    expect(groupHasData(group, { unrelated: 'present' })).toBe(false);
    expect(groupHasData(group, { 'a/b': false })).toBe(true);
    expect(groupHasData(group, { rows: [{ 'a/b': 0 }] }, 'rows.0')).toBe(true);
    expect(groupHasData(group, { rows: [{ 'a/b': '' }] }, 'rows.0')).toBe(false);
  });
});

it('includes list details and ignores inherited data properties', () => {
  const list = { type: 'ListWithDetail', scope: '#/properties/items' };
  expect(groupHasData(list, { items: [0] })).toBe(true);
  expect(groupHasData({ type: 'Control', scope: '#/properties/constructor' }, {})).toBe(false);
  expect(
    groupHasData({ type: 'Control', scope: '#/properties/constructor' }, { constructor: 'own' }),
  ).toBe(true);
});
it('resolves collapse defaults without flat configuration leaking into frames', () => {
  expect(resolveCollapsed(undefined, { collapsed: true }, 'group')).toBe(false);
  const config = { jsonformsExtended: { collapsed: true, group: { collapsed: false } } };
  expect(resolveCollapsed(undefined, config, 'group')).toBe(false);
  expect(resolveCollapsed(undefined, config, 'array')).toBe(true);
  expect(resolveCollapsed({ collapsed: true }, config, 'group')).toBe(true);
  expect(resolveCollapsed({ collapsed: false }, config, 'array')).toBe(false);
  expect(resolveCollapsed({ collapsed: 'invalid' }, config, 'array')).toBe(true);
});

it('reads repeated escaped tildes without reading a different literal member', () => {
  const control = { type: 'Control', scope: '#/properties/a~0b~0c' };
  expect(groupHasData(control, { 'a~b~c': 'present' })).toBe(true);
  expect(groupHasData(control, { 'a~b~0c': 'other' })).toBe(false);
});
