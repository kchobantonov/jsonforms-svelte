import { expect, it } from 'vitest';
import {
  durationCompletions,
  durationFieldMax,
  durationQuantity,
  emptyDurationParts,
  formatDuration,
  isWeeksDuration,
  parseDuration,
  sameDurationParts,
} from './duration';

it.each(['P18M', 'PT90M', 'PT3600S', 'P400D', 'PT1H591212M', 'P1Y2M3DT4H5M6S', 'P3W'])(
  'round-trips quantities without clock-field limits: %s',
  (value) => {
    expect(formatDuration(parseDuration(value)!)).toBe(value);
  },
);
it.each(['P', 'PT', 'P1DT', 'P1W2D', 'P-1D', 'P1.5D', 'PT1M2H', 'P1Y1Y', 'P9007199254740992D'])(
  'keeps incomplete, unsupported or inexact text out of committed parts: %s',
  (value) => {
    expect(parseDuration(value)).toBeUndefined();
  },
);
it('distinguishes textual weeks mode and preserves equivalent spellings for callers', () => {
  expect(isWeeksDuration('P0W')).toBe(true);
  expect(isWeeksDuration('P0D')).toBe(false);
  expect(sameDurationParts(parseDuration('P0W')!, parseDuration('PT0S')!)).toBe(true);
  expect(sameDurationParts(parseDuration('P001DT00H')!, parseDuration('P1D')!)).toBe(true);
  expect(formatDuration({ ...emptyDurationParts })).toBe('P0D');
});
it('accepts exact quantities and rejects incomplete values without rounding', () => {
  expect(durationQuantity(String(durationFieldMax))).toBe(durationFieldMax);
  for (const text of ['', '-1', '1.9', '1e2', '9007199254740992'])
    expect(durationQuantity(text)).toBeUndefined();
});
it('guides every valid unit continuation without accepting mixed weeks or wrong order', () => {
  expect(durationCompletions('P12')).toEqual(['P12Y', 'P12M', 'P12D', 'P12W']);
  expect(durationCompletions('PT90')).toEqual(['PT90M', 'PT90H', 'PT90S']);
  expect(durationCompletions('P1DT90')).toEqual(['P1DT90M', 'P1DT90H', 'P1DT90S']);
  expect(durationCompletions('P2W3')).toEqual([]);
  expect(durationCompletions('PT2M3')).toEqual(['PT2M3S']);
});

it('refuses mixed weeks and component serialization instead of discarding quantities', () => {
  expect(() => formatDuration({ ...emptyDurationParts, weeks: 1, days: 2 })).toThrow(RangeError);
});
