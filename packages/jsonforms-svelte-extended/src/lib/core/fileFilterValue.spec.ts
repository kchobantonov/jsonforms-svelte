import type { JsonSchema } from '@jsonforms/core';
import { expect, it } from 'vitest';
import { fileFilterValue } from './fileFilterValue';

const binary = { type: 'string', format: 'binary' } satisfies JsonSchema;
const receipt = 'data:text/plain;filename=receipt%20%E2%84%961.txt;base64,c2VjcmV0';

it('exposes decoded filenames without exposing metadata or attachment contents', () => {
  expect(fileFilterValue(receipt, binary, binary)).toBe('receipt №1.txt');
  for (const value of [
    'c2VjcmV0',
    'data:text/plain;base64,c2VjcmV0',
    'data:text/plain;filename=%E0;base64,c2VjcmV0',
    null,
    { filename: 'fake' },
  ]) {
    expect(fileFilterValue(value, binary, binary)).toBe('');
  }
});

it('joins only persisted names for homogeneous file arrays and resolves references', () => {
  const root: JsonSchema = {
    definitions: { file: binary, files: { type: 'array', items: { $ref: '#/definitions/file' } } },
  };
  expect(
    fileFilterValue(
      [receipt, 'nameless', 'data:text/plain;filename=notes.txt;base64,YQ=='],
      { $ref: '#/definitions/files' },
      root,
    ),
  ).toBe('receipt №1.txt notes.txt');
  expect(fileFilterValue('invalid array', { $ref: '#/definitions/files' }, root)).toBe('');
  expect(fileFilterValue(receipt, { $ref: '#/definitions/file' }, root)).toBe('receipt №1.txt');
});

it('leaves ordinary and unresolved columns to their normal grid value handling', () => {
  for (const schema of [
    { type: 'string' },
    { type: 'array', items: { type: 'string' } },
    { type: 'array', items: [binary] },
    { $ref: '#/missing' },
  ]) {
    expect(fileFilterValue(receipt, schema as JsonSchema, {})).toBeUndefined();
  }
});
