import '../../../jsonforms-svelte-shadcn/tests/test.css';
import { createCatalogTranslator } from '@chobantonov/jsonforms-svelte';
import { page } from 'vitest/browser';
import { afterEach, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { entry } from '../../src/lib/controls/CronControlRenderer.entry';
import { mountControl, waitForChange } from '../testUtils';

afterEach(cleanup);
const mount = async (value?: unknown, options: Record<string, unknown> = {}, schema = {}) =>
  await mountControl({
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
  const { view, onchange } = await mount('@daily');
  await open();
  await type(draft(), '0 0 0 * * *');
  findButton('Apply').click();
  await tick();
  expect(raw(view.container).value).toBe('@daily');
  expect(onchange.mock.calls.at(-1)?.[0].data.value).toBe('@daily');
});
it('stages picker changes until Apply and discards Cancel', async () => {
  const { view, onchange } = await mount('0 0 9 * * *');
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
  const { onchange } = await mount('0 0 9 * * *', { showActions: false });
  await open();
  const before = onchange.mock.calls.length;
  await type(draft(), '0 0 10 * * *');
  expect((await waitForChange(onchange, before)).data.value).toBe('0 0 10 * * *');
  expect(findButton('Apply')).toBeUndefined();
});
it('retains invalid imported text and emits document format errors', async () => {
  const { view, onchange } = await mount('0 9 * * *');
  expect(raw(view.container).value).toBe('0 9 * * *');
  await expect.poll(() => onchange.mock.calls.at(-1)?.[0].errors.length).toBeGreaterThan(0);
  await open();
  expect(draft().value).toBe('0 9 * * *');
  expect(findButton('Apply').disabled).toBe(true);
});
it('keeps advanced syntax available as text and clears to absence', async () => {
  const { view, onchange } = await mount('0 0 9 L * *');
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
  const { view } = await mount(undefined, { format: 'cron' }, { format: undefined });
  await open();
  expect(draft().value).toBe('');
  findButton('Apply').click();
  expect(raw(view.container).value).toBe('');
});
it('guards readonly text and picker paths', async () => {
  const { view } = await mount('0 0 9 * * *', {}, { readOnly: true });
  expect(raw(view.container).disabled).toBe(true);
  expect(findButton('Choose a schedule').disabled).toBe(true);
  expect(findButton('Clear value')).toBeUndefined();
});

it('starts with a period and pins lower time fields after selecting an hour', async () => {
  const { onchange } = await mount(undefined, { showActions: false });
  await open();
  expect(document.querySelector('[aria-label="Hour"]')).toBeNull();
  await page.getByRole('button', { name: 'Repeats', exact: true }).click();
  await page.getByRole('option', { name: 'Day', exact: true }).click();
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Hour', exact: true }).click();
  await page.getByRole('option', { name: '9', exact: true }).click();
  expect((await waitForChange(onchange, before)).data.value).toBe('0 0 9 * * *');
});

it('uses an icon-only picker trigger with a localized accessible name', async () => {
  const { view } = await mount('0 0 9 * * *');
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
  const { view, onchange } = await mount('0 0 9 * * *');
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
  const { view, onchange } = await mount('0 0 9 * * *');
  await open();
  const reset = findButton('Every: Hour');
  expect(reset.querySelector('svg')).not.toBeNull();
  expect(reset.getBoundingClientRect().width).toBeLessThanOrEqual(40);
  findButton('Hour').focus();
  await expect.poll(() => getComputedStyle(reset).visibility).toBe('visible');
  await page.elementLocator(reset).click();
  await expect.poll(() => draft().value).toBe('0 0 * * * *');
  expect(raw(view.container).value).toBe('0 0 9 * * *');
  const before = onchange.mock.calls.length;
  findButton('Apply').click();
  expect((await waitForChange(onchange, before)).data.value).toBe('0 0 * * * *');
});

it('centers the field reset, reserves summary space and reveals it only on hover or focus', async () => {
  const { view } = await mount('0 30 6 ? * MON-FRI');
  await open();
  const trigger = findButton('Day of week');
  const reset = findButton('Every: Day of week');
  const wrapper = reset.parentElement!;
  await page.elementLocator(findButton('Apply')).hover();
  (document.activeElement as HTMLElement)?.blur();
  await expect.poll(() => getComputedStyle(reset).visibility).toBe('hidden');
  await page.elementLocator(trigger).hover();
  await expect.poll(() => getComputedStyle(reset).visibility).toBe('visible');
  expect(getComputedStyle(trigger.querySelector('span')!).textAlign).toBe('start');
  const box = trigger.getBoundingClientRect();
  const clear = reset.getBoundingClientRect();
  expect(Math.abs(clear.top + clear.height / 2 - box.top - box.height / 2)).toBeLessThan(1);
  expect(trigger.querySelector('span')!.getBoundingClientRect().right).toBeLessThanOrEqual(
    clear.left,
  );
  await page.elementLocator(findButton('Apply')).hover();
  trigger.focus();
  await expect.poll(() => getComputedStyle(reset).visibility).toBe('visible');
  expect(wrapper.contains(reset)).toBe(true);
  expect(raw(view.container).value).toBe('0 30 6 ? * MON-FRI');
});

it('bounds long native choice lists and allows selecting the last minute', async () => {
  await mount('0 30 6 ? * MON-FRI');
  await open();
  await page.elementLocator(findButton('Minute')).click();
  const option = page.getByRole('option', { name: '59', exact: true });
  await option.click();
  await expect.poll(() => draft().value).toContain('30,59');
  const content = document.querySelector<HTMLElement>(
    '[data-slot="select-content"][data-state="open"]',
  )!;
  expect(content.getBoundingClientRect().height).toBeLessThanOrEqual(256);
  expect(
    content.scrollHeight > content.clientHeight ||
      [...content.querySelectorAll<HTMLElement>('*')].some(
        (element) =>
          element.scrollHeight > element.clientHeight &&
          getComputedStyle(element).overflowY === 'auto',
      ),
  ).toBe(true);
});
