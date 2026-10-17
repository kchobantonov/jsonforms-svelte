import { expect, it } from 'vitest';
import { createSpecMixedControlExample } from './index';
import data from './data.json';
import supplements from './supplemental-translations.json';

it('preserves intentional invalid values and translates schema supplements live', () => {
  let locale = 'en';
  const example = createSpecMixedControlExample(() => locale);
  expect(example.data).toEqual(data);
  expect(example.i18n?.translate?.('mixedExample/properties/quantity.label', '')).toBe('Quantity');
  locale = 'bg';
  expect(example.i18n?.translate?.('mixedExample/properties/quantity.label', '')).toBe(
    'Количество',
  );
  expect(example.i18n?.translate?.('mixedComposition.textBranch.label', '')).toBe(
    'Текст (поне три знака)',
  );
  expect(Object.keys(supplements.en).sort()).toEqual(Object.keys(supplements.bg).sort());
});
