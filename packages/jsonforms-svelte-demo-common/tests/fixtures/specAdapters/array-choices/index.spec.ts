import { expect, it } from 'vite-plus/test';
import { createSpecArrayChoicesExample } from './index';
import schema from '@chobantonov/jsonforms-extended-spec/examples/array-choices/schema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/array-choices/data.json';
import supplements from '@chobantonov/jsonforms-extended-spec/examples/array-choices/translations.json';

it('preserves canonical choices and invalid data while supplying both locale catalogs', () => {
  let locale = 'en';
  const example = createSpecArrayChoicesExample(() => locale);
  expect(example.schema).toEqual(schema);
  expect(example.data).toEqual(data);
  expect(example.i18n?.translate?.('tags.label', '')).toBe('Catalog tags');
  locale = 'bg';
  expect(example.i18n?.translate?.('tags.label', '')).toBe('Етикети в каталога');
  expect(example.i18n?.translate?.('teams.eng', '')).toBe('Инженеринг');
  expect(example.i18n?.translate?.('specArrayChoices.text0.text', '')).toContain(
    'три представяния',
  );
  expect(Object.keys(supplements.en).sort()).toEqual(Object.keys(supplements.bg).sort());
});
