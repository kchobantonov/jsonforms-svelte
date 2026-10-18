import '../test.css';
import { createCatalogTranslator } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { flowbiteRenderers } from '../../src/lib/renderers';
import { flowbiteCells } from '../../src/lib/cells';
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
      renderers: flowbiteRenderers,
      propertySchema: { type: 'boolean' },
      value: 'false',
      options: {
        toggle,
        flowbite: {
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
      renderers: flowbiteRenderers,
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
    renderers: flowbiteRenderers,
    cells: flowbiteCells,
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
    renderers: flowbiteRenderers,
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
    renderers: flowbiteRenderers,
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

it.each([false, true])(
  'preserves readonly native boolean state with separate disabled presentation (toggle=%s)',
  async (toggle) => {
    const { view, onchange } = mountControl({
      renderers: flowbiteRenderers,
      propertySchema: { type: 'boolean' },
      value: false,
      options: { toggle },
    });
    await view.rerender({ readonly: true, config: { separateReadonlyFromDisabled: true } });
    await tick();
    const element = widget(view.container);
    const nativeReadonly = false;
    expect((element as HTMLInputElement | HTMLButtonElement).disabled).toBe(!nativeReadonly);
    element.click();
    await tick();
    expect(checked(element)).toBe(false);
    if (nativeReadonly) {
      element.focus();
      expect(document.activeElement).toBe(element);
      await userEvent.keyboard(' ');
      expect(checked(element)).toBe(false);
    }
    expect(onchange.mock.calls.every(([event]) => event.data.value === false)).toBe(true);
    await view.rerender({ readonly: false });
    await tick();
    element.click();
    await expect.poll(() => onchange.mock.lastCall?.[0].data.value).toBe(true);
    expect(checked(element)).toBe(true);
  },
);

for (const toggle of [false, true]) {
  it.each([false, true])(
    `clears a present boolean without switching off (toggle=${toggle}, value=%s)`,
    async (value) => {
      const { view, onchange } = mountControl({
        renderers: flowbiteRenderers,
        propertySchema: { type: 'boolean' },
        value,
        required: true,
        options: { toggle },
      });
      await view.rerender({ data: { value, other: 'keep' }, i18n: { locale: 'bg' } });
      const clear = view.getByRole('button', { name: 'Изчистване на стойността', exact: true });
      widget(view.container).focus();
      await clear.click();
      await expect.poll(() => onchange.mock.lastCall?.[0].data).toEqual({ other: 'keep' });
      expect(view.container.querySelector('[data-boolean-state]')?.textContent).toBe(
        'Не е зададено',
      );
      expect(
        view.container.querySelector('button[aria-label="Изчистване на стойността"]'),
      ).toBeNull();
      expect(
        onchange.mock.lastCall?.[0].errors.some(
          (error: { keyword: string }) => error.keyword === 'required',
        ),
      ).toBe(true);
    },
  );
  it(`honors clearable and revoked permissions (toggle=${toggle})`, async () => {
    const { view, onchange } = mountControl({
      renderers: flowbiteRenderers,
      propertySchema: { type: 'boolean' },
      value: false,
      options: { toggle, clearable: false },
    });
    expect(view.container.querySelector('button[aria-label="Clear value"]')).toBeNull();
    await view.rerender({
      uischema: { type: 'Control', scope: '#/properties/value', options: { toggle } },
    });
    const clear = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Clear value"]',
    )!;
    expect(clear).not.toBeNull();
    await view.rerender({ readonly: true, config: { separateReadonlyFromDisabled: true } });
    clear.click();
    await tick();
    expect(onchange.mock.lastCall?.[0].data.value).toBe(false);
    expect(view.container.querySelector('button[aria-label="Clear value"]')).toBeNull();
  });
}

it('reveals the clear action on field focus and hover without showing it at rest', async () => {
  const { view } = mountControl({
    renderers: flowbiteRenderers,
    propertySchema: { type: 'boolean' },
    value: false,
  });
  const clear = view.container.querySelector<HTMLButtonElement>(
    'button[aria-label="Clear value"]',
  )!;
  const outside = document.createElement('button');
  outside.textContent = 'Outside';
  outside.style.cssText = 'position:fixed;right:0;bottom:0';
  view.container.append(outside);
  await page.elementLocator(outside).click();
  await expect.poll(() => getComputedStyle(clear).opacity).toBe('0');
  await page.elementLocator(widget(view.container)).hover();
  await expect.poll(() => getComputedStyle(clear).opacity).toBe('1');
  await page.elementLocator(outside).hover();
  widget(view.container).focus();
  await expect.poll(() => getComputedStyle(clear).opacity).toBe('1');
});

it('clears an array-item boolean without deleting a slot or shifting siblings', async () => {
  const { view, onchange } = mountControl({
    renderers: flowbiteRenderers,
    cells: flowbiteCells,
    propertySchema: { type: 'array', items: { type: 'boolean' } },
    value: [true, true],
    options: { table: true },
  });
  const clear = view.container.querySelector<HTMLButtonElement>(
    'td button[aria-label="Clear value"]',
  )!;
  expect(clear).not.toBeNull();
  await page.elementLocator(clear).click();
  await expect.poll(() => onchange.mock.lastCall?.[0].data.value).toEqual([false, true]);
});

it('clears a boolean property cell without changing its row or neighbors', async () => {
  const { view, onchange } = mountControl({
    renderers: flowbiteRenderers,
    cells: flowbiteCells,
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: { active: { type: 'boolean' }, name: { type: 'string' } },
      },
    },
    value: [
      { active: false, name: 'keep' },
      { active: true, name: 'second' },
    ],
    options: { table: true },
  });
  const clear = view.container.querySelector<HTMLButtonElement>(
    'td button[aria-label="Clear value"]',
  )!;
  expect(clear).not.toBeNull();
  await page.elementLocator(clear).click();
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data.value)
    .toEqual([{ name: 'keep' }, { active: true, name: 'second' }]);
});

it('retains a dynamic boolean key when clearing its content', async () => {
  const { view, onchange } = mountControl({
    renderers: flowbiteRenderers,
    propertySchema: { type: 'object', additionalProperties: { type: 'boolean' } },
    value: { flag: true },
  });
  const clear = view.container.querySelector<HTMLButtonElement>(
    'button[aria-label="Clear value"]',
  )!;
  expect(clear).not.toBeNull();
  await page.elementLocator(clear).click();
  await expect.poll(() => onchange.mock.lastCall?.[0].data.value).toEqual({ flag: false });
});
