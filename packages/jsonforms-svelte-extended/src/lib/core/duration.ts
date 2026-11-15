/** ISO duration components are quantities, not time-of-day fields (§18.18.2). */
export const durationUnits = [
  'years',
  'months',
  'days',
  'hours',
  'minutes',
  'seconds',
  'weeks',
] as const;
export type DurationUnit = (typeof durationUnits)[number];
export type DurationParts = Record<DurationUnit, number>;
export type DurationMode = 'components' | 'weeks';
export const durationComponentUnits = durationUnits.filter((unit) => unit !== 'weeks');
export const durationFieldMax = Number.MAX_SAFE_INTEGER;
export const emptyDurationParts: Readonly<DurationParts> = Object.freeze({
  years: 0,
  months: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  weeks: 0,
});

export const isWeeksDuration = (value: unknown): boolean =>
  typeof value === 'string' && /^P\d+W$/i.test(value.trim());
export function durationQuantity(text: string): number | undefined {
  if (!/^\d+$/.test(text)) return undefined;
  const value = Number(text);
  return Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}
export function parseDuration(value: unknown): DurationParts | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  const weeks = /^P(\d+)W$/i.exec(text);
  if (weeks) {
    const quantity = durationQuantity(weeks[1]);
    return quantity === undefined ? undefined : { ...emptyDurationParts, weeks: quantity };
  }
  const match = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i.exec(
    text,
  );
  if (!match || /T$/i.test(text) || !match.slice(1).some((part) => part !== undefined))
    return undefined;
  const parts = { ...emptyDurationParts };
  for (const [index, unit] of durationComponentUnits.entries()) {
    const quantity = durationQuantity(match[index + 1] ?? '0');
    if (quantity === undefined) return undefined;
    parts[unit] = quantity;
  }
  return parts;
}
export function formatDuration(parts: DurationParts): string {
  if (durationUnits.some((unit) => !Number.isSafeInteger(parts[unit]) || parts[unit] < 0)) {
    throw new RangeError('Duration components must be exact non-negative integers.');
  }
  if (parts.weeks) {
    if (durationComponentUnits.some((unit) => parts[unit] !== 0))
      throw new RangeError('Weeks cannot be combined with other duration units.');
    return `P${parts.weeks}W`;
  }
  const date = `${parts.years ? `${parts.years}Y` : ''}${parts.months ? `${parts.months}M` : ''}${parts.days ? `${parts.days}D` : ''}`;
  const time = `${parts.hours ? `${parts.hours}H` : ''}${parts.minutes ? `${parts.minutes}M` : ''}${parts.seconds ? `${parts.seconds}S` : ''}`;
  return date || time ? `P${date}${time ? `T${time}` : ''}` : 'P0D';
}
export const sameDurationParts = (left: DurationParts, right: DurationParts): boolean =>
  durationUnits.every((unit) => left[unit] === right[unit]);

/** Native datalist completions preserve typed quantities and respect unit order.
 * Invalid/incomplete text remains a local draft; guidance never edits it silently. */
export function durationCompletions(text: string): string[] {
  const prefix = text.trim().toUpperCase();
  if (!/\d$/.test(prefix)) return [];
  return ['Y', 'M', 'D', 'H', 'S', 'W']
    .map((unit) => prefix + unit)
    .filter((candidate) => parseDuration(candidate) !== undefined);
}
