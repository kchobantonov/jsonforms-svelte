import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { cleanup } from 'vitest-browser-svelte';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { flowbiteRenderers } from '../../src/lib/renderers';
import { flowbiteCells } from '../../src/lib/cells';
import { createSpecMixedControlExample } from '../../../jsonforms-svelte-demo-common/tests/fixtures/specAdapters/mixed-control';
import { mountForm } from '../testUtils';
import '../test.css';

afterEach(cleanup);

it('keeps the selected type visible in a missing mixed table cell draft', async () => {
  const example = createSpecMixedControlExample(() => 'en');
  const { view } = await mountForm({
    schema: example.schema as JsonSchema,
    uischema: example.uischema as UISchemaElement,
    data: example.data,
    config: example.config as Record<string, unknown>,
    i18n: example.i18n,
    renderers: flowbiteRenderers,
    cells: flowbiteCells,
  });
  await page.getByRole('tab', { name: 'Table cells' }).click();
  const editButtons = view.container.querySelectorAll<HTMLButtonElement>(
    'button[aria-label="Edit Value"]',
  );
  expect(editButtons.length).toBeGreaterThan(0);
  editButtons[editButtons.length - 1].click();
  const dialog = page.getByRole('dialog', { name: 'Value' });
  const selector = dialog.getByRole('combobox', { name: 'Value type' });
  await expect.element(selector).toBeVisible();
  const select = selector.query() as HTMLSelectElement;
  const stringOption = [...select.options].find(
    (option) => option.textContent?.trim() === 'string',
  );
  expect(stringOption).toBeTruthy();
  select.value = stringOption!.value;
  select.dispatchEvent(new Event('input', { bubbles: true }));
  select.dispatchEvent(new Event('change', { bubbles: true }));
  await vi.waitFor(() => {
    const currentSelect = selector.query() as HTMLSelectElement;
    expect(currentSelect.selectedOptions[0]?.textContent?.trim()).toBe('string');
    expect(dialog.getByRole('textbox').query()).not.toBeNull();
  });
});
it.each(['en', 'bg'])(
  'renders the canonical mixed composition examples in %s without modifying their data',
  async (locale) => {
    const example = createSpecMixedControlExample(() => locale);
    const { view, onchange } = await mountForm({
      schema: example.schema as JsonSchema,
      uischema: example.uischema as UISchemaElement,
      data: example.data,
      config: example.config as Record<string, unknown>,
      i18n: example.i18n,
      renderers: flowbiteRenderers,
    });
    await page
      .getByRole('tab', {
        name: example.i18n!.translate!('mixedComposition.navigation.label', ''),
        exact: true,
      })
      .click();
    await expect
      .poll(() =>
        [...view.container.querySelectorAll<HTMLInputElement>('input')].map((input) => input.value),
      )
      .toEqual(expect.arrayContaining(['Hello', 'Ada', 'abcd']));
    expect(onchange.mock.lastCall?.[0].data).toEqual(example.data);
    expect(
      onchange.mock.lastCall?.[0].errors.some(
        (error: { keyword: string; instancePath: string }) =>
          error.keyword === 'oneOf' && error.instancePath === '/overlappingChoice',
      ),
    ).toBe(true);
  },
);
