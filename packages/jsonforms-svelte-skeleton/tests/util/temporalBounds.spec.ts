import { describe, expect, it } from 'vitest';
import { resolveTemporalBounds } from '../../src/lib/util/datejs';
const formats = [
  'YYYY-MM-DDTHH:mm:ss.SSS',
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DD',
  'HH:mm:ss.SSS',
  'HH:mm:ss',
];
describe('temporal bound intersections and precision', () => {
  it('rounds inclusive minute bounds inward', () => {
    const bounds = resolveTemporalBounds(
      { formatMinimum: '09:30:30', formatMaximum: '10:30:30' },
      formats,
      'minute',
      true,
    );
    expect(bounds.min?.format('HH:mm:ss')).toBe('09:31:00');
    expect(bounds.max?.format('HH:mm:ss')).toBe('10:30:00');
    expect(bounds.empty).toBe(false);
  });
  it('does not skip an allowed minute for a non-aligned exclusive maximum', () => {
    const bounds = resolveTemporalBounds(
      { formatExclusiveMinimum: '09:30:30', formatExclusiveMaximum: '10:30:30' },
      formats,
      'minute',
      true,
    );
    expect(bounds.min?.format('HH:mm:ss')).toBe('09:31:00');
    expect(bounds.max?.format('HH:mm:ss')).toBe('10:30:00');
  });
  it('rounds fractional-second bounds inward', () => {
    const bounds = resolveTemporalBounds(
      {
        formatMinimum: '2026-06-15T12:00:00.500',
        formatExclusiveMaximum: '2026-06-15T12:00:02.500',
      },
      formats,
      'second',
    );
    expect(bounds.min?.format('HH:mm:ss')).toBe('12:00:01');
    expect(bounds.max?.format('HH:mm:ss')).toBe('12:00:02');
  });
  it('moves date-time boundaries across midnight', () => {
    const bounds = resolveTemporalBounds(
      {
        formatExclusiveMinimum: '2026-06-15T23:59:59',
        formatExclusiveMaximum: '2026-06-17T00:00:00',
      },
      formats,
      'second',
    );
    expect(bounds.min?.format('YYYY-MM-DDTHH:mm:ss')).toBe('2026-06-16T00:00:00');
    expect(bounds.max?.format('YYYY-MM-DDTHH:mm:ss')).toBe('2026-06-16T23:59:59');
  });
  for (const schema of [
    { formatExclusiveMinimum: '23:59:59' },
    { formatExclusiveMaximum: '00:00:00' },
    { formatMinimum: '12:00:00', formatExclusiveMaximum: '12:00:00' },
    { formatMinimum: '12:00:00', formatMaximum: '13:00:00', formatExclusiveMinimum: '14:00:00' },
  ]) {
    it(`recognizes an empty clock range: ${JSON.stringify(schema)}`, () => {
      expect(resolveTemporalBounds(schema, formats, 'second', true).empty).toBe(true);
    });
  }
  it('recognizes a date range closed by competing bounds', () => {
    expect(
      resolveTemporalBounds(
        {
          formatMinimum: '2026-06-10',
          formatExclusiveMinimum: '2026-06-15',
          formatMaximum: '2026-06-15',
        },
        formats,
        'day',
      ).empty,
    ).toBe(true);
  });
});
