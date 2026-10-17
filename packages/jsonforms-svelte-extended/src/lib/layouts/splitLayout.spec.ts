import { expect, it } from 'vitest';
import { initialSplitSizes, splitCssSize, resolveSplitSizing } from './splitLayout';
const pane = (layout = {}) => ({ type: 'Control', options: { layout } });
it('uses authored weights and Auto shares', () => {
  expect(initialSplitSizes([pane({ weight: 2 }), pane()])).toEqual([
    expect.closeTo(200 / 3, 6),
    expect.closeTo(100 / 3, 6),
  ]);
  expect(initialSplitSizes([])).toEqual([]);
});
it('falls back from spans and invalid weights without creating a splitter grid', () => {
  expect(
    initialSplitSizes([
      pane({ span: 8, weight: 5 }),
      pane({ weight: 0 }),
      pane({ weight: Infinity }),
    ]),
  ).toEqual([expect.closeTo(100 / 3, 6), expect.closeTo(100 / 3, 6), expect.closeTo(100 / 3, 6)]);
});
it('preserves explicit zero and CSS dimensions', () => {
  expect(splitCssSize(0)).toBe('0px');
  expect(splitCssSize(' 24rem ')).toBe('24rem');
  expect(splitCssSize(-1)).toBeUndefined();
  expect(splitCssSize('')).toBeUndefined();
});

it('normalizes finite weights without overflowing their total', () => {
  expect(
    initialSplitSizes([pane({ weight: Number.MAX_VALUE }), pane({ weight: Number.MAX_VALUE })]),
  ).toEqual([50, 50]);
});

const sizedPane = (options: Partial<import('./splitLayout').SplitPaneSizing> = {}) => ({
  basis: 0,
  weight: 1,
  min: 0,
  max: Infinity,
  ...options,
});

it('allocates fixed pixels before weighted shares and redistributes at a maximum', () => {
  const result = resolveSplitSizing(
    [sizedPane({ fixed: 120 }), sizedPane({ weight: 2, max: 200 }), sizedPane()],
    600,
  );
  expect(result.sizes.map((size) => (size * result.extent) / 100)).toEqual([120, 200, 280]);
});
it('uses natural vertical bases and leaves Auto panes at content height', () => {
  const result = resolveSplitSizing(
    [
      sizedPane({ basis: 80, weight: 0 }),
      sizedPane({ basis: 40, weight: 2 }),
      sizedPane({ basis: 20 }),
    ],
    440,
  );
  expect(result.sizes.map((size) => (size * result.extent) / 100)).toEqual([
    expect.closeTo(80, 6),
    240,
    120,
  ]);
  expect(
    resolveSplitSizing(
      [sizedPane({ basis: 80, weight: 0 }), sizedPane({ basis: 40, weight: 0 })],
      440,
    ).extent,
  ).toBe(120);
});
it('keeps fixed-only and overconstrained layouts finite without violating their minimums', () => {
  const fixed = resolveSplitSizing([sizedPane({ fixed: 120 }), sizedPane({ fixed: 80 })], 600);
  expect(fixed.extent).toBe(200);
  const narrow = resolveSplitSizing([sizedPane({ min: 120 }), sizedPane({ min: 80 })], 100);
  expect(narrow.extent).toBe(200);
  expect(narrow.sizes).toEqual([60, 40]);
});
it('clamps runtime shares against new pixel constraints without reverting initial fixed sizes', () => {
  const result = resolveSplitSizing(
    [sizedPane({ fixed: 120, min: 80, max: 200 }), sizedPane()],
    400,
    [90, 10],
  );
  expect(result.sizes).toEqual([50, 50]);
});
it('handles zero extents, conflicting bounds and huge finite weights', () => {
  expect(resolveSplitSizing([sizedPane({ fixed: 0 }), sizedPane({ fixed: 0 })], 400).sizes).toEqual(
    [50, 50],
  );
  expect(resolveSplitSizing([sizedPane({ min: 80, max: 20 }), sizedPane()], 100).sizes).toEqual([
    80, 20,
  ]);
  expect(
    resolveSplitSizing(
      [sizedPane({ weight: Number.MAX_VALUE }), sizedPane({ weight: Number.MAX_VALUE })],
      100,
    ).sizes,
  ).toEqual([50, 50]);
});
