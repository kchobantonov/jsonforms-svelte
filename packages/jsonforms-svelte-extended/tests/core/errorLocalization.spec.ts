import { expect, it } from 'vite-plus/test';
import { createTranslator, defaultErrorTranslator, type JsonFormsState } from '@jsonforms/core';
import { createAjv } from '../../src/lib/core/validate';
import { scalarErrorMessage } from '../../../jsonforms-svelte/src/lib/scalarErrors';
import { formatErrorSummary } from '../../../jsonforms-svelte/src/lib/errorSummary';

it('preserves ajv-i18n localization and allows field error overrides for scalar compositions', () => {
  let locale = 'bg-BG';
  const validate = createAjv(() => ({ locale })).compile({
    type: 'object',
    properties: {
      value: { type: 'integer', oneOf: [{ multipleOf: 3 }, { multipleOf: 5 }] },
    },
  });
  expect(validate({ value: 15 })).toBe(false);
  const errors = validate.errors!;
  const localized = errors.find((error) => error.keyword === 'oneOf')!.message!;
  expect(localized).not.toBe('must match exactly one schema in oneOf');
  const before = JSON.stringify(errors);
  const state = {
    jsonforms: {
      core: { errors },
      i18n: {
        translateError: defaultErrorTranslator,
        translate: createTranslator((_key, fallback) => fallback),
        locale,
      },
    },
  } as unknown as JsonFormsState;
  const ui = { type: 'Control', scope: '#', i18n: 'quantity' };
  expect(scalarErrorMessage(state, { type: 'integer' }, ui, 'value')).toBe(localized);
  state.jsonforms.i18n!.translate = createTranslator((key, fallback) =>
    key === 'quantity.error.oneOf' ? 'Custom quantity error' : fallback,
  );
  expect(scalarErrorMessage(state, { type: 'integer' }, ui, 'value')).toBe('Custom quantity error');
  expect(JSON.stringify(errors)).toBe(before);
  locale = 'en';
  expect(validate({ value: 15 })).toBe(false);
  expect(validate.errors!.find((error) => error.keyword === 'oneOf')!.message).toBe(
    'must match exactly one schema in "oneOf"',
  );
});

it('preserves translated ajv-errors messages unless overridden by the control catalog', () => {
  const translate = createTranslator((key, fallback) =>
    key === 'error.errorMessage.quantityChoice' ? 'Use exactly one permitted multiple' : fallback,
  );
  const validate = createAjv({ locale: 'bg', translate }).compile({
    type: 'object',
    properties: {
      value: {
        type: 'integer',
        oneOf: [{ multipleOf: 3 }, { multipleOf: 5 }],
        errorMessage: { oneOf: 'quantityChoice' },
      },
    },
  });
  expect(validate({ value: 15 })).toBe(false);
  const state = {
    jsonforms: {
      core: { errors: validate.errors },
      i18n: { translateError: defaultErrorTranslator, locale: 'bg', translate },
    },
  } as unknown as JsonFormsState;
  expect(
    scalarErrorMessage(state, { type: 'integer' }, { type: 'Control', scope: '#' }, 'value'),
  ).toBe('Use exactly one permitted multiple');
});

it('applies field and global keyword overrides before a schema-authored error fallback', async () => {
  const { createPresentationErrorTranslator } = await import('../../src/lib/core/ajv-i18n');
  const validate = createAjv().compile({
    type: 'object',
    properties: {
      value: {
        type: 'integer',
        oneOf: [{ multipleOf: 3 }, { multipleOf: 5 }],
        errorMessage: { oneOf: 'quantityChoice' },
      },
    },
  });
  expect(validate({ value: 15 })).toBe(false);
  const error = validate.errors!.find((item) => item.keyword === 'oneOf')!;
  const original = JSON.stringify(error);
  const ui = { type: 'Control', scope: '#/properties/value', i18n: 'quantity' };
  const translator = (messages: Record<string, string>) =>
    createTranslator((key, fallback) => (Object.hasOwn(messages, key) ? messages[key] : fallback));
  const present = createPresentationErrorTranslator('bg');
  const authored = { 'error.errorMessage.quantityChoice': 'Use one permitted multiple' };
  expect(present(error, translator(authored), ui)).toBe('Use one permitted multiple');
  const summary = (messages: Record<string, string>) =>
    formatErrorSummary(
      [error],
      { type: 'object', properties: { value: { type: 'integer' } } },
      ui,
      translator(messages),
      present,
    )[0].message;
  expect(summary(authored)).toBe('Use one permitted multiple');
  expect(
    present(error, translator({ ...authored, 'error.oneOf': 'Global choice error' }), ui),
  ).toBe('Global choice error');
  expect(summary({ ...authored, 'error.oneOf': 'Global choice error' })).toBe(
    'Global choice error',
  );
  expect(
    present(
      error,
      translator({
        ...authored,
        'error.oneOf': 'Global choice error',
        'quantity.error.oneOf': 'Field choice error',
      }),
      ui,
    ),
  ).toBe('Field choice error');
  expect(summary({ ...authored, 'quantity.error.oneOf': 'Field choice error' })).toBe(
    'Field choice error',
  );
  expect(summary({ ...authored, 'quantity.error.custom': 'Whole-control error' })).toBe(
    'Whole-control error',
  );
  expect(present(error, translator({ ...authored, 'quantity.error.oneOf': '' }), ui)).toBe('');
  expect(summary({ ...authored, 'quantity.error.oneOf': '' })).toBe('');
  expect(JSON.stringify(error)).toBe(original);
});

