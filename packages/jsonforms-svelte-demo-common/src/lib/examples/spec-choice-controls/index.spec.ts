import { expect, it } from 'vitest';
import { oneOfToEnumOptionMapper } from '@jsonforms/core';
import schema from './schema.json';
import { createSpecChoiceControlsExample } from './index';
import sourceTranslations from './translations.json';

it('localizes generated branch details without modifying the spec catalog', () => {
  let locale = 'en';
  const example = createSpecChoiceControlsExample(() => locale);
  expect(example.i18n?.translate?.('cardContact.choices.0.label', 'fallback')).toBe('Email');
  locale = 'bg';
  expect(example.i18n?.translate?.('cardContact.choices.0.label', 'fallback')).toBe('Имейл');
  expect(example.i18n?.translate?.('cardContact.choices.1.label', 'fallback')).toBe('Поща');
  expect(example.i18n?.translate?.('cardContact.address.label', 'fallback')).toBe('Имейл адрес');
  expect(sourceTranslations.bg).not.toHaveProperty('cardContact.choices.0.label');
});

it('registers the spec email detail as a trusted, schema-path-aware tester', () => {
  const example = createSpecChoiceControlsExample(() => 'en');
  const tester = example.uischemas![0].tester;
  const schema = { type: 'object', properties: { address: { type: 'string', format: 'email' } } };
  expect(typeof tester).toBe('function');
  expect(tester(schema, '#/properties/cardContact', 'cardContact')).toBe(10);
  expect(tester(schema, '#/properties/other', 'other')).toBe(-1);
  expect(tester({ type: 'object' }, '#/properties/cardContact', 'cardContact')).toBe(-1);
});

it.each(['en', 'bg'] as const)(
  'supplies exact branch translation keys for composite constants in %s',
  (locale) => {
    const example = createSpecChoiceControlsExample(() => locale);
    for (const name of ['objectDropdown', 'objectRadio', 'arrayDropdown', 'arrayRadio'] as const) {
      const options = schema.properties[name].oneOf.map((branch) =>
        oneOfToEnumOptionMapper(branch, example.i18n!.translate),
      );
      expect(options.map((option) => option.label)).toEqual([
        sourceTranslations[locale]['compositeChoices.option0.title'],
        sourceTranslations[locale]['compositeChoices.option1.title'],
      ]);
      expect(options.map((option) => option.value)).toEqual(
        schema.properties[name].oneOf.map((branch) => branch.const),
      );
    }
  },
);
