import { expect, it } from 'vitest';
import { createTranslator } from './i18n';

it('falls back for each message through exact locale, language, English and default', () => {
  const t = createTranslator('bg-BG', {
    'bg-BG': { exact: 'regional', empty: '' },
    bg: { exact: 'language', language: 'Български', nested: { value: 'вложен' } },
    en: { english: 'English', empty: 'not empty' },
  });
  expect(t('exact')).toBe('regional');
  expect(t('language')).toBe('Български');
  expect(t('english')).toBe('English');
  expect(t('nested.value')).toBe('вложен');
  expect(t('empty', 'fallback')).toBe('');
  expect(t('missing', 'fallback')).toBe('fallback');
  expect(t('missing')).toBeUndefined();
});
it('caches parsed text while using current parameters on every call', () => {
  const t = createTranslator('en', { en: { size: 'Limit ${limitText}' } });
  expect(t('size', undefined, { limitText: '1 KB' })).toBe('Limit 1 KB');
  expect(t('size', undefined, { limitText: '2 KB' })).toBe('Limit 2 KB');
  expect(t('size', undefined, { limitText: 0 })).toBe('Limit 0');
  expect(t('size', undefined, { limitText: '' })).toBe('Limit ');
});
it('preserves flat catalog keys and does not traverse inherited properties', () => {
  const t = createTranslator('en', { en: { 'nested.value': 'flat', nested: { value: 'nested' } } });
  expect(t('nested.value')).toBe('flat');
  expect(t('constructor')).toBeUndefined();
  expect(t('__proto__.toString')).toBeUndefined();
});
it('leaves code and undeclared parameter syntax inert', () => {
  const source = '<% throw new Error("executed") %> ${globalThis.alert(1)} ${missing} {celName}';
  const t = createTranslator('en', { en: { source } });
  expect(t('source', undefined, {})).toBe(source);
});
