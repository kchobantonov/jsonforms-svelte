import type { Translator } from '@jsonforms/core';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import '../test.css';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { mountControl, waitForChange } from '../testUtils';
import { flowbiteRenderers } from '../../src/lib/renderers';
afterEach(cleanup);

it('preserves the incompatible renamed value and reports the new-path type error', async () => {
  const { view, onchange } = mountControl({
    renderers: flowbiteRenderers,
    propertySchema: {
      type: 'object',
      patternProperties: {
        '^text_': { type: 'string' },
        '^count_': { type: 'integer', minimum: 0 },
      },
      additionalProperties: false,
    },
    value: { text_quantity: 'five' },
  });
  view.container.querySelector<HTMLButtonElement>('button[aria-label="Rename button"]')!.click();
  await vi.waitFor(() => expect(document.querySelector('#flowbite-rename-property')).toBeTruthy());
  const input = document.querySelector<HTMLInputElement>('#flowbite-rename-property')!;
  input.value = 'count_quantity';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const submit = document.querySelector<HTMLButtonElement>('form button[type="submit"]')!;
  await vi.waitFor(() => expect(submit.disabled).toBe(false));
  const before = onchange.mock.calls.length;
  submit.click();
  const change = await waitForChange(onchange, before);
  expect(change.data.value).toEqual({ count_quantity: 'five' });
  expect(change.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ keyword: 'type', instancePath: '/value/count_quantity' }),
    ]),
  );
  await vi.waitFor(() => expect(view.container.textContent).toContain('"five"'));
  const replacement = view.container.querySelector<HTMLInputElement>('input[type="number"]')!;
  expect(replacement.getAttribute('aria-describedby')).toBeTruthy();
  const hint = view.container.querySelector<HTMLElement>('[role="tooltip"]')!;
  const trigger = view.container.querySelector<HTMLButtonElement>(
    'button[aria-label="Stored value"]',
  )!;
  expect(getComputedStyle(hint).visibility).toBe('hidden');
  const inputRect = replacement.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  expect(triggerRect.left).toBeGreaterThanOrEqual(inputRect.right);
  expect(triggerRect.top).toBeGreaterThanOrEqual(inputRect.top);
  expect(triggerRect.bottom).toBeLessThanOrEqual(inputRect.bottom);
  await vi.waitFor(() => {
    trigger.focus();
    expect(getComputedStyle(hint).visibility).toBe('visible');
  });
  const beforeCorrection = onchange.mock.calls.length;
  replacement.value = '5';
  replacement.dispatchEvent(new Event('input', { bubbles: true }));
  const corrected = await waitForChange(onchange, beforeCorrection);
  expect(corrected.data.value).toEqual({ count_quantity: 5 });
  expect(corrected.errors).toEqual([]);
  await vi.waitFor(() => expect(view.container.textContent).not.toContain('"five"'));
});

it.each(['integer', 'number'] as const)(
  'shows numeric-looking strings without coercing readonly %s data',
  async (type) => {
    const { view, onchange } = mountControl({
      renderers: flowbiteRenderers,
      propertySchema: { type, readOnly: true },
      value: '5',
    });
    await vi.waitFor(() => expect(view.container.textContent).toContain('"5"'));
    const input = view.container.querySelector<HTMLInputElement>('input[type="number"]')!;
    expect(input.disabled || input.readOnly).toBe(true);
    expect(input.value).toBe('5');
    for (const [change] of onchange.mock.calls) expect(change.data.value).toBe('5');
  },
);

it('localizes the incompatible-value explanation without changing the raw value', async () => {
  const { container } = render(JsonForms, {
    props: {
      schema: { type: 'integer' },
      uischema: { type: 'Control', scope: '#' },
      data: 'five',
      renderers: flowbiteRenderers,
      i18n: {
        locale: 'test',
        translate: ((key: string, fallback: string | undefined) =>
          key === 'numeric.incompatibleValue'
            ? 'Localized replacement hint'
            : fallback) as Translator,
      },
    },
  });
  await vi.waitFor(() => expect(container.textContent).toContain('Localized replacement hint'));
  expect(container.textContent).toContain('"five"');
});
