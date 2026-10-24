import '../test.css';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import RowDetailToggle from '../../src/lib/components/RowDetailToggle.svelte';

afterEach(cleanup);

it('uses one icon button and a live translated native tooltip for panel visibility', async () => {
  const onclick = vi.fn();
  const view = await render(RowDetailToggle, {
    props: { label: 'Show details', open: false, disabled: false, onclick },
  });
  const button = page.getByRole('button', { name: 'Show details', exact: true });
  const element = button.element();
  expect(view.container.querySelectorAll('button')).toHaveLength(1);
  expect(element.textContent?.trim()).toBe('');
  expect(element.querySelector('svg')).not.toBeNull();
  expect(element.getAttribute('aria-expanded')).toBe('false');
  await button.hover();
  await expect
    .poll(() => document.querySelector('[data-tooltip-content]')?.textContent?.trim())
    .toBe('Show details');
  await view.rerender({ label: 'Скриване на подробностите', open: true });
  expect(element.getAttribute('aria-label')).toBe('Скриване на подробностите');
  expect(element.getAttribute('aria-expanded')).toBe('true');
  await expect
    .poll(() => document.querySelector('[data-tooltip-content]')?.textContent?.trim())
    .toBe('Скриване на подробностите');
  await page.getByRole('button', { name: 'Скриване на подробностите', exact: true }).click();
  expect(onclick).toHaveBeenCalledTimes(1);
});
