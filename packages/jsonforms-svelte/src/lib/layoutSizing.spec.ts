import { resolveMinItemWidth } from './layoutSizing';
import { describe, expect, it } from 'vite-plus/test';
import {
  containerStyle,
  resolveGap,
  itemSizing,
  resolveGridColumns,
  resolveWrap,
  resolveSpacerSize,
} from './layoutSizing';

describe('portable layout defaults', () => {
  it('uses the portable 16px gap without requiring inserted schema defaults', () => {
    expect(resolveGap(undefined, undefined, 'row')).toBe(16);
    expect(resolveGap(undefined, undefined, 'column')).toBe(16);
  });

  it('accepts the consuming library spacing in both directions', () => {
    const defaults = { row: 16, column: '1rem' };
    expect(resolveGap(undefined, undefined, 'row', defaults)).toBe(16);
    expect(containerStyle(undefined, undefined, 'column', defaults).gap).toBe('1rem');
  });

  it('keeps element and namespaced settings ahead of family defaults', () => {
    const config = { jsonformsExtended: { layoutDefaults: { gap: 8 } } };
    const defaults = { row: 16, column: 12 };
    expect(resolveGap({ gap: 0 }, config, 'row', defaults)).toBe(0);
    expect(resolveGap(undefined, config, 'row', defaults)).toBe(8);
  });
});

it('uses fixed, span, weight and automatic modes in that order', () => {
  const size = (layout: Record<string, unknown>) =>
    itemSizing({ type: 'Label', options: { layout } }, 'row', 16, 16);
  expect(size({ width: 120, span: 4, weight: 2 }).style.flex).toBe('0 0 120px');
  expect(size({ span: 4, weight: 2 }).style.flex).toBe('0 0 calc(25% - 0.75 * 16px)');
  expect(size({ weight: 2 }).style.flex).toBe('2 1 0');
  expect(size({}).style.flex).toBe('1 1 0');
});
it('preserves natural vertical content height when weights have no definite parent height', () => {
  const sized = itemSizing({ type: 'Label', options: { layout: { weight: 2 } } }, 'column', 16, 16);
  expect(sized.style.flex).toBe('2 1 auto');
});
it('uses local false and zero ahead of namespaced defaults', () => {
  const config = { jsonformsExtended: { layoutDefaults: { wrap: true, gap: 12, gridColumns: 8 } } };
  expect(resolveWrap({ wrap: false }, config)).toBe(false);
  expect(resolveGap({ gap: 0 }, config, 'row')).toBe(0);
  expect(resolveGridColumns({}, config)).toBe(8);
});
it('clamps excessive spans, rejects invalid weights and keeps child minimum precedence', () => {
  const sized = itemSizing(
    { type: 'Label', options: { layout: { span: 30, weight: -1, minWidth: 0 } } },
    'row',
    16,
    16,
    120,
  );
  expect(sized.style.flex).toBe('0 0 100%');
  expect(sized.style.minWidth).toBe('0px');
  expect(sized.diagnostics).toHaveLength(2);
});
it('retains legacy Spacer heights while honoring canonical zero and CSS dimensions', () => {
  expect(resolveSpacerSize({ type: 'Spacer', options: { height: 64 } })).toBe(64);
  expect(
    resolveSpacerSize({ type: 'Spacer', size: 0, options: { height: 64 } } as Parameters<
      typeof resolveSpacerSize
    >[0]),
  ).toBe(0);
  expect(
    resolveSpacerSize({ type: 'Spacer', size: '2rem' } as Parameters<typeof resolveSpacerSize>[0]),
  ).toBe('2rem');
});

it('resolves minimum item width from local settings before namespaced defaults', () => {
  const config = { jsonformsExtended: { layoutDefaults: { minItemWidth: 240 } } };
  expect(resolveMinItemWidth(undefined, config)).toBe(240);
  expect(resolveMinItemWidth({ minItemWidth: 0 }, config)).toBe(0);
  expect(resolveMinItemWidth({ minItemWidth: '12rem' }, config)).toBe('12rem');
  expect(resolveMinItemWidth({ minItemWidth: -1 }, config)).toBe(240);
  expect(resolveMinItemWidth(undefined, { minItemWidth: 99 })).toBeUndefined();
});

it('applies cross-axis dimensions without changing primary sizing precedence', () => {
  const element = { type: 'Label', options: { layout: { width: 120, height: 80, weight: 3 } } };
  expect(itemSizing(element, 'row', 16, 16).style).toMatchObject({
    flex: '0 0 120px',
    height: '80px',
  });
  expect(itemSizing(element, 'column', 16, 16).style).toMatchObject({
    flex: '0 0 80px',
    width: '120px',
  });
  const invalid = itemSizing({ type: 'Label', options: { layout: { height: -1 } } }, 'row', 16, 16);
  expect(invalid.style.height).toBeUndefined();
  expect(invalid.diagnostics).toEqual(['`height` must be a non-negative dimension; ignored.']);
});
