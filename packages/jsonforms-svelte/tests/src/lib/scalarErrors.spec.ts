import { expect, it } from 'vite-plus/test';
import { createTranslator, defaultErrorTranslator, type JsonFormsState } from '@jsonforms/core';
import { scalarErrorMessage } from '../../../src/lib/scalarErrors';

it('separates literal dotted composition errors from nested lookalikes', () => {
  const state = {
    jsonforms: {
      core: {
        errors: [
          {
            instancePath: '/a.b',
            schemaPath: '#/literal/oneOf',
            keyword: 'oneOf',
            params: {},
            message: 'literal branch',
          },
          {
            instancePath: '/a/b',
            schemaPath: '#/nested/oneOf',
            keyword: 'oneOf',
            params: {},
            message: 'nested branch',
          },
        ],
        additionalErrors: [],
        validationMode: 'ValidateAndShow',
      },
    },
  } as unknown as JsonFormsState;
  const schema = { type: 'integer' } as const;
  const uischema = { type: 'Control', scope: '#' } as const;
  expect(scalarErrorMessage(state, schema, uischema, 'a.b', ['a.b'])).toContain('literal branch');
  expect(scalarErrorMessage(state, schema, uischema, 'a.b', ['a.b'])).not.toContain(
    'nested branch',
  );
  expect(scalarErrorMessage(state, schema, uischema, 'a.b', ['a', 'b'])).toContain('nested branch');
});

it('summarizes alternatives but preserves independent constraints and original errors', () => {
  const errors = [
    {
      instancePath: '/value',
      schemaPath: '#/properties/value/anyOf/0/maximum',
      keyword: 'maximum',
      params: {},
      message: 'branch maximum',
    },
    {
      instancePath: '/value',
      schemaPath: '#/properties/value/anyOf/1/minimum',
      keyword: 'minimum',
      params: {},
      message: 'branch minimum',
    },
    {
      instancePath: '/value',
      schemaPath: '#/properties/value/anyOf',
      keyword: 'anyOf',
      params: {},
      message: 'must match a schema in anyOf',
    },
    {
      instancePath: '/value',
      schemaPath: '#/properties/value/maximum',
      keyword: 'maximum',
      params: {},
      message: 'enclosing maximum',
    },
    {
      instancePath: '/other',
      schemaPath: '#/properties/other/type',
      keyword: 'type',
      params: {},
      message: 'unrelated',
    },
  ];
  const before = JSON.stringify(errors);
  const state = {
    jsonforms: { core: { errors, additionalErrors: [], validationMode: 'ValidateAndShow' } },
  } as unknown as JsonFormsState;
  const message = scalarErrorMessage(
    state,
    { type: 'integer' },
    { type: 'Control', scope: '#' },
    'value',
  );
  expect(message).toContain('does not match any permitted alternative');
  expect(message).toContain('enclosing maximum');
  expect(message).not.toContain('branch maximum');
  expect(message).not.toContain('branch minimum');
  expect(message).not.toContain('unrelated');
  expect(JSON.stringify(errors)).toBe(before);
});
it('summarizes failed referenced branches while retaining sibling constraints', () => {
  const state = {
    jsonforms: {
      core: {
        errors: [
          {
            instancePath: '/value',
            schemaPath: '#/$defs/choices/enum',
            keyword: 'enum',
            params: {},
            message: 'branch enum',
          },
          {
            instancePath: '/value',
            schemaPath: '#/$defs/text/minLength',
            keyword: 'minLength',
            params: {},
            message: 'branch length',
          },
          {
            instancePath: '/value',
            schemaPath: '#/properties/value/anyOf',
            keyword: 'anyOf',
            params: {},
            message: 'must match a schema in anyOf',
          },
          {
            instancePath: '/value',
            schemaPath: '#/properties/value/maxLength',
            keyword: 'maxLength',
            params: {},
            message: 'sibling length',
          },
        ],
        additionalErrors: [],
        validationMode: 'ValidateAndShow',
      },
    },
  } as unknown as JsonFormsState;
  const schema = {
    anyOf: [{ $ref: '#/$defs/choices' }, { $ref: '#/$defs/text' }],
    maxLength: 1,
  };
  const message = scalarErrorMessage(state, schema, { type: 'Control', scope: '#' }, 'value');
  expect(message).toContain('does not match any permitted alternative');
  expect(message).toContain('sibling length');
  expect(message).not.toContain('branch enum');
  expect(message).not.toContain('branch length');
});
it('distinguishes oneOf with no matches from multiple matches', () => {
  for (const passingSchemas of [null, [0, 1]]) {
    const state = {
      jsonforms: {
        core: {
          errors: [
            {
              instancePath: '/value',
              schemaPath: '#/oneOf',
              keyword: 'oneOf',
              params: { passingSchemas },
            },
          ],
        },
      },
    } as unknown as JsonFormsState;
    const message = scalarErrorMessage(
      state,
      { type: 'integer' },
      { type: 'Control', scope: '#' },
      'value',
    );
    expect(message).toContain(passingSchemas ? 'matches more than one' : 'does not match any');
  }
});

