import type { JsonSchema } from '@jsonforms/core';

export type NumericParseResult =
  | { kind: 'empty' }
  | { kind: 'value'; value: number }
  | { kind: 'invalid'; reason: 'incomplete' | 'integer' | 'precision' | 'finite' };

// Compare decimal spellings, not binary arithmetic. This accepts ordinary
// round-trip decimals such as 0.1 but rejects digits lost by Number conversion.
function decimalIdentity(text: string): string {
  const [mantissa, exponent = '0'] = text.toLowerCase().split('e');
  const negative = mantissa.startsWith('-');
  const unsigned = mantissa.replace(/^[+-]/, '');
  const [whole, fraction = ''] = unsigned.split('.');
  let digits = (whole + fraction).replace(/^0+/, '');
  if (!digits) return '0';
  let scale = Number(exponent) - fraction.length;
  while (digits.endsWith('0')) {
    digits = digits.slice(0, -1);
    scale++;
  }
  return `${negative ? '-' : ''}${digits}e${scale}`;
}

/** Finite JS numbers; new integral entries must stay inside the safe-integer range. */
export function parseNumericInput(text: string, integer = false): NumericParseResult {
  const input = text.trim();
  if (!input) return { kind: 'empty' };
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(input))
    return { kind: 'invalid', reason: 'incomplete' };
  const value = Number(input);
  if (!Number.isFinite(value)) return { kind: 'invalid', reason: 'finite' };
  if (
    (Number.isInteger(value) && !Number.isSafeInteger(value)) ||
    decimalIdentity(input) !== decimalIdentity(String(value))
  )
    return { kind: 'invalid', reason: 'precision' };
  if (integer && !Number.isInteger(value)) return { kind: 'invalid', reason: 'integer' };
  return { kind: 'value', value };
}

export function numericStep(schema: JsonSchema, explicit: unknown, integer: boolean) {
  const suitable = (value: unknown): value is number =>
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0 &&
    (!integer || Number.isInteger(value));
  return {
    value: suitable(explicit)
      ? explicit
      : suitable(schema.multipleOf)
        ? schema.multipleOf
        : integer
          ? 1
          : 0.1,
    invalid: explicit !== undefined && !suitable(explicit),
  };
}

export interface NumericBound {
  value: number;
  exclusive: boolean;
}
export function numericBounds(schema: JsonSchema): {
  minimum?: NumericBound;
  maximum?: NumericBound;
} {
  const bound = (
    inclusive: number | undefined,
    exclusive: number | boolean | undefined,
    lower: boolean,
  ) => {
    const options: NumericBound[] = [];
    if (typeof inclusive === 'number' && Number.isFinite(inclusive))
      options.push({ value: inclusive, exclusive: exclusive === true });
    if (typeof exclusive === 'number' && Number.isFinite(exclusive))
      options.push({ value: exclusive, exclusive: true });
    return options.sort(
      (a, b) =>
        (lower ? b.value - a.value : a.value - b.value) ||
        Number(b.exclusive) - Number(a.exclusive),
    )[0];
  };
  return {
    minimum: bound(schema.minimum, schema.exclusiveMinimum, true),
    maximum: bound(schema.maximum, schema.exclusiveMaximum, false),
  };
}

/** Accept a valid value or a strict improvement of an already violated bound. */
export function numericBoundViolation(
  schema: JsonSchema,
  next: number,
  current: unknown,
): 'minimum' | 'maximum' | undefined {
  const { minimum, maximum } = numericBounds(schema);
  const previous = typeof current === 'number' && Number.isFinite(current) ? current : undefined;
  const below = (value: number) =>
    minimum && (minimum.exclusive ? value <= minimum.value : value < minimum.value);
  const above = (value: number) =>
    maximum && (maximum.exclusive ? value >= maximum.value : value > maximum.value);
  if (below(next) && !(previous !== undefined && below(previous) && next > previous))
    return 'minimum';
  if (above(next) && !(previous !== undefined && above(previous) && next < previous))
    return 'maximum';
  return undefined;
}
