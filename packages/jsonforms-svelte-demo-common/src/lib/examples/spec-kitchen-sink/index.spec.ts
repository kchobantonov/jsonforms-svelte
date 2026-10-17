import { expect, it } from 'vitest';
import { createSpecKitchenSinkExample } from './index';
import data from './data.json';
import invalid from './invalid-data.json';
import { createAjv } from '@chobantonov/jsonforms-svelte-extended';

it('keeps the valid and deliberately invalid datasets and live author translations', () => {
  let locale = 'en';
  const example = createSpecKitchenSinkExample(() => locale);
  expect(example.data).toEqual(data);
  const validate = createAjv().compile(example.schema!);
  expect(validate(structuredClone(data))).toBe(true);
  expect(validate(structuredClone(invalid))).toBe(false);
  expect(new Set(validate.errors?.map((error) => error.instancePath)).size).toBe(10);
  expect(example.i18n?.translate?.('firstName.label', '')).toBe('First name');
  locale = 'bg';
  expect(example.i18n?.translate?.('firstName.label', '')).toBe('Име');
});
