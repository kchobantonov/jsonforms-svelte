import '../../../jsonforms-svelte-flowbite/tests/test.css';
import { createCatalogTranslator } from '@chobantonov/jsonforms-svelte';
import { page } from 'vitest/browser';
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
  findButton('Choose a schedule').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
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
  expect(findButton('Clear value')).toBeUndefined();
});

it('starts with a period and pins lower time fields after selecting an hour', async () => {
  const { onchange } = mount(undefined, { showActions: false });
  await open();
  expect(document.querySelector('[aria-label="Hour"]')).toBeNull();
  const period = document.querySelector<HTMLSelectElement>('select[aria-label="Repeats"]')!;
  expect(period.querySelectorAll('option[value=""]')).toHaveLength(1);
  expect(period.textContent).not.toContain('Choose option ...');
  period.value = 'day';
  period.dispatchEvent(new Event('change', { bubbles: true }));
  await tick();
  const before = onchange.mock.calls.length;
  const hour = document.querySelector<HTMLElement>('[role="listbox"][aria-label="Hour"]')!;
  hour.click();
  await tick();
  [...hour.querySelectorAll<HTMLElement>('[role="presentation"]')]
    .find((element) => element.textContent === '9')!
    .click();
  expect((await waitForChange(onchange, before)).data.value).toBe('0 0 9 * * *');
});

it.each([1, 2, 3])(
  'applies a draft through repeated native pointer and focus events (%s)',
  async () => {
    const { view } = mount('0 0/15 * * * *');
    await page.getByRole('button', { name: 'Choose a schedule', exact: true }).click();
    await page.getByRole('textbox', { name: 'Expression', exact: true }).fill('0 0 10 * * *');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Choose a schedule', exact: true }).click();
    await page.getByRole('textbox', { name: 'Expression', exact: true }).fill('0 0 11 * * *');
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect.poll(() => raw(view.container).value).toBe('0 0 11 * * *');
  },
);

it('uses an icon-only picker trigger with a localized accessible name', async () => {
  const { view } = mount('0 0 9 * * *');
  const trigger = findButton('Choose a schedule');
  expect(trigger.textContent?.trim()).toBe('');
  expect(trigger.querySelector('svg')).not.toBeNull();
  expect(trigger.title).toBe('Choose a schedule');
  await view.rerender({
    i18n: {
      locale: 'fr',
      translate: createCatalogTranslator('fr', { fr: { 'cron.choose': 'Choisir un horaire' } }),
    },
  });
  expect(trigger.getAttribute('aria-label')).toBe('Choisir un horaire');
  expect(trigger.title).toBe('Choisir un horaire');
});

it('shows its in-input clear action only for a value while hovered or focused', async () => {
  const { view, onchange } = mount('0 0 9 * * *');
  const input = raw(view.container);
  const clear = findButton('Clear value');
  view.container.style.padding = '40px';
  view.container.classList.add('group');
  await page.elementLocator(view.container).hover({ position: { x: 1, y: 1 } });
  input.blur();
  await expect.poll(() => getComputedStyle(clear).visibility).toBe('hidden');
  input.focus();
  await expect.poll(() => getComputedStyle(clear).visibility).toBe('visible');
  const fieldBox = input.getBoundingClientRect();
  const clearBox = clear.getBoundingClientRect();
  expect(clearBox.left).toBeGreaterThanOrEqual(fieldBox.left);
  expect(clearBox.right).toBeLessThanOrEqual(fieldBox.right);
  expect(clearBox.top).toBeGreaterThanOrEqual(fieldBox.top);
  expect(clearBox.bottom).toBeLessThanOrEqual(fieldBox.bottom);
  clear.focus();
  await expect.poll(() => getComputedStyle(clear).visibility).toBe('visible');
  clear.blur();
  await expect.poll(() => getComputedStyle(clear).visibility).toBe('hidden');
  await page.elementLocator(input).hover();
  await expect.poll(() => getComputedStyle(clear).visibility).toBe('visible');
  await page.getByRole('button', { name: 'Clear value', exact: true }).click();
  await expect.poll(() => onchange.mock.lastCall?.[0].data.value).toBeUndefined();
  expect(findButton('Clear value')).toBeUndefined();
  await view.rerender({ data: { value: '' } });
  expect(findButton('Clear value')).toBeUndefined();
});

it('resets a field through an inline icon without committing before Apply', async () => {
  const { view, onchange } = mount('0 0 9 * * *');
  await open();
  const reset = findButton('Every: Hour');
  expect(reset.querySelector('svg')).not.toBeNull();
  expect(reset.getBoundingClientRect().width).toBeLessThanOrEqual(40);
  await page.elementLocator(reset).click();
  await expect.poll(() => draft().value).toBe('0 0 * * * *');
  expect(raw(view.container).value).toBe('0 0 9 * * *');
  const before = onchange.mock.calls.length;
  findButton('Apply').click();
  expect((await waitForChange(onchange, before)).data.value).toBe('0 0 * * * *');
});
