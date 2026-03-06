import type { MaskTokens, MaskType } from 'maska';

export interface DurationParts {
  weeks: number;
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const EMPTY_DURATION_PARTS: DurationParts = {
  weeks: 0,
  years: 0,
  months: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

const DURATION_REGEX =
  /^P(?:(?<years>\d+)Y)?(?:(?<months>\d+)M)?(?:(?<days>\d+)D)?(?:T(?:(?<hours>\d+)H)?(?:(?<minutes>\d+)M)?(?:(?<seconds>\d+)S)?)?$/i;

const WEEK_DURATION_REGEX = /^P(?<weeks>\d+)W$/i;

const toInt = (value: string | undefined): number => {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const cloneParts = (parts: DurationParts): DurationParts => ({ ...parts });

export const parseDuration = (value: unknown): DurationParts | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const weekMatch = trimmed.match(WEEK_DURATION_REGEX);
  if (weekMatch?.groups) {
    return {
      weeks: toInt(weekMatch.groups.weeks),
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const durationMatch = trimmed.match(DURATION_REGEX);
  if (!durationMatch?.groups) {
    return null;
  }

  const hasAnyComponent =
    durationMatch.groups.years !== undefined ||
    durationMatch.groups.months !== undefined ||
    durationMatch.groups.days !== undefined ||
    durationMatch.groups.hours !== undefined ||
    durationMatch.groups.minutes !== undefined ||
    durationMatch.groups.seconds !== undefined;

  if (!hasAnyComponent) {
    return null;
  }

  return {
    weeks: 0,
    years: toInt(durationMatch.groups.years),
    months: toInt(durationMatch.groups.months),
    days: toInt(durationMatch.groups.days),
    hours: toInt(durationMatch.groups.hours),
    minutes: toInt(durationMatch.groups.minutes),
    seconds: toInt(durationMatch.groups.seconds),
  };
};

export const formatDurationIso = (parts: DurationParts): string => {
  const safe = cloneParts(parts);
  if (safe.weeks) {
    return `P${safe.weeks}W`;
  }

  const datePart = [
    safe.years ? `${safe.years}Y` : '',
    safe.months ? `${safe.months}M` : '',
    safe.days ? `${safe.days}D` : '',
  ].join('');
  const timePart = [
    safe.hours ? `${safe.hours}H` : '',
    safe.minutes ? `${safe.minutes}M` : '',
    safe.seconds ? `${safe.seconds}S` : '',
  ].join('');

  if (!datePart && !timePart) {
    return 'P0D';
  }

  return `P${datePart}${timePart ? `T${timePart}` : ''}`;
};

export const sanitizeDurationParts = (parts: DurationParts): DurationParts => {
  const sanitized = {
    weeks: Math.max(0, Math.floor(parts.weeks || 0)),
    years: Math.max(0, Math.floor(parts.years || 0)),
    months: Math.max(0, Math.floor(parts.months || 0)),
    days: Math.max(0, Math.floor(parts.days || 0)),
    hours: Math.max(0, Math.floor(parts.hours || 0)),
    minutes: Math.max(0, Math.floor(parts.minutes || 0)),
    seconds: Math.max(0, Math.floor(parts.seconds || 0)),
  };

  if (sanitized.weeks > 0) {
    return {
      weeks: sanitized.weeks,
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  return sanitized;
};

export function getDurationMaskOptions(): { mask: MaskType; tokens: MaskTokens } {
  const tokens: MaskTokens = {
    '#': { pattern: /\d/ },
    P: { pattern: /P/ },
    Y: { pattern: /Y/ },
    M: { pattern: /M/ },
    W: { pattern: /W/ },
    D: { pattern: /D/ },
    T: { pattern: /T/ },
    H: { pattern: /H/ },
    S: { pattern: /S/ },
  };

  function mask(value: string): string {
    const normalized = value.toUpperCase();
    const result: string[] = [];
    let expect: MaskTokens = { P: tokens.P };
    let timePart = false;
    let haveMinute = false;

    for (let index = 0; index < normalized.length; index += 1) {
      const char = normalized.charAt(index);
      let matched = false;

      for (const [key, token] of Object.entries(expect)) {
        if (!token.pattern.test(char)) {
          continue;
        }

        result.push(key);
        matched = true;

        switch (key) {
          case 'P':
          case 'Y':
            expect = { '#': tokens['#'], T: tokens.T };
            break;
          case 'D':
            expect = { T: tokens.T };
            break;
          case 'W':
            expect = {};
            break;
          case 'M':
            if (timePart) {
              expect = { '#': tokens['#'] };
              haveMinute = true;
            } else {
              expect = { '#': tokens['#'], T: tokens.T };
            }
            break;
          case 'T':
            expect = { '#': tokens['#'] };
            timePart = true;
            break;
          case 'H':
            expect = { '#': tokens['#'] };
            break;
          case 'S':
            expect = {};
            break;
          case '#':
            expect = { '#': tokens['#'] };
            if (!timePart) {
              if (
                !result.includes('Y') &&
                !result.includes('M') &&
                !result.includes('D') &&
                !result.includes('W')
              ) {
                expect.Y = tokens.Y;
              }
              if (!result.includes('M') && !result.includes('D') && !result.includes('W')) {
                expect.M = tokens.M;
              }
              if (
                !result.includes('W') &&
                !result.includes('Y') &&
                !result.includes('M') &&
                !result.includes('D')
              ) {
                expect.W = tokens.W;
              }
              if (!result.includes('D') && !result.includes('W')) {
                expect.D = tokens.D;
              }
            } else {
              if (!result.includes('H') && !haveMinute && !result.includes('S')) {
                expect.H = tokens.H;
              }
              if (!haveMinute && !result.includes('S')) {
                expect.M = tokens.M;
              }
              if (!result.includes('S')) {
                expect.S = tokens.S;
              }
            }
            break;
        }

        break;
      }

      if (!matched) {
        break;
      }
    }

    return result.join('');
  }

  return { mask, tokens };
}
