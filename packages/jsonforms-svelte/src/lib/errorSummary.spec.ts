import { expect, it } from 'vite-plus/test';
import { createTranslator, defaultTranslator, type JsonSchema } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';
import {
  errorTargetSegments,
  formatErrorSummary,
  summaryErrorsAt,
  withoutContainsCandidateErrors,
} from './errorSummary';

const schema: JsonSchema = {
  type: 'object',
  properties: {
    comments: {
      type: 'array',
      title: 'Comments',
      items: { type: 'object', properties: { message: { type: 'string', title: 'Message' } } },
    },
  },
};
const errors: ErrorObject[] = [0, 1].map((index) => ({
  instancePath: `/comments/${index}/message`,
  schemaPath: '#/properties/comments/items/properties/message/maxLength',
  keyword: 'maxLength',
  params: { limit: 5 },
  message: 'Use at most five characters.',
}));
it('retains equal messages from different rows with one-based context', () => {
  expect(formatErrorSummary(errors, schema, undefined, defaultTranslator)).toEqual([
    { path: 'Comments / 1 / Message', message: errors[0].message },
    { path: 'Comments / 2 / Message', message: errors[1].message },
  ]);
});
it('uses the control custom override before a custom error translator', () => {
  const ui = {
    type: 'Control',
    scope: '#/properties/comments/items/properties/message',
    i18n: 'comment',
  };
  const translate = (key: string, fallback?: string) =>
    key === 'comment.error.custom'
      ? 'Shorten this comment.'
      : key === 'comment.label'
        ? 'Translated message'
        : fallback;
  expect(
    formatErrorSummary(errors, schema, ui, createTranslator(translate), () => 'Other')[0],
  ).toEqual({
    path: 'Comments / 1 / Translated message',
    message: 'Shorten this comment.',
  });
});
it('keeps combined, field, global and localized-validator summary precedence', () => {
  const ui = {
    type: 'Control',
    scope: '#/properties/comments/items/properties/message',
    i18n: 'comment',
  };
  const localized = { ...errors[0], message: 'Localized validator fallback' };
  const keys = [
    'comment.error.custom',
    'comment.error.maxLength',
    'error.maxLength',
    'Localized validator fallback',
  ];
  const before = structuredClone(localized);
  for (let start = 0; start <= keys.length; start++) {
    const catalog = Object.fromEntries(
      keys.slice(start).map((key, index) => [key, `Override ${start + index}`]),
    );
    const translate = createTranslator((key, fallback) => catalog[key] ?? fallback);
    const entry = formatErrorSummary([localized], schema, ui, translate)[0];
    expect(entry.message).toBe(start === keys.length ? localized.message : `Override ${start}`);
    expect(entry.path).toBe('Comments / 1 / Message');
  }
  expect(localized).toEqual(before);
});
it('retains empty translations and structured entries without mutating errors', () => {
  const before = structuredClone(errors);
  const entries = formatErrorSummary(
    errors,
    schema,
    undefined,
    createTranslator((key, fallback) => (key === 'error.maxLength' ? '' : fallback)),
  );
  expect(entries).toHaveLength(2);
  expect(entries.every((entry) => entry.message === '')).toBe(true);
  expect(errors).toEqual(before);
});
it.each(['required', 'dependencies', 'additionalProperties', 'propertyNames'])(
  'routes %s to its literal child',
  (keyword) => {
    const key = 'a.b/c~d';
    const error = {
      ...errors[0],
      instancePath: '/comments/0',
      keyword,
      params: { missingProperty: key, additionalProperty: key, propertyName: key },
    };
    expect(errorTargetSegments(error)).toEqual(['comments', '0', key]);
    expect(formatErrorSummary([error], schema, undefined, defaultTranslator)[0].path).toBe(
      'Comments / 1 / a.b/c~d',
    );
  },
);
it('keeps empty members and numeric object keys literal while resolving references', () => {
  const root: JsonSchema = {
    type: 'object',
    definitions: {
      item: {
        type: 'object',
        properties: {
          '': { type: 'string', title: 'Empty member' },
          '0': { type: 'string', title: 'Zero member' },
        },
      },
    },
    properties: { 'a.b': { $ref: '#/definitions/item', title: 'Literal object' } },
  };
  const result = formatErrorSummary(
    ['', '0'].map((key) => ({ ...errors[0], instancePath: '/a.b/' + key })),
    root,
    undefined,
    defaultTranslator,
  );
  expect(result.map((entry) => entry.path)).toEqual([
    'Literal object / Empty member',
    'Literal object / Zero member',
  ]);
});
it('routes property-name detail errors and keeps their original message', () => {
  const error = {
    ...errors[0],
    instancePath: '',
    propertyName: '',
    keyword: 'pattern',
    message: 'Use an allowed key.',
  };
  expect(formatErrorSummary([error], schema, undefined, defaultTranslator)).toEqual([
    { path: '""', message: 'Use an allowed key.' },
  ]);
});

it('selects root descendants and literal members without conflating dotted paths', () => {
  const literal = { ...errors[0], instancePath: '/a.b/0' };
  const nested = { ...errors[0], instancePath: '/a/b/0' };
  const core = { errors: [literal, nested] };
  expect(summaryErrorsAt(core, [])).toEqual([literal, nested]);
  expect(summaryErrorsAt(core, ['a.b'])).toEqual([literal]);
  expect(summaryErrorsAt(core, ['a', 'b'])).toEqual([nested]);
});
it.each(['NoValidation', 'ValidateAndHide'])(
  'preserves additional errors under %s',
  (validationMode) => {
    expect(
      summaryErrorsAt({ errors: [errors[0]], additionalErrors: [errors[1]], validationMode }, []),
    ).toEqual([errors[1]]);
  },
);

it('keeps a failed contains on its array without marking candidate items invalid', () => {
  const candidate = {
    instancePath: '/reviewers/0',
    schemaPath: '#/properties/reviewers/contains/required',
    keyword: 'required',
    params: { missingProperty: 'lead' },
    message: 'must have required property lead',
  } satisfies ErrorObject;
  const failedContains = {
    instancePath: '/reviewers',
    schemaPath: '#/properties/reviewers/contains',
    keyword: 'contains',
    params: {},
    message: 'must contain a lead',
  } satisfies ErrorObject;
  const independentItemError = {
    ...candidate,
    schemaPath: '#/properties/reviewers/items/properties/name/minLength',
    keyword: 'minLength',
    params: { limit: 2 },
  } satisfies ErrorObject;
  const core = { errors: [candidate, failedContains, independentItemError] };
  expect(withoutContainsCandidateErrors(core.errors)).toEqual([
    failedContains,
    independentItemError,
  ]);
  expect(summaryErrorsAt(core, ['reviewers'])).toEqual([failedContains, independentItemError]);
  expect(summaryErrorsAt(core, ['reviewers', '0'])).toEqual([independentItemError]);
});
