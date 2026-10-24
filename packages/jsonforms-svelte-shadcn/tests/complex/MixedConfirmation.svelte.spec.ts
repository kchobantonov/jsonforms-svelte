import '../test.css';
import { afterEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup } from 'vitest-browser-svelte';
import { shadcnRenderers } from '../../src/lib/renderers';
import { mountControl } from '../testUtils';
afterEach(cleanup);

const setup = async (options: Record<string, unknown> = {}) =>
  await mountControl({
    renderers: shadcnRenderers,
    propertySchema: { type: ['object', 'string'], properties: { name: { type: 'string' } } },
    value: { name: 'Keep' },
    options: { structuredLayout: 'nested', ...options },
  });
const clear = async (container: HTMLElement) => {
  container.querySelector<HTMLElement>('[id$="-input-selector"]')?.focus();
  await page.getByRole('button', { name: 'Clear type', exact: true }).click();
};

it('confirms a destructive type clear, retains data on cancel, and commits once', async () => {
  const { view, onchange } = await setup();
  await clear(view.container);
  await expect.element(page.getByRole('dialog')).toBeVisible();
  expect(onchange.mock.lastCall?.[0].data.value).toEqual({ name: 'Keep' });
  await page.getByRole('button', { name: 'No', exact: true }).click();
  expect(onchange.mock.lastCall?.[0].data.value).toEqual({ name: 'Keep' });
  await clear(view.container);
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect.poll(() => onchange.mock.lastCall?.[0].data.value).toBeUndefined();
});

it('honors the local never policy for populated values', async () => {
  const { view, onchange } = await setup({ confirmation: { typeChange: 'never' } });
  await clear(view.container);
  await expect.poll(() => onchange.mock.lastCall?.[0].data.value).toBeUndefined();
  await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});

it.each(['replacement', 'readonly'])(
  'rechecks %s before applying a pending type change',
  async (change) => {
    const { view, onchange } = await setup();
    await clear(view.container);
    await expect.element(page.getByRole('dialog')).toBeVisible();
    if (change === 'replacement') await view.rerender({ data: { value: { name: 'New value' } } });
    else await view.rerender({ readonly: true });
    await page.getByRole('button', { name: 'Yes', exact: true }).click();
    expect(onchange.mock.lastCall?.[0].data.value).toEqual({
      name: change === 'replacement' ? 'New value' : 'Keep',
    });
  },
);
