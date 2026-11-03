import { expect, it } from 'vite-plus/test';
import { createTranslator } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';
import { createPresentationErrorTranslator, unwrapErrorMessageErrors } from './index';

it.each([
  ['en', 'Enter the name printed on the certificate.'],
  ['bg', 'Въведете името, отпечатано на сертификата.'],
])('uses a schema-authored message when no keyword override resolves (%s)', (locale, label) => {
  const original: ErrorObject = {
    keyword: 'minLength',
    instancePath: '/certifications/2/name',
    schemaPath: '#/properties/certifications/items/properties/name/minLength',
    params: { limit: 1 },
    message: 'must NOT have fewer than 1 characters',
  };
  const wrapped: ErrorObject = {
    keyword: 'errorMessage',
    instancePath: original.instancePath,
    schemaPath: '#/properties/certifications/items/properties/name/errorMessage',
    params: { errors: [original] },
    message: 'certificateNameRequired',
  };
  const [display] = unwrapErrorMessageErrors([wrapped]);
  expect(Object.getOwnPropertySymbols(display)).toContain(
    Symbol.for('@chobantonov/jsonforms-svelte-extended/authoredMessage'),
  );
  const translate = createTranslator((key, fallback) =>
    key === 'error.errorMessage.certificateNameRequired' ? label : fallback,
  );
  expect(createPresentationErrorTranslator(locale)(display, translate)).toBe(label);
  const override = createTranslator((key, fallback) =>
    key === 'error.errorMessage.certificateNameRequired'
      ? label
      : key === 'error.minLength'
        ? 'Generic length message'
        : fallback,
  );
  expect(createPresentationErrorTranslator(locale)(display, override)).toBe(
    'Generic length message',
  );
});
