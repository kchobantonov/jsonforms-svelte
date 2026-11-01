import '../test.css';
import { afterEach, expect, it } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { cleanup } from 'vitest-browser-svelte';
import { skeletonRenderers } from '../../src/lib/renderers';
import { mountForm } from '../testUtils';

afterEach(cleanup);

it('reveals a composite error on hover and through the keyboard', async () => {
  await mountForm({
    renderers: skeletonRenderers,
    schema: { type: ['object', 'null'], properties: { name: { type: 'string', minLength: 9 } } },
    uischema: { type: 'Control', scope: '#', options: { structuredLayout: 'tree' } },
    data: { name: 'short' },
    config: { jsonformsExtended: { showValidationIndicator: true } },
  });
  const trigger = page.getByRole('button', { name: 'Validation errors' }).first();
  await trigger.hover();
  await expect.element(page.getByRole('dialog').first()).toBeVisible();
  expect(page.getByRole('dialog').first().element().textContent).toContain(
    'must NOT have fewer than 9 characters',
  );
  await trigger.click();
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  trigger.element().focus();
  await userEvent.keyboard('{Enter}');
  await expect.element(page.getByRole('dialog').first()).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
});
