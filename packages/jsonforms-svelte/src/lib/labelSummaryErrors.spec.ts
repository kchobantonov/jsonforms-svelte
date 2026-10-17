import { expect, it } from 'vitest';
import type { JsonFormsState } from '@jsonforms/core';
import { labelDetailErrorPaths, labelSummaryErrorMessage } from './labelSummaryErrors';

const nameDetail = {
  type: 'VerticalLayout',
  elements: [{ type: 'Control', scope: '#/properties/name' }],
};
const error = (instancePath: string, message: string) => ({
  instancePath,
  schemaPath: '#/type',
  keyword: 'type',
  params: {},
  message,
});
const errors = [
  error('/rows/0/name', 'invalid name'),
  error('/rows/0/notes', 'invalid notes'),
  error('/rows/1/name', 'other row'),
];
const state = {
  jsonforms: { core: { errors, additionalErrors: [error('/rows/0/name', 'server name')] } },
} as unknown as JsonFormsState;
const message = (detail: unknown, context = state) =>
  labelSummaryErrorMessage(
    context,
    { type: 'object' },
    { type: 'Control', scope: '#' },
    'rows.0',
    detail,
  );

it('keeps unrelated row errors out of partial detail previews without changing document validity', () => {
  expect(message(undefined)).toBe('');
  expect(message(nameDetail)).toContain('invalid name');
  expect(message(nameDetail)).toContain('server name');
  expect(message(nameDetail)).not.toContain('invalid notes');
  expect(message(nameDetail)).not.toContain('other row');
  expect(state.jsonforms.core!.errors).toEqual(errors);
});
it('includes descendants for root details and routes required errors to the exposed property', () => {
  expect(message({ type: 'Control', scope: '#' })).toContain('invalid notes');
  const required = {
    ...error('/rows/0', 'name is required'),
    keyword: 'required',
    params: { missingProperty: 'name' },
  };
  expect(
    message(nameDetail, {
      jsonforms: { core: { errors: [required] } },
    } as unknown as JsonFormsState),
  ).toBe('name is required');
  expect(
    labelDetailErrorPaths('rows.0', { type: 'Group', elements: [nameDetail, nameDetail] }),
  ).toEqual(['rows.0.name']);
});
it('hides document validation without hiding host-owned errors', () => {
  const hidden = {
    jsonforms: { core: { ...state.jsonforms.core, validationMode: 'ValidateAndHide' } },
  } as JsonFormsState;
  expect(message(nameDetail, hidden)).toBe('server name');
});
