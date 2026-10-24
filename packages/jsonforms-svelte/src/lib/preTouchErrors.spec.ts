import { defaultTranslator } from '@jsonforms/core';
import { expect, it } from 'vite-plus/test';
import type { ErrorObject } from 'ajv';
import { filterErrorsBeforeTouch, type PreTouchErrorsInput } from './preTouchErrors';
const required: ErrorObject = {
  instancePath: '',
  schemaPath: '#/required',
  keyword: 'required',
  params: { missingProperty: 'name' },
  message: 'Required',
};
const host: ErrorObject = {
  instancePath: '/name',
  schemaPath: '#/host',
  keyword: 'server',
  params: {},
  message: 'Server rejected this name',
};
const input: PreTouchErrorsInput = {
  touched: false,
  errors: 'Required\nServer rejected this name',
  options: { enableFilterErrorsBeforeTouch: true, filterErrorKeywordsBeforeTouch: ['required'] },
  core: { errors: [required], additionalErrors: [host], validationMode: 'ValidateAndShow' },
  path: 'name',
  schema: { type: 'string' },
  uischema: { type: 'Control', scope: '#/properties/name' },
  translate: defaultTranslator,
  translateError: (error) => error.message ?? '',
};
it('retains nonmatching host errors when a schema error is suppressed', () => {
  const snapshot = structuredClone(input.core);
  expect(filterErrorsBeforeTouch(input)).toBe(host.message);
  expect(input.core).toEqual(snapshot);
});
it('filters matching host errors without changing schema validation or additional errors', () => {
  expect(
    filterErrorsBeforeTouch({
      ...input,
      options: { ...input.options, filterErrorKeywordsBeforeTouch: ['server'] },
    }),
  ).toBe('Required');
  expect(input.core?.additionalErrors).toEqual([host]);
});
it.each(['ValidateAndHide', 'NoValidation'] as const)(
  'never reveals schema errors under %s',
  (validationMode) => {
    expect(
      filterErrorsBeforeTouch({
        ...input,
        errors: host.message!,
        core: { ...input.core!, validationMode },
        options: { ...input.options, filterErrorKeywordsBeforeTouch: ['server'] },
      }),
    ).toBe('');
  },
);
it('restores original text after blur or disabling the filter', () => {
  expect(filterErrorsBeforeTouch({ ...input, touched: true })).toBe(input.errors);
  expect(
    filterErrorsBeforeTouch({ ...input, options: { enableFilterErrorsBeforeTouch: false } }),
  ).toBe(input.errors);
});
it.each([undefined, []])(
  'hides all display text for an omitted or empty keyword list',
  (keywords) => {
    expect(
      filterErrorsBeforeTouch({
        ...input,
        options: { enableFilterErrorsBeforeTouch: true, filterErrorKeywordsBeforeTouch: keywords },
      }),
    ).toBe('');
  },
);
it('preserves the original text when no keyword matches or validation already hid it', () => {
  expect(filterErrorsBeforeTouch({ ...input, errors: '' })).toBe('');
  expect(
    filterErrorsBeforeTouch({
      ...input,
      options: { ...input.options, filterErrorKeywordsBeforeTouch: ['format'] },
    }),
  ).toBe(input.errors);
});
