import '../test.css';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { cleanup } from 'vitest-browser-svelte';
import { entry } from '../../src/lib/complex/ArrayChoicesRenderer.entry';
import { flowbiteRenderers } from '../../src/lib/renderers';
import { mountControl, mountForm, waitForChange } from '../testUtils';

afterEach(cleanup);
it('does not count a disabled chip input as an active focus request', async () => {
  const ondiagnostic = vi.fn();
  const { view } = await mountForm({
    renderers: flowbiteRenderers,
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        tags: { type: 'array', maxItems: 1, items: { type: 'string' } },
      },
    },
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/name', options: { focus: true } },
        { type: 'Control', scope: '#/properties/tags', options: { variant: 'chips', focus: true } },
      ],
    },
    data: { name: 'Ada', tags: ['A'] },
    ondiagnostic,
  });
  const chipInput = view.container.querySelector<HTMLInputElement>(
    '[id="#/properties/tags-input"]',
  )!;
  expect(chipInput.disabled).toBe(true);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  expect(
    ondiagnostic.mock.calls.filter(([diagnostic]) => diagnostic.code === 'focus.conflict'),
  ).toHaveLength(0);
  expect(document.activeElement).toBe(
    view.container.querySelector('[id="#/properties/name-input"]'),
  );
});
it.each([
  { variant: 'chips', uniqueItems: false },
  { variant: 'chips', uniqueItems: true },
  { variant: 'multi-select', uniqueItems: true },
] as const)(
  'focuses the primary $variant choice control on mount when requested (unique: $uniqueItems)',
  async ({ variant, uniqueItems }) => {
    const { view } = await mountControl({
      renderers: [entry],
      propertySchema: {
        type: 'array',
        uniqueItems,
        items:
          variant === 'multi-select' ? { type: 'string', enum: ['A', 'B'] } : { type: 'string' },
      },
      value: [],
      options: { variant, focus: true },
    });
    const target =
      variant === 'multi-select'
        ? view.container.querySelector<HTMLElement>('[role="listbox"]')
        : [...view.container.querySelectorAll<HTMLElement>('[id]')].find(
            (node) => node.id === '#/properties/value-input',
          );
    expect(target).not.toBeUndefined();
    await expect.poll(() => document.activeElement).toBe(target);
  },
);
it('exposes required state when the visual array-choice asterisk is hidden', async () => {
  const options = { hideRequiredAsterisk: true };
  const chipsView = await mountControl({
    renderers: [entry],
    propertySchema: { type: 'array', description: 'Choose tags', items: { type: 'string' } },
    value: ['A'],
    required: true,
    options: { ...options, variant: 'chips' },
  });
  expect(chipsView.view.container.querySelector('label')?.textContent).not.toContain('*');
  expect(
    chipsView.view.container.querySelector('[id$="-input"]')?.getAttribute('aria-required'),
  ).toBe('true');
  const chipInput = chipsView.view.container.querySelector<HTMLInputElement>('[id$="-input"]')!;
  chipInput.focus();
  await expect.poll(() => chipInput.getAttribute('aria-describedby')).toContain('-help');
  expect(chipsView.view.container.querySelector('[id$="-help"]')?.textContent).toContain(
    'Choose tags',
  );
  await cleanup();
  const multiView = await mountControl({
    renderers: [entry],
    propertySchema: { type: 'array', uniqueItems: true, items: { type: 'string', enum: ['A'] } },
    value: ['A'],
    required: true,
    options: { ...options, variant: 'multi-select' },
  });
  expect(multiView.view.container.querySelector('label')?.textContent).not.toContain('*');
  expect(
    multiView.view.container.querySelector('[role="listbox"]')?.getAttribute('aria-required'),
  ).toBe('true');
});
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
  expect(
    view.container.querySelector('[role="listbox"]')?.getAttribute('aria-describedby'),
  ).toContain('-help');
  const invalidPill = view.container.querySelector<HTMLElement>('span[aria-invalid="true"]')!;
  expect(invalidPill.textContent).toContain('Fax');
  expect(invalidPill.classList.contains('border-red-500')).toBe(true);
  expect(invalidPill.classList.contains('border-transparent')).toBe(false);
  const pillStyle = getComputedStyle(invalidPill);
  for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
    expect(pillStyle[`border${side}Width`]).toBe('1px');
    expect(pillStyle[`border${side}Color`]).not.toBe('rgba(0, 0, 0, 0)');
  }
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

it('opens native multi-select and preserves imported values when adding', async () => {
  const { view, onchange } = await mountControl({
    renderers: [entry],
    propertySchema: { ...schema, uniqueItems: true, items: { type: 'string', enum: ['A', 'B'] } },
    value: ['Fax'],
    options: { variant: 'multi-select' },
  });
  expect(view.container.querySelector('button[aria-label="Remove Fax"]')).not.toBeNull();
  view.container.querySelector<HTMLElement>('[role="listbox"]')!.click();
  await expect
    .poll(
      () => view.container.querySelectorAll('[role="presentation"] > [role="presentation"]').length,
    )
    .toBe(3);
  const before = onchange.mock.calls.length;
  view.container
    .querySelector<HTMLElement>('[role="presentation"] > [role="presentation"]')!
    .click();
  expect((await waitForChange(onchange, before)).data.value).toEqual(['Fax', 'A']);
});

