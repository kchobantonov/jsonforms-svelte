import { describe, expect, it } from 'vite-plus/test';
import { resolveFileSizeBounds, violatedFileSizeBound } from './fileSizeBounds';

describe('file size bounds', () => {
  it('keeps inclusive and exclusive constraints active together', () => {
    const bounds = resolveFileSizeBounds(
      { formatMaximum: 6, formatMinimum: 1 },
      { formatExclusiveMaximum: 5, formatExclusiveMinimum: 2 },
    );
    expect(bounds).toEqual([
      { keyword: 'formatMaximum', limit: 6 },
      { keyword: 'formatExclusiveMaximum', limit: 5 },
      { keyword: 'formatMinimum', limit: 1 },
      { keyword: 'formatExclusiveMinimum', limit: 2 },
    ]);
    expect(violatedFileSizeBound(5, bounds)?.keyword).toBe('formatExclusiveMaximum');
    expect(violatedFileSizeBound(2, bounds)?.keyword).toBe('formatExclusiveMinimum');
    expect(violatedFileSizeBound(3, bounds)).toBeUndefined();
  });

  it('uses schema values for the same key and ignores nonfinite or negative bounds', () => {
    const bounds = resolveFileSizeBounds(
      { formatMaximum: '8', formatMinimum: -1 },
      { formatMaximum: 3, formatExclusiveMinimum: '2', formatMinimum: 1 },
    );
    expect(bounds).toEqual([
      { keyword: 'formatMaximum', limit: 8 },
      { keyword: 'formatMinimum', limit: 1 },
      { keyword: 'formatExclusiveMinimum', limit: 2 },
    ]);
  });
});
