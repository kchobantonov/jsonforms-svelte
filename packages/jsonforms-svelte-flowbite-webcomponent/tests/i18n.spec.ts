import { describe, expect, it } from 'vite-plus/test';
import { createTranslator } from '../src/lib/i18n';

describe('i18n translator', () => {
  it('resolves exact locale translations', () => {
    const translator = createTranslator('de-DE', {
      'de-DE': {
        greeting: {
          hello: 'Hallo ${name}',
        },
      },
    });

    expect(translator('greeting.hello', 'Hello ${name}', { name: 'Anna' })).toBe('Hallo Anna');
  });

  it('falls back to language-only locale when region variant is missing', () => {
    const translator = createTranslator('de-AT', {
      de: {
        greeting: {
          hello: 'Hallo ${name}',
        },
      },
    });

    expect(translator('greeting.hello', 'Hello ${name}', { name: 'Anna' })).toBe('Hallo Anna');
  });

  it('falls back to english locale when target locale is missing', () => {
    const translator = createTranslator('fr-FR', {
      en: {
        greeting: {
          hello: 'Hello ${name}',
        },
      },
    });

    expect(translator('greeting.hello', 'Default', { name: 'Anna' })).toBe('Hello Anna');
  });

  it('falls back to default message when key is missing', () => {
    const translator = createTranslator('en', {
      en: {
        greeting: {
          hello: 'Hello ${name}',
        },
      },
    });

    expect(translator('greeting.missing', 'Fallback')).toBe('Fallback');
  });

  it('returns undefined when no translation and no default are provided', () => {
    const translator = createTranslator('en', undefined);
    expect(translator('greeting.hello', undefined)).toBeUndefined();
  });

  it('leaves expression syntax inert in catalog messages', () => {
    const translator = createTranslator('en', {
      en: {
        message: {
          broken: 'Value ${unknown.call()}',
        },
      },
    });

    expect(translator('message.broken', 'Fallback', {})).toBe('Value ${unknown.call()}');
  });
});

it('falls back per message and interpolates current values without freezing the first result', () => {
  const translate = createTranslator('bg-BG', {
    'bg-BG': { region: 'Регион', empty: '' },
    bg: { language: 'Български', count: 'Брой ${count}' },
    en: { fallback: 'English', empty: 'not empty' },
  });
  expect(translate('region')).toBe('Регион');
  expect(translate('language')).toBe('Български');
  expect(translate('fallback')).toBe('English');
  expect(translate('empty', 'default')).toBe('');
  expect(translate('count', undefined, { count: 1 })).toBe('Брой 1');
  expect(translate('count', undefined, { count: 2 })).toBe('Брой 2');
  expect(translate('missing')).toBeUndefined();
});
