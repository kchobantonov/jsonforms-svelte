import { expect, it } from 'vitest';
import { hasUnsupportedMixedKeys, isUnsupportedMixedKey, mixedPathIsReadOnly } from './mixedSafety';

it.each(['a.b', '', 'a\0b'])('rejects ambiguous key %j', (key) => {
  expect(isUnsupportedMixedKey(key)).toBe(true);
});
it('detects unsupported keys in nested objects and arrays without rejecting safe siblings', () => {
  expect(hasUnsupportedMixedKeys({ a: [{ 'b.c': 1 }] })).toBe(true);
  expect(hasUnsupportedMixedKeys({ a: [{ b: 1 }] })).toBe(false);
  expect(isUnsupportedMixedKey('customerCode')).toBe(false);
});
it('inherits readonly across references, array items and allOf', () => {
  const root = { definitions: { locked: { type: 'object', readOnly: true } } };
  const schema = { type: 'object', properties: { locked: { $ref: '#/definitions/locked' } } };
  expect(mixedPathIsReadOnly(schema, root, { locked: { child: 1 } }, ['locked', 'child'])).toBe(
    true,
  );
  expect(
    mixedPathIsReadOnly(
      { type: 'array', items: { allOf: [{ readOnly: true }] } },
      {},
      [{ child: 1 }],
      ['0', 'child'],
    ),
  ).toBe(true);
});
it('honors matching pattern readonly even when a declared property schema also exists', () => {
  const schema = {
    properties: { locked: { type: 'object' } },
    patternProperties: { '^lock': { readOnly: true } },
  };
  expect(mixedPathIsReadOnly(schema, {}, { locked: { child: 1 } }, ['locked', 'child'])).toBe(true);
  expect(mixedPathIsReadOnly(schema, {}, { free: { child: 1 } }, ['free', 'child'])).toBe(false);
});

it('allows literal brackets in property names', () => {
  expect(isUnsupportedMixedKey('a[0]')).toBe(false);
});
