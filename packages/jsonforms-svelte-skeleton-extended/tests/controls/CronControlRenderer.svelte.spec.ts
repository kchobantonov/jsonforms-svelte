import { page, userEvent } from 'vite-plus/test/browser';
import '../../../jsonforms-svelte-skeleton/tests/test.css';
import { createCatalogTranslator, createRendererAjv } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { entry } from '../../src/lib/controls/CronControlRenderer.entry';
import { stringControlRendererEntry as stringEntry } from '@chobantonov/jsonforms-svelte-skeleton';
import { mountControl, waitForChange } from '../testUtils';

afterEach(cleanup);
const mount = async (
  value?: unknown,
  options: Record<string, unknown> = {},
  schema = {},
  config?: Record<string, unknown>,
) =>
  await mountControl({
    renderers: [entry],
    propertySchema: { type: 'string', format: 'cron', ...schema },
    value,
    options,
    config,
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

it('returns keyboard focus to Choose after Escape closes the picker', async () => {
  await mount('@daily');
  const trigger = findButton('Choose a schedule');
  await open();
  const repeats = page.getByRole('combobox', { name: 'Repeats' }).element();
  repeats.focus();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => document.activeElement === trigger).toBe(true);
});

it('keeps required state on the editable Cron input when the asterisk is hidden', async () => {
  const { view } = await mountControl({
    renderers: [entry],
    propertySchema: { type: 'string', format: 'cron' },
    required: true,
    options: { hideRequiredAsterisk: true },
  });
  expect(raw(view.container).required).toBe(true);
});

it('associates visible help and local errors with text and picker trigger', async () => {
  const { view } = await mount(
    '@daily',
    { skeleton: { input: { 'aria-describedby': 'author-help' } } },
    { description: 'Schedule guidance' },
  );
  const input = raw(view.container);
  const trigger = findButton('Choose a schedule');
  expect(input.getAttribute('aria-describedby')?.split(' ')).toContain('author-help');
  input.focus();
  await tick();
  const help = view.container.querySelector<HTMLElement>('[id$="-help"]')!;
  expect(help.textContent).toContain('Schedule guidance');
  expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(help.id);
  expect(trigger.getAttribute('aria-describedby')?.split(' ')).toContain(help.id);

  await type(input, 'not a schedule');
  expect(help.textContent).not.toContain('Schedule guidance');
  expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(help.id);
  trigger.focus();
  await tick();
  expect(view.container.querySelector<HTMLElement>('[id$="-help"]')?.textContent).toBeTruthy();
  expect(trigger.getAttribute('aria-describedby')?.split(' ')).toContain(help.id);
});

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
it.each([
  { name: 'default', config: undefined, local: undefined, actions: true },
  { name: 'flat false', config: { showActions: false }, local: undefined, actions: false },
  { name: 'local false', config: { showActions: true }, local: false, actions: false },
  { name: 'local true', config: { showActions: false }, local: true, actions: true },
  {
    name: 'removed namespace',
    config: { jsonformsExtended: { showActions: false } },
    local: undefined,
    actions: true,
  },
])('applies $name showActions precedence', async ({ name, config, local, actions }) => {
  const { onchange } = await mount(
    '0 0 9 * * *',
    local === undefined ? {} : { showActions: local },
    {},
    config,
  );
  await open();
  expect(findButton('Apply') !== undefined).toBe(actions);
  if (name === 'flat false') {
    const before = onchange.mock.calls.length;
    await type(draft(), '0 0 10 * * *');
    expect((await waitForChange(onchange, before)).data.value).toBe('0 0 10 * * *');
  }
});
it('retains invalid imported text and emits document format errors', async () => {
  const { view, onchange } = await mount('0 9 * * *');
  expect(raw(view.container).value).toBe('0 9 * * *');
  await expect.poll(() => onchange.mock.calls.at(-1)?.[0].errors.length).toBeGreaterThan(0);
  await open();
  expect(draft().value).toBe('0 9 * * *');
  expect(findButton('Apply').disabled).toBe(true);
});
it('falls back to an editable string control when the cron renderer is absent', async () => {
  const { view, onchange } = await mountControl({
    renderers: [stringEntry],
    propertySchema: { type: 'string', format: 'cron' },
    value: '0 9 * * *',
  });
  const input = view.container.querySelector<HTMLInputElement>('input[type="text"]')!;
  expect(input.value).toBe('0 9 * * *');
  expect(findButton('Choose a schedule')).toBeUndefined();
  await expect
    .poll(() =>
      onchange.mock.lastCall?.[0].errors.some(
        (error: { keyword: string }) => error.keyword === 'format',
      ),
    )
    .toBe(true);
  const before = onchange.mock.calls.length;
  await type(input, '0 0 9 * * *');
  expect((await waitForChange(onchange, before)).data.value).toBe('0 0 9 * * *');
});
it('shows local cron feedback when the host validator does not check formats', async () => {
  const ajv = createRendererAjv({ validateFormats: false });
  const { view, onchange } = await mountControl({
    renderers: [entry],
    propertySchema: { type: 'string', format: 'cron' },
    value: '0 9 * * *',
    ajv,
  });
  expect(raw(view.container).value).toBe('0 9 * * *');
  await expect.poll(() => onchange.mock.lastCall?.[0].errors).toEqual([]);
  expect(raw(view.container).getAttribute('aria-invalid')).toBe('true');
  expect(view.container.querySelector('[id$="-help"]')?.textContent).toBeTruthy();
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
  const period = document.querySelector<HTMLSelectElement>('select[aria-label="Repeats"]')!;
  period.value = 'day';
  period.dispatchEvent(new Event('change', { bubbles: true }));
  await tick();
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
  const fieldBounds = raw(view.container).getBoundingClientRect();
  const triggerBounds = trigger.getBoundingClientRect();
  expect(triggerBounds.left).toBeGreaterThanOrEqual(fieldBounds.left);
  expect(triggerBounds.right).toBeLessThanOrEqual(fieldBounds.right);
  expect(triggerBounds.top).toBeGreaterThanOrEqual(fieldBounds.top);
  expect(triggerBounds.bottom).toBeLessThanOrEqual(fieldBounds.bottom);
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
  reset.focus();
  await expect
    .poll(() =>
      [...document.querySelectorAll<HTMLElement>('[role="tooltip"]')].some(
        (hint) =>
          hint.textContent?.trim() === 'Every: Hour' && hint.getBoundingClientRect().width > 0,
      ),
    )
    .toBe(true);
  reset.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await expect
    .poll(() =>
      [...document.querySelectorAll<HTMLElement>('[role="tooltip"]')].some(
        (hint) =>
          hint.textContent?.trim() === 'Every: Hour' && hint.getBoundingClientRect().width > 0,
      ),
    )
    .toBe(false);
  expect(document.activeElement).toBe(reset);
  expect(draft()).toBeTruthy();
  expect(raw(view.container).value).toBe('0 0 9 * * *');
  await page.elementLocator(reset).click();
  await expect.poll(() => draft().value).toBe('0 0 * * * *');
  expect(raw(view.container).value).toBe('0 0 9 * * *');
  const before = onchange.mock.calls.length;
  findButton('Apply').click();
  expect((await waitForChange(onchange, before)).data.value).toBe('0 0 * * * *');
});
