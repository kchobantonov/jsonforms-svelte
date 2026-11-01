import { describe, expect, it } from 'vite-plus/test';
import type { ErrorObject } from 'ajv';
import { arrayChildErrorCount, arrayChildNotice } from './arrayChildNotice';

const error = (instancePath: string, keyword = 'minLength'): ErrorObject => ({
  keyword,
  instancePath,
  schemaPath: '',
  params: {},
  message: 'Invalid value',
});

describe('array child notice', () => {
  it('excludes direct array errors and distinguishes presence from an opt-in count', () => {
    const errors = [error('/items', 'minItems'), error('/items/0/name'), error('/items/1/name')];
    expect(arrayChildErrorCount(errors, 'items', false)).toBe(1);
    expect(arrayChildErrorCount(errors, 'items', true)).toBe(2);
    expect(arrayChildErrorCount([errors[0]], 'items', false)).toBe(0);
  });

  it('selects the short message key without formatting child errors', () => {
    const message = (key: string) => key;
    expect(arrayChildNotice(1, false, message)).toBe('validation.childrenErrors');
    expect(arrayChildNotice(1, true, message)).toBe('validation.childrenErrorCount');
    expect(arrayChildNotice(2, true, message)).toBe('validation.childrenErrorsCount');
  });
});
