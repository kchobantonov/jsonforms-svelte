import { expect, it, vi } from 'vite-plus/test';
import { createCatalogTranslator as createTranslator } from './catalogTranslator';

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
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    expect(t('constructor')).toBeUndefined();
    expect(t('__proto__.toString')).toBeUndefined();
  } finally {
    warn.mockRestore();
  }
});

it('diagnoses a missing catalog key only without a fallback and only once per translator', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const t = createTranslator('fr-CA', { fr: { known: 'Connu' } });
    expect(t('known')).toBe('Connu');
    expect(t('missing', 'Intentional fallback')).toBe('Intentional fallback');
    expect(t('missing')).toBeUndefined();
    expect(t('missing')).toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith('i18n.missingKey', {
      message: 'Translation missing has no catalog entry or fallback.',
      details: { key: 'missing', locale: 'fr-CA' },
    });
    const noCatalog = createTranslator('fr-CA');
    expect(noCatalog('missing')).toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
  } finally {
    warn.mockRestore();
  }
});
it('leaves code and undeclared parameter syntax inert', () => {
  const source = '<% throw new Error("executed") %> ${globalThis.alert(1)} ${missing} {celName}';
  const t = createTranslator('en', { en: { source } });
  expect(t('source', undefined, {})).toBe(source);
});

it('does not evaluate catalog code or inherit interpolation parameters', () => {
  const source =
    '${globalThis.__jsonformsCatalogProbe = true} <% globalThis.__jsonformsCatalogProbe = true %> ${value} ${inherited}';
  const t = createTranslator('en', { en: { source } });
  const params = Object.assign(Object.create({ inherited: 'unsafe' }), { value: 'safe' });
  expect(t('source', undefined, params)).toBe(source.replace('${value}', 'safe'));
  expect(Object.hasOwn(globalThis, '__jsonformsCatalogProbe')).toBe(false);
});
it('keeps catalogs and current parameters independent across translator instances', () => {
  const en = createTranslator('en', { en: { count: 'Count ${count}' } });
  const bg = createTranslator('bg', { bg: { count: 'Брой ${count}' } });
  expect(en('count', undefined, { count: 1 })).toBe('Count 1');
  expect(bg('count', undefined, { count: 2 })).toBe('Брой 2');
  expect(en('count', undefined, { count: 3 })).toBe('Count 3');
});

it('formats spec catalog placeholders from current AJV error parameters', () => {
  const t = createTranslator('bg', {
    bg: { 'error.minLength': 'Поне {limit} символа; ${limit}.' },
  });
  expect(t('error.minLength', undefined, { error: { params: { limit: 6 } } })).toBe(
    'Поне 6 символа; 6.',
  );
  expect(t('error.minLength', undefined, { error: { params: { limit: 8 } } })).toBe(
    'Поне 8 символа; 8.',
  );
  expect(t('error.minLength', undefined, { limit: 0, error: { params: { limit: 6 } } })).toBe(
    'Поне 0 символа; 0.',
  );
  expect(t('error.minLength', undefined, { error: { params: Object.create({ limit: 6 }) } })).toBe(
    'Поне {limit} символа; ${limit}.',
  );
});

it('diagnoses a missing catalog parameter once without treating ordinary fallbacks as author errors', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const t = createTranslator('bg-BG', {
      bg: { count: 'Брой {count}; {missing}' },
    });
    expect(t('count', undefined, { count: 0 })).toBe('Брой 0; {missing}');
    expect(t('count', undefined, { count: 2 })).toBe('Брой 2; {missing}');
    expect(t('other', 'Fallback {missing}', { count: 2 })).toBe('Fallback {missing}');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('i18n.missingParameter', {
      message: 'Translation count is missing parameter missing.',
      details: { key: 'count', parameter: 'missing', locale: 'bg-BG' },
    });
  } finally {
    warn.mockRestore();
  }
});

it('reports an unfilled catalog placeholder when the caller supplies no values object', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const t = createTranslator('en', { en: { greeting: 'Hello {name}' } });
    expect(t('greeting')).toBe('Hello {name}');
    expect(t('greeting')).toBe('Hello {name}');
    expect(t('other', 'Fallback {name}')).toBe('Fallback {name}');
    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith('i18n.missingParameter', {
      message: 'Translation greeting is missing parameter name.',
      details: { key: 'greeting', parameter: 'name', locale: 'en' },
    });
  } finally {
    warn.mockRestore();
  }
});
