import { describe, expect, it } from 'vitest';
import {
  EMPTY_DURATION_PARTS,
  formatDurationIso,
  getDurationMaskOptions,
  parseDuration,
  sanitizeDurationParts,
} from '../../src/lib/controls/duration';

describe('duration utilities', () => {
  it('parses ISO durations and week durations', () => {
    expect(parseDuration('P1DT2H3M4S')).toEqual({
      weeks: 0,
      years: 0,
      months: 0,
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
    });

    expect(parseDuration('P3W')).toEqual({
      weeks: 3,
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it('returns null for empty or invalid duration input', () => {
    expect(parseDuration('')).toBeNull();
    expect(parseDuration('invalid')).toBeNull();
    expect(parseDuration(undefined)).toBeNull();
  });

  it('formats duration parts to ISO strings', () => {
    expect(formatDurationIso(EMPTY_DURATION_PARTS)).toBe('P0D');
    expect(
      formatDurationIso({
        weeks: 0,
        years: 1,
        months: 2,
        days: 3,
        hours: 4,
        minutes: 5,
        seconds: 6,
      }),
    ).toBe('P1Y2M3DT4H5M6S');
    expect(
      formatDurationIso({
        weeks: 2,
        years: 9,
        months: 9,
        days: 9,
        hours: 9,
        minutes: 9,
        seconds: 9,
      }),
    ).toBe('P2W');
  });

  it('sanitizes duration parts and enforces week exclusivity', () => {
    expect(
      sanitizeDurationParts({
        weeks: -1,
        years: 1.9,
        months: 2.2,
        days: -5,
        hours: 3.9,
        minutes: 4.7,
        seconds: 5.1,
      }),
    ).toEqual({
      weeks: 0,
      years: 1,
      months: 2,
      days: 0,
      hours: 3,
      minutes: 4,
      seconds: 5,
    });

    expect(
      sanitizeDurationParts({
        weeks: 3,
        years: 1,
        months: 1,
        days: 1,
        hours: 1,
        minutes: 1,
        seconds: 1,
      }),
    ).toEqual({
      weeks: 3,
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it('provides mask options with a mask function and duration tokens', () => {
    const options = getDurationMaskOptions();

    expect(typeof options.mask).toBe('function');
    expect(options.tokens.P?.pattern.test('P')).toBe(true);
    expect(options.tokens['#']?.pattern.test('9')).toBe(true);
    expect(options.tokens.T?.pattern.test('T')).toBe(true);
  });
});
