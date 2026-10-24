import { expect, it } from 'vite-plus/test';
import { createLocalizedExample, mergeExampleTranslations } from './definitions';

it('merges arbitrary locale catalogs and preserves live locale fallback and empty messages', () => {
  const source = {
    en: { title: 'Title', retained: 'Retained', blank: 'Fallback' },
    fr: { title: 'Titre', retained: 'Conservé' },
  };
  const supplement = {
    fr: { title: 'Titre modifié', blank: '' },
    de: { title: 'Titel', count: '{count} Einträge' },
  };
  const original = structuredClone({ source, supplement });
  const translations = mergeExampleTranslations(source, supplement);
  let locale = 'fr-CA';
  const example = createLocalizedExample(
    { name: 'catalog', label: 'Catalog' },
    translations,
    () => locale,
  );
  expect(example.i18n?.translate?.('title', '')).toBe('Titre modifié');
  expect(example.i18n?.translate?.('retained', '')).toBe('Conservé');
  expect(example.i18n?.translate?.('blank', 'Fallback')).toBe('');
  locale = 'de';
  expect(example.i18n?.translate?.('title', '')).toBe('Titel');
  expect(example.i18n?.translate?.('count', '', { count: 3 })).toBe('3 Einträge');
  expect(example.i18n?.translate?.('retained', '')).toBe('Retained');
  expect({ source, supplement }).toEqual(original);
  expect(example).not.toHaveProperty('schema');
  expect(example).not.toHaveProperty('data');
  expect(example).not.toHaveProperty('uischema');
});

it('treats prototype-looking locale and message names as own catalog keys', () => {
  const translations = mergeExampleTranslations(
    JSON.parse('{"__proto__":{"title":"Own locale"},"en":{"__proto__":"Own message"}}'),
    { fr: { title: 'Titre' } },
  );
  expect(Object.hasOwn(translations, '__proto__')).toBe(true);
  expect(Object.getPrototypeOf(translations)).toBe(Object.prototype);
  const example = createLocalizedExample(
    { name: 'own', label: 'Own' },
    translations,
    () => '__proto__',
  );
  expect(example.i18n?.translate?.('title', '')).toBe('Own locale');
  expect(example.i18n?.translate?.('__proto__', '')).toBe('Own message');
});
