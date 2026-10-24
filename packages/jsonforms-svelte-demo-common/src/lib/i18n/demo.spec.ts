import { expect, it } from 'vite-plus/test';
import { createDemoTranslator } from './demo';
import messages from '../components/demo-messages.json';

it('keeps demo-shell message keys and interpolation parameters aligned in every catalog', () => {
  const parameters = (message: string) =>
    [...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const catalog of Object.values(messages)) {
    expect(Object.keys(catalog).sort()).toEqual(Object.keys(messages.en).sort());
    for (const key of Object.keys(messages.en) as (keyof typeof messages.en)[]) {
      expect(catalog[key].trim(), key).not.toBe('');
      expect(parameters(catalog[key]), key).toEqual(parameters(messages.en[key]));
    }
  }
});

it('uses regional and English fallback with named parameters', () => {
  expect(
    createDemoTranslator('bg-BG')('nav.currentThemeColor', undefined, { color: 'Океан' }),
  ).toBe('Цвят на темата: Океан');
  expect(createDemoTranslator('fr-CA')('nav.showExamples')).toBe(messages.en['nav.showExamples']);
  expect(createDemoTranslator('fr-CA')('missing.message')).toBe('missing.message');
  expect(createDemoTranslator('fr-CA')('missing.message', '')).toBe('');
});
