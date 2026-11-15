import '../test.css';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import type { JsonSchema } from '@jsonforms/core';
import { entry } from '../../src/lib/complex/ArrayChoicesRenderer.entry';
import { shadcnRenderers } from '../../src/lib/renderers';
import { mountControl, mountForm, waitForChange } from '../testUtils';

afterEach(cleanup);
it('does not count a disabled chip input as an active focus request', async () => {
  const ondiagnostic = vi.fn();
  const schema = (maxItems: number) => ({
    type: 'object' as const,
    properties: {
      name: { type: 'string' as const },
      tags: { type: 'array' as const, maxItems, items: { type: 'string' as const } },
    },
  });
  const { view } = await mountForm({
    renderers: shadcnRenderers,
    schema: schema(1),
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
  const conflicts = () =>
    ondiagnostic.mock.calls.filter(([diagnostic]) => diagnostic.code === 'focus.conflict');
  await view.rerender({ schema: schema(2) });
  await vi.waitFor(() => expect(conflicts()).toHaveLength(1));
  await view.rerender({ data: { name: 'Grace', tags: ['A'] } });
  expect(conflicts()).toHaveLength(1);
  await view.rerender({ schema: schema(1) });
  await vi.waitFor(() =>
    expect(
      view.container.querySelector<HTMLInputElement>('[id="#/properties/tags-input"]')?.disabled,
    ).toBe(true),
  );
  await Promise.resolve();
  await view.rerender({ schema: schema(2) });
  await vi.waitFor(() => expect(conflicts()).toHaveLength(2));
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
    const target = view.container.querySelector<HTMLElement>(
      variant === 'multi-select' ? '[role="combobox"]' : 'input',
    )!;
    expect(target).not.toBeNull();
    await expect.poll(() => document.activeElement).toBe(target);
  },
);
it('exposes required state when the visual array-choice asterisk is hidden', async () => {
  const options = { hideRequiredAsterisk: true };
  const chipsView = await mountControl({
    renderers: [entry],
    propertySchema: {
      type: 'array',
      description: 'Choose tags',
      uniqueItems: true,
      items: { type: 'string' },
    },
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
    multiView.view.container.querySelector('[id$="-input"]')?.getAttribute('aria-required'),
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

it('uses the extras Tags Input for unique free strings and keeps guarded mutations', async () => {
  const { view, onchange } = await chips(['A'], { uniqueItems: true });
  const field = view.container.querySelector<HTMLInputElement>('input')!;
  expect(field.closest('.jsonforms-array-tags')).not.toBeNull();
  expect(view.container.querySelector('button[aria-label="Remove A"]')).not.toBeNull();
  const before = onchange.mock.calls.length;
  input(view.container, 'B').dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
  );
  expect((await waitForChange(onchange, before)).data.value).toEqual(['A', 'B']);
  const next = onchange.mock.calls.length;
  view.container.querySelector<HTMLButtonElement>('button[aria-label="Remove A"]')!.click();
  expect((await waitForChange(onchange, next)).data.value).toEqual(['B']);
});

it('shows an invalid imported free-string tag with its item error', async () => {
  const { view } = await chips(['A'], {
    uniqueItems: true,
    items: { type: 'string', minLength: 3 },
  });
  await expect.poll(() => view.container.querySelector('span[aria-invalid="true"]')).not.toBeNull();
  const invalidPill = view.container.querySelector<HTMLElement>('span[aria-invalid="true"]')!;
  expect(invalidPill.textContent).toContain('A');
  expect(invalidPill.classList.contains('border-destructive')).toBe(true);
  expect(view.container.querySelector('.jsonforms-array-tags')).toBeNull();
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

it('keeps repeated and finite choice pills inside their input field', async () => {
  const repeated = await chips(['A', 'A']);
  const repeatedField = repeated.view.container.querySelector<HTMLInputElement>('input')!;
  expect(
    repeatedField.parentElement?.querySelectorAll('button[aria-label="Remove A"]'),
  ).toHaveLength(2);
  await cleanup();
  const finite = await chips(['A'], {
    uniqueItems: true,
    items: { type: 'string', enum: ['A', 'B'] },
  });
  const finiteField = finite.view.container.querySelector<HTMLInputElement>('input')!;
  expect(finiteField.parentElement?.querySelector('button[aria-label="Remove A"]')).not.toBeNull();
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

it('opens multi-select from the whole field, shows choice rows, and keeps imported values removable', async () => {
  const { view, onchange } = await mountControl({
    renderers: [entry],
    propertySchema: { ...schema, uniqueItems: true, items: { type: 'string', enum: ['A', 'B'] } },
    value: ['Fax'],
    options: { variant: 'multi-select' },
  });
  expect(view.container.querySelector('button[aria-label="Remove Fax"]')).not.toBeNull();
  const field = view.container.querySelector<HTMLElement>('[role="combobox"]')!;
  field.click();
  await expect.poll(() => document.querySelectorAll('[data-slot="command-item"]').length).toBe(3);
  expect(document.querySelector('[data-slot="command-item"] [role="checkbox"]')).toBeNull();
  const before = onchange.mock.calls.length;
  (document.querySelector('[data-slot="command-item"]') as HTMLElement).click();
  expect((await waitForChange(onchange, before)).data.value).toEqual(['Fax', 'A']);
  expect(document.querySelector('[data-slot="popover-content"]')).not.toBeNull();
});

it('marks an imported invalid member and exposes its error at the field', async () => {
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
    view.container.querySelector('[role="combobox"]')?.getAttribute('aria-describedby'),
  ).toContain('-help');
  const invalidPill = view.container.querySelector<HTMLElement>('span[aria-invalid="true"]')!;
  expect(invalidPill.textContent).toContain('Fax');
  expect(invalidPill.classList.contains('border-destructive')).toBe(true);
  expect(invalidPill.classList.contains('border-transparent')).toBe(false);
  const fieldLabel = view.container.querySelector('label')!;
  expect(fieldLabel.classList.contains('text-foreground')).toBe(true);
  const invalidLabelColor = getComputedStyle(fieldLabel).color;
  expect(invalidLabelColor).not.toBe(
    getComputedStyle(view.container.querySelector('[role="alert"]')!).color,
  );
  const pillStyle = getComputedStyle(invalidPill);
  expect(invalidPill.style.borderColor).toBe('');
  const markerColor = getComputedStyle(invalidPill.querySelector('.text-destructive')!).color;
  for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
    expect(pillStyle[`border${side}Width`]).toBe('1px');
    expect(pillStyle[`border${side}Color`]).toBe(markerColor);
  }
  expect(view.container.querySelector('[role="combobox"]')?.getAttribute('aria-invalid')).toBe(
    'true',
  );
  const before = onchange.mock.calls.length;
  view.container.querySelector<HTMLButtonElement>('button[aria-label="Remove Fax"]')!.click();
  expect(((await waitForChange(onchange, before)).data as { imported?: unknown }).imported).toEqual(
    ['Email'],
  );
  await expect.poll(() => view.container.querySelector('[role="alert"]')).toBeNull();
  expect(getComputedStyle(fieldLabel).color).toBe(invalidLabelColor);
});

it('keeps item errors on the literal dotted array instead of its nested lookalike', async () => {
  const schema = {
    type: 'object',
    properties: {
      'a.b': { type: 'array', uniqueItems: true, items: { type: 'string', enum: ['Good'] } },
      a: {
        type: 'object',
        properties: {
          b: { type: 'array', uniqueItems: true, items: { type: 'string', enum: ['Good'] } },
        },
      },
    },
  } as JsonSchema;
  const { view } = await mountForm({
    renderers: shadcnRenderers,
    schema,
    uischema: {
      type: 'Control',
      scope: '#/properties/a.b',
      options: { variant: 'multi-select' },
    },
    data: { 'a.b': ['Wrong'], a: { b: ['Good'] } },
  });
  await expect
    .poll(() => view.container.querySelector('span[aria-invalid="true"]')?.textContent)
    .toContain('Wrong');
  await view.rerender({ data: { 'a.b': ['Good'], a: { b: ['Wrong'] } } });
  await expect.poll(() => view.container.querySelector('span[aria-invalid="true"]')).toBeNull();
});

it('keeps the field label neutral when only the array length is invalid', async () => {
  const { view } = await mountForm({
    renderers: [entry],
    schema: {
      type: 'object',
      properties: {
        locations: {
          type: 'array',
          title: 'Office locations',
          minItems: 2,
          items: { type: 'string' },
        },
      },
    },
    uischema: {
      type: 'Control',
      scope: '#/properties/locations',
      options: { variant: 'chips' },
    },
    data: { locations: ['Dover'] },
    i18n: { locale: 'en', translateError: () => 'Choose at least 2.' },
  });
  await expect
    .poll(() => view.container.querySelector('[role="alert"]')?.textContent)
    .toContain('Choose at least 2.');
  const label = view.container.querySelector('label')!;
  expect(label.textContent).toContain('Office locations');
  expect(label.classList.contains('text-foreground')).toBe(true);
  expect(getComputedStyle(label).color).not.toBe(
    getComputedStyle(view.container.querySelector('[role="alert"]')!).color,
  );
  expect(view.container.querySelector('span[aria-invalid="true"]')).toBeNull();
});

it('keeps the popup closed when removing a chip and opens it with the keyboard', async () => {
  const { view, onchange } = await mountControl({
    renderers: [entry],
    propertySchema: { ...schema, uniqueItems: true, items: { type: 'string', enum: ['A', 'B'] } },
    value: ['A'],
    options: { variant: 'multi-select' },
  });
  const field = view.container.querySelector<HTMLElement>('[role="combobox"]')!;
  const before = onchange.mock.calls.length;
  view.container.querySelector<HTMLButtonElement>('button[aria-label="Remove A"]')!.click();
  expect((await waitForChange(onchange, before)).data.value).toEqual([]);
  expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
  field.focus();
  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await expect.poll(() => document.querySelector('[data-slot="popover-content"]')).not.toBeNull();
});

it('shows multi-select search only when autocomplete is enabled', async () => {
  const { view } = await mountControl({
    renderers: [entry],
    propertySchema: { ...schema, uniqueItems: true, items: { type: 'string', enum: ['A', 'B'] } },
    value: ['A'],
    options: { variant: 'multi-select', autocomplete: true },
  });
  view.container.querySelector<HTMLElement>('[role="combobox"]')!.click();
  await expect
    .poll(() => document.querySelector('[data-slot="popover-content"] input'))
    .not.toBeNull();
});

it('lets Enter remove a focused multi-select chip without opening the popup', async () => {
  const { view, onchange } = await mountControl({
    renderers: [entry],
    propertySchema: { ...schema, uniqueItems: true, items: { type: 'string', enum: ['A', 'B'] } },
    value: ['A'],
    options: { variant: 'multi-select' },
  });
  const remove = view.container.querySelector<HTMLButtonElement>('button[aria-label="Remove A"]')!;
  remove.focus();
  const before = onchange.mock.calls.length;
  remove.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
  remove.click();
  expect((await waitForChange(onchange, before)).data.value).toEqual([]);
  expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
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