it('preserves an already localized validator message unless an i18n override exists', () => {
  const state = {
    jsonforms: {
      core: {
        errors: [
          {
            instancePath: '/value',
            schemaPath: '#/oneOf',
            keyword: 'oneOf',
            params: { passingSchemas: [0, 1] },
            message: 'Трябва да съответства на точно една схема.',
          },
        ],
      },
    },
  } as unknown as JsonFormsState;
  expect(
    scalarErrorMessage(state, { type: 'integer' }, { type: 'Control', scope: '#' }, 'value'),
  ).toBe('Трябва да съответства на точно една схема.');
});

it('supports combined, field-keyword, global-keyword, message and composition overrides in precedence order', () => {
  const keys = [
    'purchase.quantity.error.custom',
    'purchase.quantity.error.oneOf',
    'error.oneOf',
    'composition translated',
    'composition.multipleMatches',
  ];
  for (let start = 0; start < keys.length; start++) {
    const catalog: Record<string, string> = {};
    keys
      .slice(start)
      .forEach(
        (key, index) =>
          (catalog[key] =
            key === 'composition.multipleMatches'
              ? 'composition translated'
              : 'override ' + (index + start)),
      );
    const state = {
      jsonforms: {
        core: {
          errors: [
            {
              instancePath: '/value',
              schemaPath: '#/oneOf',
              keyword: 'oneOf',
              params: { passingSchemas: [0, 1] },
              message: 'must match exactly one schema in oneOf',
            },
          ],
        },
        i18n: {
          translateError: defaultErrorTranslator,
          locale: 'en',
          translate: createTranslator((key, fallback) => catalog[key] ?? fallback),
        },
      },
    } as unknown as JsonFormsState;
    const actual = scalarErrorMessage(
      state,
      { type: 'integer' },
      { type: 'Control', scope: '#', i18n: 'purchase.quantity' },
      'value',
    );
    expect(actual).toBe(start === 4 ? 'composition translated' : 'override ' + start);
  }
});
it('honors the host error translator and lets the combined-message override take precedence', () => {
  const state = {
    jsonforms: {
      core: {
        errors: [
          {
            instancePath: '/value',
            schemaPath: '#/oneOf',
            keyword: 'oneOf',
            params: { passingSchemas: [0, 1] },
            message: 'must match exactly one schema in oneOf',
          },
        ],
      },
      i18n: {
        locale: 'en',
        translate: createTranslator((_key, fallback) => fallback),
        translateError: () => 'Host error translation',
      },
    },
  } as unknown as JsonFormsState;
  expect(
    scalarErrorMessage(state, { type: 'integer' }, { type: 'Control', scope: '#' }, 'value'),
  ).toBe('Host error translation');
  state.jsonforms.i18n!.translate = createTranslator((key, fallback) =>
    key === 'value.error.custom' ? 'Combined override' : fallback,
  );
  expect(
    scalarErrorMessage(state, { type: 'integer' }, { type: 'Control', scope: '#' }, 'value'),
  ).toBe('Combined override');
});

it.each(['NoValidation', 'ValidateAndHide'])(
  'hides document errors under %s while retaining host feedback',
  (validationMode) => {
    const state = {
      jsonforms: {
        core: {
          validationMode,
          errors: [
            {
              instancePath: '/value',
              schemaPath: '#/properties/value/minLength',
              keyword: 'minLength',
              params: { limit: 3 },
              message: 'Document error',
            },
          ],
          additionalErrors: [
            {
              instancePath: '/value',
              schemaPath: '#/host',
              keyword: 'host',
              params: {},
              message: 'Host error',
            },
          ],
        },
      },
    } as unknown as JsonFormsState;
    expect(
      scalarErrorMessage(state, { type: 'string' }, { type: 'Control', scope: '#' }, 'value'),
    ).toBe('Host error');
  },
);
