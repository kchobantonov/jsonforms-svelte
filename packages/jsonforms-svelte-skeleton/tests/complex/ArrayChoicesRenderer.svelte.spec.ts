import '../test.css';
import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry } from '../../src/lib/complex/ArrayChoicesRenderer.entry';
import { mountControl, mountForm, waitForChange } from '../testUtils';

afterEach(cleanup);
const schema = { type: 'array', items: { type: 'string' } } as const;
const chips = async (value: unknown, extra = {}, options = {}) =>
  await mountControl({
    renderers: [entry],
    propertySchema: { ...schema, ...extra },
    value,
    options: { variant: 'chips', ...options },
  });
function input(container: HTMLElement, value: string) {
  const field = container.querySelector('input')!;
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  return field;
}

it('adds exact case-sensitive values and removes a particular repeated occurrence', async () => {
  const { view, onchange } = await chips(['A', 'B', 'A']);
  const removes = view.container.querySelectorAll<HTMLButtonElement>(
    'button[aria-label="Remove A"]',
  );
  const before = onchange.mock.calls.length;
  removes[0].click();
  expect((await waitForChange(onchange, before)).data.value).toEqual(['B', 'A']);
  const next = onchange.mock.calls.length;
  input(view.container, 'a').dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
  );
  expect((await waitForChange(onchange, next)).data.value).toEqual(['B', 'A', 'a']);
});

it('rejects duplicate and out-of-domain additions without clearing the draft', async () => {
  const { view, onchange } = await chips(['A'], {
    uniqueItems: true,
    items: { type: 'string', enum: ['A', 'B'] },
  });
  const field = input(view.container, 'C');
  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await expect.poll(() => field.value).toBe('C');
  input(view.container, 'A').dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
  );
  expect(field.value).toBe('A');
  const before = onchange.mock.calls.length;
  input(view.container, 'B').dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
  );
  expect((await waitForChange(onchange, before)).data.value).toEqual(['A', 'B']);
});

it('honors limits and permits validation-only restrictions', async () => {
  const { view } = await chips(['A'], { minItems: 1, maxItems: 1 });
  expect(view.container.querySelector<HTMLInputElement>('input')!.disabled).toBe(true);
  expect(
    view.container.querySelector<HTMLButtonElement>('button[aria-label="Remove A"]')!.disabled,
  ).toBe(true);
  await cleanup();
  const allowed = await chips(['A'], { minItems: 1, maxItems: 1 }, { restrict: false });
  const before = allowed.onchange.mock.calls.length;
  input(allowed.view.container, 'B').dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
  );
  const event = await waitForChange(allowed.onchange, before);
  expect(event.data.value).toEqual(['A', 'B']);
  expect(event.errors.length).toBeGreaterThan(0);
});

it('shows an imported invalid member at its pill and field, then clears it on removal', async () => {
  const { view, onchange } = await mountForm({
    renderers: [entry],
    schema: {
      type: 'object',
      properties: {
        imported: {
          type: 'array',
          uniqueItems: true,
          items: { type: 'string', enum: ['Email', 'SMS'] },
        },
      },
    },
    uischema: {
      type: 'Control',
      scope: '#/properties/imported',
      options: { variant: 'multi-select' },
    },
    data: { imported: ['Email', 'Fax'] },
    i18n: { locale: 'en', translateError: () => 'Value is not offered' },
  });
  await expect
    .poll(() => view.container.querySelector('[role="alert"]')?.textContent)
    .toContain('Fax: Value is not offered');
  const invalidPill = view.container.querySelector<HTMLElement>('span[aria-invalid="true"]')!;
  expect(invalidPill.textContent).toContain('Fax');
  const fieldLabel = view.container.querySelector('label')!;
  const invalidLabelColor = getComputedStyle(fieldLabel).color;
  expect(invalidLabelColor).not.toBe(
    getComputedStyle(view.container.querySelector('[role="alert"]')!).color,
  );
  const before = onchange.mock.calls.length;
  view.container.querySelector<HTMLButtonElement>('button[aria-label="Remove Fax"]')!.click();
  expect(((await waitForChange(onchange, before)).data as { imported?: unknown }).imported).toEqual(
    ['Email'],
  );
  await expect.poll(() => view.container.querySelector('[role="alert"]')).toBeNull();
  expect(getComputedStyle(fieldLabel).color).toBe(invalidLabelColor);
});

it('preserves typed imported values and removes only the chosen one', async () => {
  const { view, onchange } = await chips([1, '1', { code: 'x' }]);
  const buttons = view.container.querySelectorAll<HTMLButtonElement>(
    'button[aria-label="Remove 1"]',
  );
  expect(buttons).toHaveLength(2);
  const before = onchange.mock.calls.length;
  buttons[1].click();
  expect((await waitForChange(onchange, before)).data.value).toEqual([1, { code: 'x' }]);
});

