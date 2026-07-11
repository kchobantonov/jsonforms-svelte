import { describe, expect, it } from 'vitest';
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

  it('keeps template text when value interpolation throws at runtime', () => {
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
