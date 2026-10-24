import { expect, it } from 'vite-plus/test';
import { numericBounds, numericBoundViolation, numericStep, parseNumericInput } from './numeric';

it('parses complete decimal values and exponents without truncation', () => {
  expect(parseNumericInput('1e3', true)).toEqual({ kind: 'value', value: 1000 });
  expect(parseNumericInput('1.9')).toEqual({ kind: 'value', value: 1.9 });
  expect(parseNumericInput('1.9', true)).toEqual({ kind: 'invalid', reason: 'integer' });
  expect(parseNumericInput('  ')).toEqual({ kind: 'empty' });
  expect(parseNumericInput('-2.50')).toEqual({ kind: 'value', value: -2.5 });
  expect(parseNumericInput('0')).toEqual({ kind: 'value', value: 0 });
  expect(parseNumericInput('0.1000')).toEqual({ kind: 'value', value: 0.1 });
});
it.each(['-', '+', '1e', '1e-', '12abc', '0x10', 'NaN', 'Infinity'])(
  'retains unsupported input %s as a draft',
  (text) => {
    expect(parseNumericInput(text).kind).toBe('invalid');
  },
);
it.each(['9007199254740993', '9007199254740992', '1e309', '1e-324', '1.234567890123456789'])(
  'detects unsupported precision or range in %s',
  (text) => {
    expect(parseNumericInput(text).kind).toBe('invalid');
  },
);
it('preserves the supported range without inventing schema bounds', () => {
  expect(parseNumericInput('9007199254740991', true)).toEqual({
    kind: 'value',
    value: Number.MAX_SAFE_INTEGER,
  });
  expect(parseNumericInput('-9007199254740991', true)).toEqual({
    kind: 'value',
    value: Number.MIN_SAFE_INTEGER,
  });
  expect(parseNumericInput('1e-308')).toEqual({ kind: 'value', value: 1e-308 });
});
it('resolves stepping and diagnoses unsuitable explicit increments', () => {
  expect(numericStep({ multipleOf: 0.25 }, undefined, false)).toEqual({
    value: 0.25,
    invalid: false,
  });
  expect(numericStep({ multipleOf: 0.25 }, undefined, true)).toEqual({ value: 1, invalid: false });
  expect(numericStep({ multipleOf: 2 }, 3, true)).toEqual({ value: 3, invalid: false });
  for (const value of [0, -1, Infinity, 0.5, '2'])
    expect(numericStep({}, value, true)).toEqual({ value: 1, invalid: true });
});
it('preserves exclusive bounds and allows correction of imported violations', () => {
  const schema = { minimum: 0, exclusiveMinimum: 0, maximum: 10, exclusiveMaximum: 10 };
  expect(numericBounds(schema)).toEqual({
    minimum: { value: 0, exclusive: true },
    maximum: { value: 10, exclusive: true },
  });
  expect(numericBoundViolation(schema, 0, 5)).toBe('minimum');
  expect(numericBoundViolation(schema, 10, 5)).toBe('maximum');
  expect(numericBoundViolation(schema, -2, -3)).toBeUndefined();
  expect(numericBoundViolation(schema, -4, -3)).toBe('minimum');
  expect(numericBoundViolation(schema, 11, 12)).toBeUndefined();
  expect(numericBoundViolation(schema, 13, 12)).toBe('maximum');
  expect(numericBoundViolation(schema, -1, 12)).toBe('minimum');
});
