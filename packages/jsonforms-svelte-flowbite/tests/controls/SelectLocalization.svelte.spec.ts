import { clearAllIds, type JsonSchema, type Translator } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as enumEntry } from '../../src/lib/controls/EnumControlRenderer.entry';
import { entry as oneOfEntry } from '../../src/lib/controls/OneOfEnumControlRenderer.entry';
import { mountControl, waitForChange } from '../testUtils';

beforeEach(clearAllIds);
afterEach(cleanup);

describe.each([
  ['enum', enumEntry, { type: 'string', enum: ['A', 'B'] }],
  ['oneOf', oneOfEntry, { type: 'string', oneOf: [{ const: 'A' }, { const: 'B' }] }],
] as const)('%s native select localization', (_, entry, schema) => {
  const propertySchema = schema as unknown as JsonSchema;

  it.each([
    ['en', 'Select an option', 'Clear value'],
    ['bg', 'Изберете опция', 'Изчистване на стойността'],
  ])('translates placeholder and clear action in %s', async (locale, placeholder, label) => {
    const { view, onchange } = await mountControl({
      renderers: [entry],
      propertySchema,
      value: 'A',
      i18n: { locale },
    });
    const select = view.container.querySelector('select')!;
    expect(select.options[0].textContent).toBe(placeholder);
    const clear = view.container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
    expect(clear).toBeTruthy();
    const before = onchange.mock.calls.length;
    await view.getByRole('button', { name: label, exact: true }).click();
    const change = await waitForChange(onchange, before);
    expect(change.data.value).toBeUndefined();
    expect(document.activeElement).toBe(select);
    expect(view.container.querySelector('button[aria-label="Clear search value"]')).toBeNull();
  });

  it('uses host messages for an additional locale and preserves an explicit empty placeholder', async () => {
    const translate: Translator = ((key: string, fallback?: string) =>
      ({
        'control.clearValue': 'Effacer',
        'control.selectOption': 'Choisir',
      })[key] ?? fallback) as Translator;
    const { view } = await mountControl({
      renderers: [entry],
      propertySchema,
      value: 'A',
      options: { placeholder: '' },
      i18n: { locale: 'fr', translate },
    });
    expect(view.container.querySelector('button[aria-label="Effacer"]')).toBeTruthy();
    expect(
      [...view.container.querySelectorAll('option')].map((option) => option.textContent),
    ).toEqual(['A', 'B']);
  });

  it('does not expose a clear action for a readonly control', async () => {
    const { view } = await mountControl({
      renderers: [entry],
      propertySchema,
      value: 'A',
      options: { readonly: true },
    });
    expect(view.container.querySelector('select')?.disabled).toBe(true);
    expect(view.container.querySelector('button[aria-label="Clear value"]')).toBeNull();
  });
});
