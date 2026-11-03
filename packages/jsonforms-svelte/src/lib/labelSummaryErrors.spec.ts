import { expect, it } from 'vite-plus/test';
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
it.each(['ValidateAndHide', 'NoValidation'])(
  'hides document validation without hiding host-owned errors in %s',
  (validationMode) => {
    const hidden = {
      jsonforms: { core: { ...state.jsonforms.core, validationMode } },
    } as JsonFormsState;
    expect(message(nameDetail, hidden)).toBe('server name');
  },
);

it('keeps literal detail members distinct from nested lookalikes', () => {
  const literal = {
    jsonforms: {
      core: {
        errors: [
          error('/rows/0/a.b', 'literal dotted'),
          error('/rows/0/a/b', 'nested dotted'),
          error('/rows/0/', 'empty member'),
          error('/rows/0/a~1b', 'slash member'),
          error('/rows/0/a~0b~0c', 'repeated tilde member'),
          {
            ...error('/rows/0', 'missing literal dotted'),
            keyword: 'required',
            params: { missingProperty: 'a.b' },
          },
        ],
      },
    },
  } as unknown as JsonFormsState;
  const dotted = message({ type: 'Control', scope: '#/properties/a.b' }, literal);
  expect(dotted).toContain('literal dotted');
  expect(dotted).toContain('missing literal dotted');
  expect(dotted).not.toContain('nested dotted');
  expect(message({ type: 'Control', scope: '#/properties/' }, literal)).toBe('empty member');
  expect(message({ type: 'Control', scope: '#/properties/a~1b' }, literal)).toBe('slash member');
  expect(message({ type: 'Control', scope: '#/properties/a~0b~0c' }, literal)).toBe(
    'repeated tilde member',
  );
});

it('keeps a literal dotted parent separate from the nested parent with the same flattened path', () => {
  const collision = {
    jsonforms: {
      core: {
        errors: [error('/a.b/name', 'literal parent'), error('/a/b/name', 'nested parent')],
      },
    },
  } as unknown as JsonFormsState;
  const summary = (segments: string[]) =>
    labelSummaryErrorMessage(
      collision,
      { type: 'object' },
      { type: 'Control', scope: '#' },
      'a.b',
      nameDetail,
      segments,
    );
  expect(summary(['a.b'])).toBe('literal parent');
  expect(summary(['a', 'b'])).toBe('nested parent');
});
