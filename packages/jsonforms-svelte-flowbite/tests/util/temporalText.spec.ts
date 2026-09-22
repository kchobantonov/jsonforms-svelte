import { describe, expect, it } from 'vitest';
import { parseTemporalText } from '../../src/lib/util/datejs';
describe('checked temporal text parsing', () => {
  it.each([
    ['2026-02-31', 'YYYY-MM-DD'],
    ['2026-13-01', 'YYYY-MM-DD'],
    ['25:00:00', 'HH:mm:ss'],
    ['12:60:00', 'HH:mm:ss'],
    ['2026-02-31T12:00:00+02:00', 'YYYY-MM-DD[T]HH:mm:ssZ'],
  ])('rejects normalization of %s', (value, format) => {
    expect(parseTemporalText(value, format)).toBeNull();
  });
  it.each([
    ['2024-02-29', 'YYYY-MM-DD'],
    ['02/28/2026', 'L'],
    ['11:30 PM', 'hh:mm A'],
    ['2026-02-28T12:00:00Z', 'YYYY-MM-DD[T]HH:mm:ssZ'],
    ['2026-02-28T12:00:00+02:00', 'YYYY-MM-DD[T]HH:mm:ssZ'],
    ['2026-02-28T12:00:00-05:00', 'YYYY-MM-DD[T]HH:mm:ssZ'],
    ['2026-02-28T12:00:00+00:15', 'YYYY-MM-DD[T]HH:mm:ssZ'],
    ['2026-02-28T12:00:00-00:00', 'YYYY-MM-DD[T]HH:mm:ssZ'],
    ['2026-02-28T12:00:00+0230', 'YYYY-MM-DD[T]HH:mm:ssZZ'],
    ['10:00:33+02:00', 'HH:mm:ssZ'],
    ['12:00:00Z', 'HH:mm:ss[Z]'],
  ])('accepts %s without rejecting its format or offset', (value, format) => {
    expect(parseTemporalText(value, format)?.isValid()).toBe(true);
  });
  it('tries each accepted storage/display format', () => {
    expect(
      parseTemporalText('28/02/2026', ['YYYY-MM-DD', 'DD/MM/YYYY'])?.format('YYYY-MM-DD'),
    ).toBe('2026-02-28');
  });
});
