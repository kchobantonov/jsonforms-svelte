import type { JsonSchema } from '@jsonforms/core';
import { expect, it } from 'vite-plus/test';
import {
  fileNameFromValue,
  resolveFileAccept,
  fileItemSchema,
  fileControlTester,
} from './fileOptions';
import { translateFileMessage } from './fileMessages';

it.each([
  ['.pdf,application/pdf', 'image/png', '.pdf,application/pdf'],
  ['', 'image/png', ''],
  ['  ', 'image/png', ''],
  [undefined, 'image/png', 'image/png'],
  [null, 'text/plain; charset=utf-8', 'text/plain'],
  [undefined, 'image/*', 'image/*'],
  [undefined, 'not a media type', undefined],
  [undefined, undefined, undefined],
])('resolves explicit filter %s before schema filter %s', (accept, mediaType, expected) => {
  expect(resolveFileAccept(accept, mediaType)).toBe(expected);
});

it('keeps Bulgarian fallback and empty authored file messages', () => {
  expect(translateFileMessage('bg-BG', undefined, 'file.cancel')).toBe('Отказ');
  expect(translateFileMessage('en', undefined, 'file.cancel')).toBe('Cancel');
  const empty = () => '';
  expect(translateFileMessage('bg', empty, 'file.clear')).toBe('');
});

it('recovers persisted binary filenames without treating payload text as metadata', () => {
  expect(
    fileNameFromValue('data:text/plain;filename=report%20%E2%84%961.txt;base64,aGVsbG8='),
  ).toBe('report №1.txt');
  expect(fileNameFromValue('data:text/plain;base64,filename=wrong.txt')).toBeUndefined();
  expect(fileNameFromValue('data:text/plain;filename=%E0;base64,aGVsbG8=')).toBeUndefined();
  expect(fileNameFromValue('data:text/plain;filename=;base64,aGVsbG8=')).toBeUndefined();
  expect(fileNameFromValue('aGVsbG8=')).toBeUndefined();
  expect(fileNameFromValue({ filename: 'wrong.txt' })).toBeUndefined();
});

it('selects homogeneous file arrays and resolves item references at the root', () => {
  const root: JsonSchema = {
    type: 'object',
    definitions: { attachment: { type: 'string', format: 'binary' } },
    properties: { files: { type: 'array', items: { $ref: '#/definitions/attachment' } } },
  };
  const schema = root.properties!.files;
  expect(fileItemSchema(schema, root)).toEqual(root.definitions!.attachment);
  expect(
    fileControlTester({ type: 'Control', scope: '#/properties/files' }, root, {
      rootSchema: root,
      config: {},
    }),
  ).toBe(7);
  expect(
    fileControlTester(
      { type: 'Control', scope: '#' },
      { type: 'string', format: 'byte' },
      { rootSchema: root, config: {} },
    ),
  ).toBe(2);
});
it.each([
  { type: 'array', items: { type: 'string' } },
  { type: 'array', items: false },
  { type: 'array', items: true },
  { type: 'array', items: [{ type: 'string', format: 'byte' }] },
  { type: 'array', items: { $ref: '#/missing' } },
])('does not select unsupported file item schemas: %j', (schema) => {
  expect(fileItemSchema(schema as JsonSchema, schema as JsonSchema)).toBeUndefined();
});

it('localizes byte-limit messages and forwards current parameters to host translations', () => {
  expect(translateFileMessage('bg-BG', undefined, 'error.fileMaximum', { limitText: '2 KB' })).toBe(
    'Размерът трябва да е по-малък или равен на 2 KB',
  );
  expect(
    translateFileMessage('en', undefined, 'error.fileExclusiveMinimum', { limitText: '0 Bytes' }),
  ).toBe('size should be greater than 0 Bytes');
  expect(
    translateFileMessage(
      'en',
      (_key, _fallback, context) => `Limit ${context.limitText}`,
      'error.fileMaximum',
      { limitText: '3 KB' },
    ),
  ).toBe('Limit 3 KB');
});
