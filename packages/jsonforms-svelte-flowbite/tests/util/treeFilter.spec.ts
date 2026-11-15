import { describe, expect, it } from 'vite-plus/test';
import {
  defaultFilter,
  filterTreeNodes,
  highlightMatch,
} from '../../src/lib/components/TreeView/filter';
import type { TreeNode } from '../../src/lib/components/TreeView/types';

describe('tree filtering with typed payloads', () => {
  const nodes: TreeNode<{ count: number; name: string }>[] = [
    {
      id: 'parent',
      label: 'Parent',
      children: [{ id: 'child', label: 'Child', data: { count: 42, name: 'София' } }],
    },
  ];

  it('keeps ancestors when a nested payload property matches', () => {
    const results = filterTreeNodes(nodes, 'соф', { filterKeys: 'data.name' });
    expect(results.map(({ node }) => node.id)).toEqual(['parent', 'child']);
    expect(results[1].matches['data.name']).toEqual([[0, 3]]);
    expect(results[1].node.data?.count).toBe(42);
  });

  it('supports numeric properties and missing payloads', () => {
    expect(
      filterTreeNodes(nodes, '42', { filterKeys: 'data.count' }).map(({ node }) => node.id),
    ).toEqual(['parent', 'child']);
    expect(filterTreeNodes(nodes, 'missing', { filterKeys: 'data.name' })).toEqual([]);
    expect(defaultFilter(null, 'null')).toBe(-1);
  });

  it('passes the original property value to custom filters', () => {
    const values: unknown[] = [];
    const results = filterTreeNodes(nodes, '42', {
      filterKeys: 'data.count',
      customFilter(value, query) {
        values.push(value);
        return typeof value === 'number' && value === Number(query);
      },
    });
    expect(results.map(({ node }) => node.id)).toEqual(['parent', 'child']);
    expect(values).toContain(42);
    expect(values).toContain(undefined);
  });

  it('highlights repeated matches and restores plain text without matches', () => {
    const results = filterTreeNodes([{ id: 'name', label: 'Ada Ada' }], 'ada');
    expect(highlightMatch('Ada Ada', results[0].matches.label)).toEqual([
      { text: 'Ada', highlight: true },
      { text: ' ', highlight: false },
      { text: 'Ada', highlight: true },
    ]);
    expect(highlightMatch('Ada Ada', undefined)).toEqual([{ text: 'Ada Ada', highlight: false }]);
  });
});
