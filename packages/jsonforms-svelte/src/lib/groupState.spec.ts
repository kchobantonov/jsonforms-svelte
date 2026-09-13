import { describe, it, expect } from 'vitest';
import { groupHasData, hasGroupValue } from './groupState.svelte';
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
