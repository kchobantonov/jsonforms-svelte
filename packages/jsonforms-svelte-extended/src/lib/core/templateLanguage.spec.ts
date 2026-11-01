import { expect, it } from 'vite-plus/test';
import { templateLanguageResolution } from './templateLanguage';

it('uses explicit and namespaced languages ahead of the deprecated flat default', () => {
  const config = {
    defaultTemplateLang: 'legacy',
    jsonformsExtended: { defaultTemplateLang: 'portable' },
  };
  expect(templateLanguageResolution({ lang: 'explicit' }, config)).toEqual({
    language: 'explicit',
    legacyFlatDefault: false,
  });
  expect(templateLanguageResolution({}, config)).toEqual({
    language: 'portable',
    legacyFlatDefault: false,
  });
  expect(templateLanguageResolution({}, { defaultTemplateLang: 'legacy' })).toEqual({
    language: 'legacy',
    legacyFlatDefault: true,
  });
  expect(templateLanguageResolution({}, {})).toEqual({
    language: 'ractive',
    legacyFlatDefault: false,
  });
});