it('does not add during IME composition and removes the last token on empty Backspace', async () => {
  const { view, onchange } = await chips(['A', 'B']);
  const field = input(view.container, 'C');
  field.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }),
  );
  expect(field.value).toBe('C');
  const before = onchange.mock.calls.length;
  input(view.container, '').dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }),
  );
  expect((await waitForChange(onchange, before)).data.value).toEqual(['A']);
});

it('uses host translations for action labels', async () => {
  const { view } = await mountForm({
    renderers: [entry],
    schema: { type: 'object', properties: { value: schema } },
    uischema: { type: 'Control', scope: '#/properties/value', options: { variant: 'chips' } },
    data: { value: ['A'] },
    i18n: {
      locale: 'fr',
      translate: (key, fallback) =>
        key === 'arrayChoices.remove' ? 'Retirer {label}' : (fallback ?? ''),
    },
  });
  expect(view.container.querySelector('button[aria-label="Retirer A"]')).not.toBeNull();
});

it('keeps readonly controls immutable', async () => {
  const { view } = await chips(['A'], { readOnly: true });
  expect(view.container.querySelector<HTMLInputElement>('input')!.disabled).toBe(true);
  expect(
    view.container.querySelector<HTMLButtonElement>('button[aria-label="Remove A"]')!.disabled,
  ).toBe(true);
});

it('uses Bulgarian catalog labels without a host translator', async () => {
  const { view } = await mountForm({
    renderers: [entry],
    schema: { type: 'object', properties: { value: schema } },
    uischema: { type: 'Control', scope: '#/properties/value', options: { variant: 'chips' } },
    data: { value: ['A'] },
    i18n: { locale: 'bg' },
  });
  expect(view.container.querySelector('button[aria-label="Премахване на A"]')).not.toBeNull();
});

it('opens native multiple Combobox and preserves imported values when adding', async () => {
  const { view, onchange } = await mountControl({
    renderers: [entry],
    propertySchema: { ...schema, uniqueItems: true, items: { type: 'string', enum: ['A', 'B'] } },
    value: ['Fax'],
    options: { variant: 'multi-select' },
  });
  expect(view.container.querySelector('button[aria-label="Remove Fax"]')).not.toBeNull();
  view.container
    .querySelector<HTMLInputElement>('[data-scope="combobox"][data-part="input"]')!
    .click();
  await expect.poll(() => document.querySelectorAll('[role="option"]').length).toBe(3);
  const before = onchange.mock.calls.length;
  document.querySelector<HTMLElement>('[role="option"]')!.click();
  expect((await waitForChange(onchange, before)).data.value).toEqual(['Fax', 'A']);
});
it('uses native TagsInput for unique free strings and preserves case', async () => {
  const { view, onchange } = await chips(['A'], { uniqueItems: true });
  expect(view.container.querySelector('[data-scope="tags-input"]')).not.toBeNull();
  const before = onchange.mock.calls.length;
  view.container.querySelector<HTMLInputElement>('input')!.focus();
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  const field = input(view.container, 'a');
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  expect((await waitForChange(onchange, before)).data.value).toEqual(['A', 'a']);
});

it('keeps rejected native-tag drafts and preserves whitespace in accepted values', async () => {
  const { view, onchange } = await chips(['A'], { uniqueItems: true });
  view.container.querySelector<HTMLInputElement>('input')!.focus();
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  const field = input(view.container, 'A');
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await expect.poll(() => field.value).toBe('A');
  const before = onchange.mock.calls.length;
  input(view.container, ' A ');
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  expect((await waitForChange(onchange, before)).data.value).toEqual(['A', ' A ']);
});

it('bounds a long finite multi-select popup and keeps its final choice reachable', async () => {
  const choices = Array.from({ length: 100 }, (_, index) => `Option ${index}`);
  const { view } = await mountControl({
    renderers: [entry],
    propertySchema: { ...schema, uniqueItems: true, items: { type: 'string', enum: choices } },
    value: [],
    options: { variant: 'multi-select' },
  });
  view.container
    .querySelector<HTMLButtonElement>('[data-scope="combobox"][data-part="trigger"]')!
    .click();
  await expect.poll(() => document.querySelectorAll('[role="option"]').length).toBe(100);
  const popup = document.querySelector<HTMLElement>(
    '[data-scope="combobox"][data-part="content"]',
  )!;
  expect(popup.clientHeight).toBeLessThanOrEqual(320);
  expect(popup.scrollHeight).toBeGreaterThan(popup.clientHeight);
  const last = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).at(-1)!;
  last.scrollIntoView({ block: 'end' });
  await expect.poll(() => popup.scrollTop).toBeGreaterThan(0);
  expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    popup.getBoundingClientRect().bottom,
  );
});
