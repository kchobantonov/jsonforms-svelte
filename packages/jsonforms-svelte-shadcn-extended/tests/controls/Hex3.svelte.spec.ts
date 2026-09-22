import { afterEach, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { mountControl, waitForChange } from '../testUtils';
import { colorControlRendererEntry } from '../../src/lib/controls';
afterEach(cleanup);
it('rounds picker output to hex3 and previews the saved color', async () => {
  const { view, onchange } = mountControl({
    renderers: [colorControlRendererEntry],
    propertySchema: { type: 'string', format: 'color', pattern: '^#[0-9a-fA-F]{3}$' },
    value: '#fff',
    options: { colorSaveFormat: 'hex3' },
  });
  const picker = view.container.querySelector<HTMLInputElement>('input[type=color]')!;
  const before = onchange.mock.calls.length;
  picker.value = '#ed5050';
  picker.dispatchEvent(new Event('input', { bubbles: true }));
  picker.dispatchEvent(new Event('blur'));
  const event = await waitForChange(onchange, before);
  expect(event.data.value).toBe('#e55');
  await view.rerender({ data: event.data });
  expect(view.container.querySelector<HTMLInputElement>('input[type=color]')!.value).toBe(
    '#ee5555',
  );
});
it('preserves incoming transparency and prevents the RGB picker from discarding it in hex3 mode', () => {
  const { view, onchange } = mountControl({
    renderers: [colorControlRendererEntry],
    propertySchema: { type: 'string', format: 'color' },
    value: '#ff000080',
    options: { colorSaveFormat: 'hex3' },
  });
  expect(view.container.querySelector<HTMLInputElement>('input[type=text]')!.value).toBe(
    '#ff000080',
  );
  expect(view.container.querySelector<HTMLInputElement>('input[type=color]')!.disabled).toBe(true);
  expect(onchange.mock.calls.every(([event]) => event.data.value === '#ff000080')).toBe(true);
});

it('converts complete opaque typed colors and retains transparent drafts without committing them', async () => {
  const { view, onchange } = mountControl({
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
  expect(event.data.value).toBe('#e55');
  await view.rerender({ data: event.data });
  text.value = '#ff000080';
  text.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 200));
  expect(onchange.mock.lastCall?.[0].data.value).toBe('#e55');
  expect(view.container.textContent).toContain('cannot represent transparency');
});
