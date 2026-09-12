import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialize, updateProperties } from '../dist/editor/document/commands/index.js';
import { translationValue } from '../dist/editor/inspector/translations.js';
test('translation edits preserve locales, use JSON Forms suffixes, and do not migrate keys', () => {
  const doc = initialize({ uischema: { type: 'Group', label: 'Contact', elements: [] }, translations: { en: { keep: 'Keep' } } });
  const base = { label: 'Contact', multi: false, required: false, translationLocale: 'en' };
  const keyed = updateProperties(doc, [], { ...base, i18n: 'contact' });
  const english = updateProperties(keyed, [], { ...base, i18n: 'contact', translatedLabel: 'Contact details' });
  const bulgarian = updateProperties(english, [], { ...base, i18n: 'contact', translationLocale: 'bg', translatedLabel: 'Контакти' });
  assert.equal(translationValue(bulgarian, 'en', 'contact', 'label'), 'Contact details');
  assert.equal(translationValue(bulgarian, 'bg', 'contact', 'label'), 'Контакти');
  const renamed = updateProperties(bulgarian, [], { ...base, i18n: 'newKey', translatedLabel: 'stale value' });
  assert.equal(translationValue(renamed, 'en', 'newKey', 'label'), undefined);
  assert.equal(translationValue(renamed, 'en', 'contact', 'label'), 'Contact details');
  assert.deepEqual(doc.translations, { en: { keep: 'Keep' } });
});

test('declared empty languages expose simultaneous translation fields without overwriting catalogs', async () => {
  const { addFormLanguage, formLanguages } = await import('../dist/editor/i18n/form-languages.js');
  const { inspectorDefinition } = await import('../dist/editor/inspector/definition.js');
  let doc = initialize({ uischema: { type: 'Group', label: 'Contact', i18n: 'contact', elements: [] } });
  doc = addFormLanguage(addFormLanguage(doc, 'en'), 'fr-ca');
  assert.deepEqual(formLanguages(doc.translations), ['en', 'fr-CA']);
  assert.throws(() => addFormLanguage(doc, 'EN'), /already exists/);
  assert.throws(() => addFormLanguage(doc, '__proto__'));
  assert.ok(inspectorDefinition(doc, doc.uischema).fields.some(field => field.key === 'translatedLabel:fr-CA'));
  const result = updateProperties(doc, [], { label: 'Contact', multi: false, required: false, i18n: 'contact', 'translatedLabel:en': 'Contact', 'translatedLabel:fr-CA': 'Coordonnées' });
  assert.equal(translationValue(result, 'en', 'contact', 'label'), 'Contact');
  assert.equal(translationValue(result, 'fr-CA', 'contact', 'label'), 'Coordonnées');
  assert.deepEqual(doc.translations, { en: {}, 'fr-CA': {} });
});
