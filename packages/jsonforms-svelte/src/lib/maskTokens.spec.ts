import { expect, it, vi } from 'vitest';
import { compileTokenPattern, toMaskTokens } from './maskTokens';

it('compiles Unicode and legacy regex escapes without throwing on invalid patterns', () => {
  expect(compileTokenPattern('\\p{L}')?.test('Ж')).toBe(true);
  expect(compileTokenPattern('\\-')?.test('-')).toBe(true);
  expect(compileTokenPattern('[')).toBeUndefined();
});
it('retains defaults after invalid overrides and reports malformed tokens', () => {
  const invalid = vi.fn();
  const tokens = toMaskTokens({ '#': '[', '@': { pattern: 2 }, '*': false }, invalid);
  expect(tokens['#'].pattern.test('1')).toBe(true);
  expect(tokens['@'].pattern.test('A')).toBe(true);
  expect(tokens).not.toHaveProperty('*');
  expect(invalid.mock.calls).toEqual([['#'], ['@']]);
});
it('copies supported flags and preserves host RegExp values', () => {
  const tokens = toMaskTokens({
    X: { pattern: /[a-z]/i, optional: true, repeated: false, transform: 'ignored' },
  });
  expect(tokens.X.pattern.test('A')).toBe(true);
  expect(tokens.X).toEqual({ pattern: /[a-z]/i, optional: true });
});
it('treats prototype-looking token names as ordinary own keys', () => {
  const tokens = toMaskTokens(JSON.parse('{"__proto__":"[0-9]"}'));
  expect(Object.getPrototypeOf(tokens)).toBe(Object.prototype);
  expect(Object.hasOwn(tokens, '__proto__')).toBe(true);
  expect(tokens.__proto__.pattern.test('1')).toBe(true);
});
