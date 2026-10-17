import { expect, it } from 'vitest';
import type { UISchemaElement } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';
import { sectionBoundPaths, sectionValidation } from './sectionValidation';
const config = {
  jsonformsExtended: { showValidationIndicator: true, showValidationIndicatorCount: true },
};
const group = (...scopes: string[]) =>
  ({
    type: 'Group',
    elements: scopes.map((scope) => ({ type: 'Control', scope })),
  }) as UISchemaElement;
const error = (instancePath: string, keyword = 'type', params = {}): ErrorObject => ({
  instancePath,
  keyword,
  params,
  schemaPath: '#/type',
});
it('deduplicates overlapping and repeated controls while counting validator errors', () => {
  const ui = group(
    '#/properties/person',
    '#/properties/person/properties/name',
    '#/properties/person',
  );
  expect(
    sectionValidation({ errors: [error('/person/name'), error('/unrelated')] }, [], ui, config),
  ).toEqual({ show: true, count: 1 });
});
it('preserves literal dots, empty names, escapes and numeric segment boundaries', () => {
  const ui = group(
    '#/properties/a.b',
    '#/properties/',
    '#/properties/a~1b',
    '#/properties/rows/items/1',
  );
  const errors = [
    error('/a/b'),
    error('/a.b'),
    error('/'),
    error('/a~1b'),
    error('/rows/10'),
    error('/rows/1'),
  ];
  expect(sectionValidation({ errors }, [], ui, config)).toEqual({ show: true, count: 4 });
});
it('attributes missing and additional properties to the bound child', () => {
  expect(
    sectionValidation(
      {
        errors: [
          error('/nested', 'required', { missingProperty: 'a.b' }),
          error('/nested', 'additionalProperties', { additionalProperty: 'a.b' }),
        ],
      },
      ['nested'],
      group('#/properties/a.b'),
      config,
    ),
  ).toEqual({ show: true, count: 2 });
});
it('keeps host errors visible when schema validation is hidden', () => {
  const ui = group('#/properties/name');
  expect(
    sectionValidation(
      {
        errors: [error('/name')],
        additionalErrors: [error('/name')],
        validationMode: 'ValidateAndHide',
      },
      [],
      ui,
      config,
    ),
  ).toEqual({ show: true, count: 1 });
  expect(
    sectionValidation({ errors: [error('/name')], validationMode: 'NoValidation' }, [], ui, config),
  ).toEqual({ show: false });
});
it('honors local false and never treats presentation-only siblings as root-bound controls', () => {
  const ui = { ...group('#/properties/name'), options: { showValidationIndicator: false } };
  expect(sectionValidation({ errors: [error('/name')] }, [], ui, config)).toEqual({ show: false });
  expect(
    sectionValidation(
      { errors: [error('/name')] },
      [],
      { type: 'Category', elements: [{ type: 'Label', text: 'Hello' }] } as UISchemaElement,
      config,
    ),
  ).toEqual({ show: false });
  expect(
    sectionValidation({ errors: [error('/name')] }, [], group('#/properties/name'), {
      jsonformsExtended: { showValidationIndicator: true },
    }),
  ).toEqual({ show: true });
});

it('shares scope collection by schema identity and follows replacement layouts', () => {
  const ui = group('#/properties/name');
  const paths = sectionBoundPaths(ui);
  expect(sectionBoundPaths(ui)).toBe(paths);
  const replacement = group('#/properties/other');
  expect(sectionBoundPaths(replacement)).toEqual([['other']]);
  expect(sectionValidation({ errors: [error('/name')] }, [], replacement, config)).toEqual({
    show: false,
  });
});

it('keeps repeated escaped tildes in section error ownership', () => {
  expect(
    sectionValidation(
      { errors: [error('/a~0b~0c'), error('/a~0b~00c')] },
      [],
      group('#/properties/a~0b~0c'),
      config,
    ),
  ).toEqual({ show: true, count: 1 });
});
