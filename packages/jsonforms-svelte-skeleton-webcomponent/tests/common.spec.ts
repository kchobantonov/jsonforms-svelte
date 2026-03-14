import { describe, expect, it } from 'vitest';
import { parseBoolean, parseJson, parseMode } from '../src/lib/common';

describe('common helpers', () => {
  describe('parseJson', () => {
    it('returns fallback for undefined, null, and empty string', () => {
      expect(parseJson(undefined, { a: 1 })).toEqual({ a: 1 });
      expect(parseJson(null, { a: 1 })).toEqual({ a: 1 });
      expect(parseJson('', { a: 1 })).toEqual({ a: 1 });
    });

    it('returns parsed object for valid JSON strings', () => {
      expect(parseJson('{"a":1}', {} as { a?: number })).toEqual({ a: 1 });
    });

    it('returns original value when input is already a non-string object', () => {
      const value = { a: 1 };
      expect(parseJson(value, {} as { a?: number })).toBe(value);
    });

    it('returns fallback for invalid JSON strings', () => {
      expect(parseJson('{invalid}', { a: 1 })).toEqual({ a: 1 });
    });
  });

  describe('parseBoolean', () => {
    it('returns booleans as-is', () => {
      expect(parseBoolean(true, false)).toBe(true);
      expect(parseBoolean(false, true)).toBe(false);
    });

    it('parses true/false strings case-insensitively', () => {
      expect(parseBoolean('true', false)).toBe(true);
      expect(parseBoolean('TRUE', false)).toBe(true);
      expect(parseBoolean('false', true)).toBe(false);
      expect(parseBoolean('FALSE', true)).toBe(false);
    });

    it('treats unknown strings as false', () => {
      expect(parseBoolean('yes', true)).toBe(false);
    });
  });

  describe('parseMode', () => {
    it('maps boolean mode values to dark/light', () => {
      expect(parseMode(true)).toBe('dark');
      expect(parseMode(false)).toBe('light');
    });

    it('parses string mode aliases', () => {
      expect(parseMode('dark')).toBe('dark');
      expect(parseMode('LIGHT')).toBe('light');
      expect(parseMode(' auto ')).toBe('system');
      expect(parseMode('system')).toBe('system');
      expect(parseMode('true')).toBe('dark');
      expect(parseMode('false')).toBe('light');
    });

    it('falls back to system for unknown values', () => {
      expect(parseMode('unknown')).toBe('system');
    });
  });
});
