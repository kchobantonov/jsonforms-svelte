import { describe, expect, it } from 'vite-plus/test';
import { tuplePositionIndex, tuplePlacedPositions } from './tuplePositionLayout';

describe('tuple layout scopes', () => {
  it('addresses declared positions in both schema drafts', () => {
    expect(tuplePositionIndex('#/items/0', 2)).toBe(0);
    expect(tuplePositionIndex('#/prefixItems/1', 2)).toBe(1);
  });
  it.each([
    '#',
    '#/items',
    '#/items/2',
    '#/items/-1',
    '#/items/01',
    '#/items/0/name',
    '#/properties/0',
    '',
    undefined,
  ])('rejects undeclared or ambiguous scope %s', (scope) => {
    expect(tuplePositionIndex(scope, 2)).toBeUndefined();
  });
});

it('collects nested layout scopes without interpreting per-position dialog scopes', () => {
  expect([
    ...tuplePlacedPositions(
      {
        type: 'Group',
        elements: [
          {
            type: 'Control',
            scope: '#/items/1',
            options: { detail: { type: 'Control', scope: '#/items/0' } },
          },
          { type: 'HorizontalLayout', elements: [{ type: 'Control', scope: '#/items/2' }] },
        ],
      } as import('@jsonforms/core').Layout,
      3,
    ),
  ]).toEqual([1, 2]);
});
