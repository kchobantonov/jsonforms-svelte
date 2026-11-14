import { describe, expect, it } from 'vite-plus/test';
import {
  parseDateTime,
  resolvePickerDateTimeCandidate,
  resolveTemporalBounds,
  temporalValueWithinBounds,
} from '../../src/lib/util/datejs';
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
  it('compares offset-bearing date-times by instant at minute precision', () => {
    const offsetFormats = ['YYYY-MM-DDTHH:mm:ssZ'];
    const bounds = resolveTemporalBounds(
      { formatMinimum: '2026-06-15T12:00:00+02:00' },
      offsetFormats,
      'minute',
    );
    expect(bounds.min?.toISOString()).toBe('2026-06-15T10:00:00.000Z');
    const equivalent = parseDateTime('2026-06-15T10:00:00Z', offsetFormats);
    const earlier = parseDateTime('2026-06-15T09:59:00Z', offsetFormats);
    const local = new Date('2026-06-15T10:00:00Z');
    expect(equivalent?.hour()).toBe(local.getHours());
    expect(equivalent?.date()).toBe(local.getDate());
    expect(equivalent && temporalValueWithinBounds(equivalent, bounds)).toBe(true);
    expect(earlier && temporalValueWithinBounds(earlier, bounds)).toBe(false);
  });
  it('advances an exclusive offset bound across a daylight-saving gap', () => {
    const offsetFormats = ['YYYY-MM-DDTHH:mm:ssZ'];
    const bounds = resolveTemporalBounds(
      {
        formatExclusiveMinimum: '2026-03-08T01:59:00-05:00',
        formatMaximum: '2026-03-08T03:00:00-04:00',
      },
      offsetFormats,
      'minute',
    );
    expect(bounds.empty).toBe(false);
    expect(bounds.min?.toISOString()).toBe('2026-03-08T07:00:00.000Z');
    expect(bounds.max?.toISOString()).toBe('2026-03-08T07:00:00.000Z');
  });
  it('keeps each repeated-hour occurrence while editing its minute', () => {
    for (const [stored, expected] of [
      ['2026-11-01T01:30:00-04:00', '2026-11-01T05:31:00.000Z'],
      ['2026-11-01T01:30:00-05:00', '2026-11-01T06:31:00.000Z'],
    ]) {
      const original = parseDateTime(stored, 'YYYY-MM-DDTHH:mm:ssZ')!;
      const localDate = original.startOf('day');
      const nextMinute = parseDateTime(
        `${String(original.hour()).padStart(2, '0')}:31:00`,
        'HH:mm:ss',
      )!;
      expect(
        resolvePickerDateTimeCandidate(
          localDate,
          nextMinute,
          stored,
          'YYYY-MM-DDTHH:mm:ssZ',
        ).toISOString(),
      ).toBe(expected);
    }
  });
  it('uses the selected calendar day after leaving a repeated hour', () => {
    const stored = '2026-11-01T01:30:00-05:00';
    const original = parseDateTime(stored, 'YYYY-MM-DDTHH:mm:ssZ')!;
    const nextDay = original.add(1, 'day').startOf('day');
    const time = parseDateTime(`${String(original.hour()).padStart(2, '0')}:31:00`, 'HH:mm:ss')!;
    expect(
      resolvePickerDateTimeCandidate(nextDay, time, stored, 'YYYY-MM-DDTHH:mm:ssZ').toISOString(),
    ).toBe('2026-11-02T06:31:00.000Z');
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
