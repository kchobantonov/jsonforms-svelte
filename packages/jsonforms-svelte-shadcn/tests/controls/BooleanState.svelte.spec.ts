import { createCatalogTranslator } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { shadcnRenderers } from '../../src/lib/renderers';
import { shadcnCells } from '../../src/lib/cells';
import { mountControl } from '../testUtils';

afterEach(cleanup);
const widget = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(
    '[role="checkbox"], [role="switch"], input[type="checkbox"]',
  )!;
const checked = (element: HTMLElement) =>
  element instanceof HTMLInputElement
    ? element.checked
    : element.getAttribute('aria-checked') === 'true';

it.each([false, true])(
  'preserves invalid values and exposes their state (toggle=%s)',
  async (toggle) => {
    const { view, onchange } = mountControl({
      renderers: shadcnRenderers,
      propertySchema: { type: 'boolean' },
      value: 'false',
      options: {
        toggle,
        shadcn: {
          Checkbox: { 'aria-describedby': 'host-help' },
          Toggle: { 'aria-describedby': 'host-help' },
          checkbox: { 'aria-describedby': 'host-help' },
          Switch: {
            'aria-describedby': 'host-help',
            HiddenInput: { 'aria-describedby': 'host-help' },
          },
        },
      },
    });
    await tick();
    expect(checked(widget(view.container))).toBe(false);
    expect(
      view.container.querySelector('[id$="-input"]')?.getAttribute('aria-describedby'),
    ).toContain('host-help');
    expect(view.container.querySelector('[data-boolean-state]')?.textContent).toBe(
      'Not a true or false value',
    );
    expect(onchange.mock.calls.every(([event]) => event.data.value === 'false')).toBe(true);
    await view.rerender({ data: { value: 0 }, i18n: { locale: 'bg' } });
    await tick();
    expect(checked(widget(view.container))).toBe(false);
    expect(view.container.querySelector('[data-boolean-state]')?.textContent).toBe(
      'Стойността не е да или не',
    );
    await view.rerender({ data: {} });
    await tick();
    expect(view.container.querySelector('[data-boolean-state]')?.textContent).toBe('Не е зададено');
    await view.rerender({ data: { value: false } });
    expect(view.container.querySelector('[data-boolean-state]')).toBeNull();
  },
);
it.each([false, true])(
  'required false is valid without native true-only validation (toggle=%s)',
  async (toggle) => {
    const { view, onchange } = mountControl({
      renderers: shadcnRenderers,
      propertySchema: { type: 'boolean' },
      value: false,
      required: true,
      options: { toggle },
    });
    await tick();
    expect(checked(widget(view.container))).toBe(false);
    expect(view.container.querySelector('input[required]')).toBeNull();
    expect(view.container.querySelector('[aria-required="true"]')).not.toBeNull();
    expect(onchange.mock.lastCall?.[0].errors).toEqual([]);
  },
);
it('keeps a table boolean cell indeterminate for imported string false', async () => {
  const { view, onchange } = mountControl({
    renderers: shadcnRenderers,
    cells: shadcnCells,
    propertySchema: { type: 'array', items: { type: 'boolean' } },
    value: ['false'],
    options: { table: true },
  });
  await tick();
  expect(checked(widget(view.container))).toBe(false);
  expect(view.container.querySelector('[data-boolean-state]')?.textContent).toBe(
    'Not a true or false value',
  );
  expect(onchange.mock.calls.every(([event]) => event.data.value[0] === 'false')).toBe(true);
});

it.each([false, true])('guards readonly boolean mutation paths (toggle=%s)', async (toggle) => {
  const { view, onchange } = mountControl({
    renderers: shadcnRenderers,
    propertySchema: { type: 'boolean' },
    value: false,
    options: { toggle },
  });
  await view.rerender({ readonly: true });
  await tick();
  const before = onchange.mock.calls.length;
  const element = widget(view.container);
  element.click();
  const input = view.container.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (input) {
    input.checked = true;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  await tick();
  expect(onchange.mock.calls.length).toBe(before);
});

it('uses arbitrary host locales and preserves intentionally empty messages', async () => {
  const { view } = mountControl({
    renderers: shadcnRenderers,
    propertySchema: { type: 'boolean' },
    value: 'invalid',
  });
  await view.rerender({
    i18n: {
      locale: 'fr-CA',
      translate: createCatalogTranslator('fr-CA', {
        fr: { 'boolean.invalid': 'Valeur booléenne invalide' },
      }),
    },
  });
  await tick();
  expect(view.container.querySelector('[data-boolean-state]')?.textContent).toBe(
    'Valeur booléenne invalide',
  );
  await view.rerender({
    i18n: {
      locale: 'de',
      translate: createCatalogTranslator('de', {
        de: { 'boolean.invalid': '' },
      }),
    },
  });
  await tick();
  expect(view.container.querySelector('[data-boolean-state]')?.textContent).toBe('');
});