it('refreshes existing keyword errors without validating or mutating them', async () => {
  const { createPresentationErrorTranslator } = await import('../../src/lib/core/ajv-i18n');
  const validate = createAjv({ locale: 'en' }).compile({ type: 'string', minLength: 5 });
  validate('x');
  const error = validate.errors![0];
  const before = JSON.stringify(error);
  const translate = createTranslator((_key, fallback) => fallback);
  const english = createPresentationErrorTranslator('en')(error, translate, undefined);
  const bulgarian = createPresentationErrorTranslator('bg-BG')(error, translate, undefined);
  expect(bulgarian).not.toBe(english);
  expect(createPresentationErrorTranslator('en')(error, translate, undefined)).toBe(english);
  expect(JSON.stringify(error)).toBe(before);
});

it('retranslates authored messages while preserving original keyword and path', async () => {
  const { createPresentationErrorTranslator } = await import('../../src/lib/core/ajv-i18n');
  const validate = createAjv().compile({
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 3, errorMessage: { minLength: 'shortName' } },
    },
  });
  validate({ name: 'x' });
  const error = validate.errors![0];
  expect(error.keyword).toBe('minLength');
  expect(error.instancePath).toBe('/name');
  const translate = createTranslator((key, fallback) =>
    key === 'error.errorMessage.shortName' ? 'Кратко име' : fallback,
  );
  expect(createPresentationErrorTranslator('bg')(error, translate, undefined)).toBe('Кратко име');
  const hostError = { ...error, message: 'Host supplied message' };
  // Additional errors are unmarked objects supplied by the host.
  const additional = {
    keyword: hostError.keyword,
    instancePath: hostError.instancePath,
    schemaPath: hostError.schemaPath,
    params: hostError.params,
    message: hostError.message,
  };
  expect(createPresentationErrorTranslator('bg')(additional, translate, undefined)).toBe(
    'Host supplied message',
  );
});

it('unwraps nested authored errors to their original required-property target', async () => {
  const { unwrapErrorMessageErrors, createPresentationErrorTranslator } =
    await import('../../src/lib/core/ajv-i18n');
  const leaf = {
    keyword: 'required',
    instancePath: '/person',
    schemaPath: '#/properties/person/required',
    params: { missingProperty: 'name' },
    message: 'must have required property name',
    emUsed: true,
  };
  const inner = {
    keyword: 'errorMessage',
    instancePath: '/person',
    schemaPath: '#/properties/person/errorMessage',
    params: { errors: [leaf] },
    message: 'inner',
    emUsed: true,
  };
  const outer = {
    keyword: 'errorMessage',
    instancePath: '',
    schemaPath: '#/errorMessage',
    params: { errors: [inner] },
    message: 'outer',
  };
  const errors = unwrapErrorMessageErrors([leaf, inner, outer]);
  expect(errors).toHaveLength(1);
  expect(errors[0]).toMatchObject({
    keyword: 'required',
    instancePath: '/person',
    params: { missingProperty: 'name' },
    message: 'outer',
  });
  expect(leaf.message).toBe('must have required property name');
  const translate = createTranslator((key, fallback) =>
    key === 'error.errorMessage.outer' ? 'Choose a name' : fallback,
  );
  expect(createPresentationErrorTranslator('en')(errors[0], translate, undefined)).toBe(
    'Choose a name',
  );
});
