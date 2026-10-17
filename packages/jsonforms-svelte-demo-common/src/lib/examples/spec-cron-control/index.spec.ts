import { expect, it } from 'vitest';
import { createSpecCronControlExample } from './index';
import data from './data.json';
import supplements from './supplemental-translations.json';

it('retains unsupported imported dialects and supplies live English/Bulgarian labels', () => {
  let locale = 'en';
  const example = createSpecCronControlExample(() => locale);
  expect(example.data).toEqual(data);
  expect(example.i18n?.translate?.('cronExample/properties/jobName.label', '')).toBe('Job name');
  locale = 'bg';
  expect(example.i18n?.translate?.('cronExample/properties/jobName.label', '')).toBe(
    'Име на задачата',
  );
  expect(example.i18n?.translate?.('cron.choose', '')).toBe('Изберете график');
  expect(Object.keys(supplements.en).sort()).toEqual(Object.keys(supplements.bg).sort());
});
