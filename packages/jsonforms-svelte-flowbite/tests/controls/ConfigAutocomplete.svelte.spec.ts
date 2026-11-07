import '../test.css';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { cleanup } from 'vitest-browser-svelte';
import { flowbiteRenderers } from '../../src/lib/renderers';
import { mountForm } from '../testUtils';

afterEach(cleanup);

it.each([
  { config: { autocomplete: true }, options: {}, searchable: true },
  { config: { autocomplete: true }, options: { autocomplete: false }, searchable: false },
  { config: { autocomplete: false }, options: { autocomplete: true }, searchable: true },
])(
  'uses flat autocomplete only when the local selector allows it',
  async ({ config, options, searchable }) => {
    await mountForm({
      schema: { type: 'string', title: 'Choice', enum: ['Alpha', 'Gamma'] },
      uischema: { type: 'Control', scope: '#', options },
      data: 'Alpha',
      config,
      renderers: flowbiteRenderers,
    });
    const trigger = page.getByRole('combobox', { name: 'Choice', exact: true });
    await expect.element(trigger).toBeVisible();
    if (trigger.element().tagName === 'INPUT') {
      expect(searchable).toBe(true);
    } else {
      await trigger.click();
      await vi.waitFor(() =>
        expect(Boolean(document.querySelector('input[placeholder="Search choices"]'))).toBe(
          searchable,
        ),
      );
    }
  },
);
