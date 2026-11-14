import type { JsonSchema } from '@jsonforms/core';
import { numericBounds, parseNumericInput } from './numeric';

/** Exact decimal arithmetic for the slider's zero-based multipleOf grid. */
function decimal(value: number) {
  const [mantissa, exponent = '0'] = String(value).split('e');
  const [whole, fraction = ''] = mantissa.split('.');
  const scale = fraction.length - Number(exponent);
  return {
    numerator: BigInt(whole + fraction) * (scale < 0 ? 10n ** BigInt(-scale) : 1n),
    denominator: scale > 0 ? 10n ** BigInt(scale) : 1n,
    scale: Math.max(0, scale),
  };
}
function floor(n: bigint, d: bigint) {
  return n / d - (n < 0 && n % d !== 0n ? 1n : 0n);
}
function gcd(a: bigint, b: bigint): bigint {
  return b === 0n ? a : gcd(b, a % b);
}

export function sliderState(schema: JsonSchema, data: unknown) {
  const bounds = numericBounds(schema);
  const lower = bounds.minimum ?? { value: 0, exclusive: false };
  const upper = bounds.maximum ?? { value: 100, exclusive: false };
  const authoredStep = schema.multipleOf ?? 1;
  const invalidStep = !Number.isFinite(authoredStep) || authoredStep <= 0;
  let increment = decimal(invalidStep ? 1 : authoredStep);
  if (schema.type === 'integer') {
    increment = {
      numerator: increment.numerator / gcd(increment.numerator, increment.denominator),
      denominator: 1n,
      scale: 0,
    };
  }
  const quotient = (value: number) => {
    const input = decimal(value);
    return {
      numerator: input.numerator * increment.denominator,
      denominator: input.denominator * increment.numerator,
    };
  };
  const minRatio = quotient(lower.value);
  const maxRatio = quotient(upper.value);
  const first =
    -floor(-minRatio.numerator, minRatio.denominator) +
    (lower.exclusive && minRatio.numerator % minRatio.denominator === 0n ? 1n : 0n);
  const last =
    floor(maxRatio.numerator, maxRatio.denominator) -
    (upper.exclusive && maxRatio.numerator % maxRatio.denominator === 0n ? 1n : 0n);
  const at = (index: bigint) => Number(`${index * increment.numerator}e-${increment.scale}`);
  const minimum = at(first);
  const maximum = at(last);
  const step = at(1n);
  const usable =
    !invalidStep &&
    first <= last &&
    (minimum === maximum || (minimum + step > minimum && maximum - step < maximum)) &&
    [minimum, maximum, step].every((value) => parseNumericInput(String(value)).kind === 'value');
  const accepts = (value: unknown): value is number => {
    if (!usable || typeof value !== 'number' || !Number.isFinite(value)) return false;
    const ratio = quotient(value);
    return ratio.numerator % ratio.denominator === 0n && value >= minimum && value <= maximum;
  };
  const fallback =
    typeof schema.default === 'number' && Number.isFinite(schema.default)
      ? schema.default
      : minimum;
  const candidate = typeof data === 'number' && Number.isFinite(data) ? data : fallback;
  const ratio = quotient(Number.isFinite(candidate) ? candidate : 0);
  const rounded = floor(ratio.numerator * 2n + ratio.denominator, ratio.denominator * 2n);
  const position = usable ? at(rounded < first ? first : rounded > last ? last : rounded) : 0;
  return {
    minimum: usable ? minimum : 0,
    maximum: usable ? maximum : 1,
    step: usable ? step : 1,
    position,
    usable,
    missing: data === undefined,
    invalid: data !== undefined && !accepts(data),
    accepts,
  };
}
