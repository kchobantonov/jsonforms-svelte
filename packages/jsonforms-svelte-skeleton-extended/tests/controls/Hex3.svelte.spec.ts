import { afterEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup } from 'vitest-browser-svelte';
import { mountControl, waitForChange } from '../testUtils';
import { colorControlRendererEntry } from '../../src/lib/controls';
afterEach(cleanup);
it('rounds picker output to hex3 and previews the saved color', async () => {
  const { view, onchange } = await mountControl({
    renderers: [colorControlRendererEntry],
    propertySchema: { type: 'string', format: 'color', pattern: '^#[0-9a-fA-F]{3}$' },
    value: '#fff',
    options: { colorSaveFormat: 'hex3' },
  });
  await page
    .elementLocator(view.container.querySelector<HTMLElement>('[data-color-trigger]')!)
    .click();
  const picker = document.querySelector<HTMLInputElement>(
    '[data-color-spectrum] input[type=range]',
  )!;
  const before = onchange.mock.calls.length;
  picker.value = '0';
  const area = page.getByRole('slider', { name: 'Saturation and brightness' });
  await area.click();
  picker.dispatchEvent(new Event('input', { bubbles: true }));
  picker.dispatchEvent(new Event('blur'));
  const event = await waitForChange(onchange, before);
  expect(event.data.value).toMatch(/^#[0-9a-f]{3}$/);
  await view.rerender({ data: event.data });
  expect(document.querySelector('input[type=color]')).toBeNull();
});
it('preserves incoming transparency and prevents the RGB picker from discarding it in hex3 mode', async () => {
  const { view, onchange } = await mountControl({
    renderers: [colorControlRendererEntry],
    propertySchema: { type: 'string', format: 'color' },
    value: '#ff000080',
    options: { colorSaveFormat: 'hex3' },
  });
  expect(view.container.querySelector<HTMLInputElement>('input[type=text]')!.value).toBe(
    '#ff000080',
  );
  await page
    .elementLocator(view.container.querySelector<HTMLElement>('[data-color-trigger]')!)
    .click();
  const picker = document.querySelector<HTMLInputElement>(
    '[data-color-spectrum] input[type=range]',
  )!;
  picker.value = '120';
  picker.dispatchEvent(new Event('input', { bubbles: true }));
  picker.dispatchEvent(new Event('blur'));
  expect(onchange.mock.calls.every(([event]) => event.data.value === '#ff000080')).toBe(true);
});

it('converts complete opaque typed colors and retains transparent drafts without committing them', async () => {
  const { view, onchange } = await mountControl({
    renderers: [colorControlRendererEntry],
    propertySchema: { type: 'string', format: 'color' },
    value: '#fff',
    options: { colorSaveFormat: 'hex3' },
  });
  const text = view.container.querySelector<HTMLInputElement>('input[type=text]')!;
  const before = onchange.mock.calls.length;
  text.value = '#ed5050';
  text.dispatchEvent(new Event('input', { bubbles: true }));
  const event = await waitForChange(onchange, before);
  expect(event.data.value).toMatch(/^#[0-9a-f]{3}$/);
  await view.rerender({ data: event.data });
  text.value = '#ff000080';
  text.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 200));
  expect(onchange.mock.lastCall?.[0].data.value).toBe('#e55');
  expect(view.container.textContent).toContain('cannot represent transparency');
});
