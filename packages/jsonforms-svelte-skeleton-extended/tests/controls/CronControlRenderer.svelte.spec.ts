import { afterEach, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { entry } from '../../src/lib/controls/CronControlRenderer.entry';
import { mountControl, waitForChange } from '../testUtils';

afterEach(cleanup);
const mount = (value?: unknown, options: Record<string, unknown> = {}, schema = {}) =>
  mountControl({
    renderers: [entry],
    propertySchema: { type: 'string', format: 'cron', ...schema },
    value,
    options,
  });
const findButton = (name: string) =>
  [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.getAttribute('aria-label') === name || button.textContent?.trim() === name,
  )!;
const raw = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
const draft = () => document.querySelector<HTMLInputElement>('input[aria-label="Expression"]')!;
async function type(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await tick();
}
async function open() {
  findButton('Choose a schedule').click();
  await expect.poll(() => draft()).not.toBeNull();
}

it('preserves alias spelling when accepting without a semantic edit', async () => {
  const { view, onchange } = mount('@daily');
  await open();
  await type(draft(), '0 0 0 * * *');
  findButton('Apply').click();
  await tick();
  expect(raw(view.container).value).toBe('@daily');
  expect(onchange.mock.calls.at(-1)?.[0].data.value).toBe('@daily');
});
it('stages picker changes until Apply and discards Cancel', async () => {
  const { view, onchange } = mount('0 0 9 * * *');
  await open();
  await type(draft(), '0 0 10 * * *');
  expect(raw(view.container).value).toBe('0 0 9 * * *');
  findButton('Cancel').click();
  await tick();
  expect(raw(view.container).value).toBe('0 0 9 * * *');
  await open();
  await type(draft(), '0 0 11 * * *');
  const before = onchange.mock.calls.length;
  findButton('Apply').click();
  expect((await waitForChange(onchange, before)).data.value).toBe('0 0 11 * * *');
});
it('commits immediately only when showActions is false', async () => {
  const { onchange } = mount('0 0 9 * * *', { showActions: false });
  await open();
  const before = onchange.mock.calls.length;
  await type(draft(), '0 0 10 * * *');
  expect((await waitForChange(onchange, before)).data.value).toBe('0 0 10 * * *');
  expect(findButton('Apply')).toBeUndefined();
});
it('retains invalid imported text and emits document format errors', async () => {
  const { view, onchange } = mount('0 9 * * *');
  expect(raw(view.container).value).toBe('0 9 * * *');
  await expect.poll(() => onchange.mock.calls.at(-1)?.[0].errors.length).toBeGreaterThan(0);
  await open();
  expect(draft().value).toBe('0 9 * * *');
  expect(findButton('Apply').disabled).toBe(true);
});
it('keeps advanced syntax available as text and clears to absence', async () => {
  const { view, onchange } = mount('0 0 9 L * *');
  await open();
  expect(document.querySelector<HTMLInputElement>('input[aria-label="Day of month"]')?.value).toBe(
    'L',
  );
  findButton('Cancel').click();
  await tick();
  const before = onchange.mock.calls.length;
  findButton('Clear value').click();
  expect((await waitForChange(onchange, before)).data.value).toBeUndefined();
  expect(raw(view.container).value).toBe('');
});
it('does not seed an absent value and supports UI-only selection', async () => {
  const { view } = mount(undefined, { format: 'cron' }, { format: undefined });
  await open();
  expect(draft().value).toBe('');
  findButton('Apply').click();
  expect(raw(view.container).value).toBe('');
});
it('guards readonly text and picker paths', () => {
  const { view } = mount('0 0 9 * * *', {}, { readOnly: true });
  expect(raw(view.container).disabled).toBe(true);
  expect(findButton('Choose a schedule').disabled).toBe(true);
  expect(findButton('Clear value').disabled).toBe(true);
});

it('starts with a period and pins lower time fields after selecting an hour', async () => {
  const { onchange } = mount(undefined, { showActions: false });
  await open();
  expect(document.querySelector('[aria-label="Hour"]')).toBeNull();
  const period = document.querySelector<HTMLSelectElement>('select[aria-label="Repeats"]')!;
  period.value = 'day';
  period.dispatchEvent(new Event('change', { bubbles: true }));
  await tick();
  const before = onchange.mock.calls.length;
  const hour = document.querySelector<HTMLSelectElement>('select[aria-label="Hour"]')!;
  hour.value = '9';
  hour.dispatchEvent(new Event('change', { bubbles: true }));
  expect((await waitForChange(onchange, before)).data.value).toBe('0 0 9 * * *');
});
