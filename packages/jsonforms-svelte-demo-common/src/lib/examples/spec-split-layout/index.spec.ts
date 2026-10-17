import { expect, it } from 'vitest';
import { createSpecSplitLayoutExample } from './index';

it('translates source navigation, fields and explanatory text without changing authored data', () => {
  let locale = 'en';
  const example = createSpecSplitLayoutExample(() => locale);
  const originalData = structuredClone(example.data);
  const translate = (key: string, fallback: string) => example.i18n!.translate!(key, fallback);
  expect(translate('featureNavigation.section3.label', '')).toBe('Fixed boundary');
  expect(translate('showTeamPane.label', '')).toBe('Show team pane');
  locale = 'bg';
  expect(translate('featureNavigation.section3.label', '')).toBe('Фиксирана граница');
  expect(translate('showTeamPane.label', '')).toBe('Показване на панела на екипа');
  expect(translate('A hidden pane leaves layout, separator and all', '')).toBe(
    'Скритият панел се премахва от оформлението заедно с разделителя',
  );
  expect(example.data).toEqual(originalData);
});