it('keeps explicit autocomplete false non-searchable while allowing finite selection', async () => {
  const { view, onchange } = await mountControl({
    renderers: [entry],
    propertySchema: { ...schema, uniqueItems: true, items: { type: 'string', enum: ['A', 'B'] } },
    value: [],
    options: { variant: 'multi-select', autocomplete: false },
    config: { autocomplete: true },
  });
  expect(view.container.querySelector('input[aria-label="Search choices"]')).toBeNull();
  view.container.querySelector<HTMLElement>('[role="listbox"]')!.click();
  await expect
    .poll(
      () => view.container.querySelectorAll('[role="presentation"] > [role="presentation"]').length,
    )
    .toBe(2);
  const before = onchange.mock.calls.length;
  view.container
    .querySelector<HTMLElement>('[role="presentation"] > [role="presentation"]')!
    .click();
  expect((await waitForChange(onchange, before)).data.value).toEqual(['A']);
});

it('keeps the last finite multi-select option reachable in a long list', async () => {
  const choices = Array.from({ length: 100 }, (_, index) => `Option ${index}`);
  const { view, onchange } = await mountControl({
    renderers: [entry],
    propertySchema: { ...schema, uniqueItems: true, items: { type: 'string', enum: choices } },
    value: [],
    options: { variant: 'multi-select' },
  });
  view.container.querySelector<HTMLElement>('[role="listbox"]')!.click();
  await expect
    .poll(
      () => view.container.querySelectorAll('[role="presentation"] > [role="presentation"]').length,
    )
    .toBe(100);
  const dropdown = view.container.querySelector<HTMLElement>(
    '[role="listbox"] > [role="presentation"]',
  )!;
  expect(dropdown.scrollHeight).toBeGreaterThan(dropdown.clientHeight);
  expect(dropdown.clientHeight).toBeLessThanOrEqual(256);
  const last = Array.from(
    dropdown.querySelectorAll<HTMLElement>(':scope > [role="presentation"]'),
  ).at(-1)!;
  last.scrollIntoView({ block: 'end' });
  await expect.poll(() => dropdown.scrollTop).toBeGreaterThan(0);
  const before = onchange.mock.calls.length;
  last.click();
  expect((await waitForChange(onchange, before)).data.value).toEqual(['Option 99']);
});

it('keeps a long finite multi-select dropdown inside a short viewport', async () => {
  await page.viewport(900, 360);
  try {
    const choices = Array.from({ length: 100 }, (_, index) => `Option ${index}`);
    const { view, onchange } = await mountControl({
      renderers: [entry],
      propertySchema: { ...schema, uniqueItems: true, items: { type: 'string', enum: choices } },
      value: [],
      options: { variant: 'multi-select' },
    });
    view.container.style.marginTop = '170px';
    view.container.querySelector<HTMLElement>('[role="listbox"]')!.click();
    await expect
      .poll(
        () =>
          view.container.querySelectorAll('[role="presentation"] > [role="presentation"]').length,
      )
      .toBe(100);
    const dropdown = view.container.querySelector<HTMLElement>(
      '[role="listbox"] > [role="presentation"]',
    )!;
    await expect.poll(() => dropdown.getBoundingClientRect().height > 0).toBe(true);
    await expect
      .poll(() => {
        const { top, bottom } = dropdown.getBoundingClientRect();
        return top >= 0 && bottom <= window.innerHeight;
      })
      .toBe(true);
    expect(dropdown.scrollHeight).toBeGreaterThan(dropdown.clientHeight);
    const last = Array.from(
      dropdown.querySelectorAll<HTMLElement>(':scope > [role="presentation"]'),
    ).at(-1)!;
    last.scrollIntoView({ block: 'end' });
    await expect.poll(() => dropdown.scrollTop).toBeGreaterThan(0);
    const before = onchange.mock.calls.length;
    last.click();
    expect((await waitForChange(onchange, before)).data.value).toEqual(['Option 99']);
  } finally {
    await page.viewport(1280, 720);
  }
});

it('keeps the keyboard-active final option visible in a long finite list', async () => {
  await page.viewport(900, 360);
  try {
    const choices = Array.from({ length: 100 }, (_, index) => `Option ${index}`);
    const { view, onchange } = await mountControl({
      renderers: [entry],
      propertySchema: { ...schema, uniqueItems: true, items: { type: 'string', enum: choices } },
      value: [],
      options: { variant: 'multi-select' },
    });
    view.container.style.marginTop = '170px';
    const trigger = view.container.querySelector<HTMLElement>('[role="listbox"]')!;
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await expect
      .poll(
        () =>
          view.container.querySelectorAll('[role="presentation"] > [role="presentation"]').length,
      )
      .toBe(100);
    for (let index = 0; index < 99; index++)
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    const dropdown = view.container.querySelector<HTMLElement>(
      '[role="listbox"] > [role="presentation"]',
    )!;
    await expect
      .poll(() => dropdown.querySelector<HTMLElement>('[data-active="true"]')?.textContent)
      .toBe('Option 99');
    const active = dropdown.querySelector<HTMLElement>('[data-active="true"]')!;
    await expect
      .poll(
        () =>
          active.getBoundingClientRect().bottom <= dropdown.getBoundingClientRect().bottom &&
          active.getBoundingClientRect().top >= dropdown.getBoundingClientRect().top,
      )
      .toBe(true);
    const before = onchange.mock.calls.length;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect((await waitForChange(onchange, before)).data.value).toEqual(['Option 99']);
  } finally {
    await page.viewport(1280, 720);
  }
});
