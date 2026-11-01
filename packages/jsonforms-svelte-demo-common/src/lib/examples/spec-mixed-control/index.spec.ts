import { expect, it } from 'vite-plus/test';
import { createSpecMixedControlExample } from './index';
import data from './data.json';
import supplements from './supplemental-translations.json';
import { createCombinatorRenderInfos, type JsonSchema } from '@jsonforms/core';

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
  const schema = example.schema as JsonSchema;
  const branchSchema = (schema.properties as Record<string, JsonSchema>).branchFeedback;
  const branch = branchSchema.anyOf?.[0] as (JsonSchema & { i18n?: string }) | undefined;
  expect(branch?.i18n).toBe('branchFeedback.shortBranch');
  expect(example.i18n?.translate?.(`${branch?.i18n}.label`, 'Short text')).toBe('Кратък текст');
  const infos = createCombinatorRenderInfos(
    branchSchema.anyOf!,
    schema,
    'anyOf',
    { type: 'Control', scope: '#/properties/branchFeedback' },
    'branchFeedback',
    [],
  );
  expect(infos.map((info) => (info.schema as JsonSchema & { i18n?: string }).i18n)).toEqual([
    'branchFeedback.shortBranch',
    'branchFeedback.longBranch',
  ]);
  expect(Object.keys(supplements.en).sort()).toEqual(Object.keys(supplements.bg).sort());
});
