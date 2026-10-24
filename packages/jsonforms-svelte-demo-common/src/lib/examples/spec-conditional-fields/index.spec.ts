import { expect, it } from 'vite-plus/test';
import { createSpecConditionalFieldsExample } from './index';
import sourceSchema from './schema.json';
import sourceUi from './uischema.json';

it('keeps the canonical schemas and supplies live EN/BG field and group labels', () => {
  let locale = 'en';
  const example = createSpecConditionalFieldsExample(() => locale);
  expect(example.schema).toEqual(sourceSchema);
  expect(example.uischema).not.toBe(sourceUi);
  expect(example.i18n?.translate?.('name.label', '')).toBe('Name');
  locale = 'bg';
  expect(example.i18n?.translate?.('name.label', '')).toBe('Име');
  expect(example.i18n?.translate?.('Billing.label', '')).toBe('Фактуриране');
});
