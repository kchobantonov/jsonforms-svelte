import { expect, it } from 'vitest';
import { createSpecCombinatorsExample } from './index';
import sourceSchema from './schema.json';
import sourceData from './data.json';
import supplements from './supplemental-translations.json';

it('preserves the source schema/data while supplying both localization catalogs', () => {
  let locale = 'en';
  const example = createSpecCombinatorsExample(() => locale);
  expect(example.data).toEqual(sourceData);
  expect(example.schema?.properties?.contact.oneOf).toHaveLength(
    sourceSchema.properties.contact.oneOf.length,
  );
  expect(example.schema?.properties?.contact.properties?.name).toMatchObject(
    sourceSchema.properties.contact.properties.name,
  );
  expect(Object.keys(supplements.en).sort()).toEqual(Object.keys(supplements.bg).sort());
  expect(example.i18n?.translate?.('Email contact', '')).toBe('Email contact');
  locale = 'bg';
  expect(example.i18n?.translate?.('Email contact', '')).toBe('Връзка по имейл');
  expect(
    example.i18n?.translate?.(
      'specCombinators.schema/properties/contact/properties/name.label',
      '',
    ),
  ).toBe('Име за контакт');
});
