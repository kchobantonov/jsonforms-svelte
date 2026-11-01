import '../test.css';
import { afterEach, expect, it } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { cleanup } from 'vitest-browser-svelte';
import { shadcnRenderers } from '../../src/lib/renderers';
import { mountForm } from '../testUtils';

afterEach(cleanup);

it('reveals a composite error on hover and through the keyboard', async () => {
  await mountForm({
    renderers: shadcnRenderers,
    schema: { type: ['object', 'null'], properties: { name: { type: 'string', minLength: 9 } } },
    uischema: { type: 'Control', scope: '#', options: { structuredLayout: 'tree' } },
    data: { name: 'short' },
    config: { jsonformsExtended: { showValidationIndicator: true } },
  });
  const trigger = page.getByRole('button', { name: 'Validation errors' }).first();
  const summary = page.getByText('1 error in this section').first();
  await trigger.hover();
  await expect.element(summary).toBeVisible();
  await trigger.click();
  await expect.element(summary).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => document.querySelector('[data-popover-content]')).toBeNull();
  trigger.element().focus();
  await userEvent.keyboard('{Enter}');
  await expect.element(summary).toBeVisible();
});
