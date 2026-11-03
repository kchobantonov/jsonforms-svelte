import { expect, it } from 'vite-plus/test';
import { templateLanguage } from './templateLanguage';

it('uses the explicit or namespaced template language', () => {
  const config = { jsonformsExtended: { defaultTemplateLang: 'ractive' } };
  expect(templateLanguage({ lang: 'explicit' }, config)).toBe('explicit');
  expect(templateLanguage({}, config)).toBe('ractive');
  expect(templateLanguage({}, {})).toBe('ractive');
});
