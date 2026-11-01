import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { page, userEvent } from 'vite-plus/test/browser';
import type { UISchemaElement, JsonSchema } from '@jsonforms/core';
import { RuleEffect } from '@jsonforms/core';
import { mountForm, getButtonByText, getInputByLabel } from '../testUtils';
import { entry as accordion } from '../../src/lib/layouts/CategorizationAccordionRenderer.entry';
import { entry as layout } from '../../src/lib/layouts/LayoutRenderer.entry';
import { entry as string } from '../../src/lib/controls/StringControlRenderer.entry';
afterEach(cleanup);
const schema: JsonSchema = {
  type: 'object',
  properties: { first: { type: 'string' }, second: { type: 'string' }, hide: { type: 'boolean' } },
};
const first = {
  type: 'Category',
  name: 'first',
  label: 'First',
  elements: [{ type: 'Control', scope: '#/properties/first', label: 'First value' }],
};
const second = {
  type: 'Category',
  name: 'second',
  label: 'Second',
  elements: [{ type: 'Control', scope: '#/properties/second', label: 'Second value' }],
  rule: {
    effect: RuleEffect.HIDE,
    condition: { scope: '#/properties/hide', schema: { const: true } },
  },
};
const makeUI = (options: Record<string, unknown> = {}) =>
  ({
    type: 'Categorization',
    options: { variant: 'accordion', ...options },
    elements: [first, second],
  }) as UISchemaElement;
const renderers = [accordion, layout, string];
it('honors initial, preserves mounted values and remembers explicit all-closed state', async () => {
  const { view } = await mountForm({
    renderers,
    schema,
    uischema: makeUI({ initial: 'second' }),
    data: { first: 'One', second: 'Two', hide: false },
  });
  const secondButton = getButtonByText(view.container, 'Second');
  expect(secondButton.getAttribute('aria-expanded')).toBe('true');
  const input = getInputByLabel(view.container, 'Second value');
  await page.elementLocator(secondButton).click();
  await vi.waitFor(() => expect(secondButton.getAttribute('aria-expanded')).toBe('false'));
  expect(input.isConnected).toBe(true);
  expect(input.value).toBe('Two');
  await view.rerender({ data: { first: 'Edited', second: 'Two', hide: true } });
  expect(getButtonByText(view.container, 'First').getAttribute('aria-expanded')).toBe('false');
  await page.elementLocator(getButtonByText(view.container, 'First')).click();
  await vi.waitFor(() =>
    expect(getButtonByText(view.container, 'First').getAttribute('aria-expanded')).toBe('true'),
  );
  expect(getInputByLabel(view.container, 'First value').value).toBe('Edited');
});
it('falls back from hidden selection and follows changed collapsed settings', async () => {
  const { view } = await mountForm({
    renderers,
    schema,
    uischema: makeUI({ initial: 'second' }),
    data: { first: 'One', second: 'Two', hide: false },
    config: { jsonformsExtended: { collapsed: true } },
  });
  expect(getButtonByText(view.container, 'Second').getAttribute('aria-expanded')).toBe('true');
  getButtonByText(view.container, 'Second').focus();
  await view.rerender({ data: { first: 'One', second: 'Two', hide: true } });
  expect(getButtonByText(view.container, 'First').getAttribute('aria-expanded')).toBe('true');
  expect(document.activeElement).toBe(getButtonByText(view.container, 'First'));
  await view.rerender({ config: { jsonformsExtended: { collapsed: false } } });
  await view.rerender({ config: { jsonformsExtended: { collapsed: true } } });
  expect(getButtonByText(view.container, 'First').getAttribute('aria-expanded')).toBe('false');
  await view.rerender({ config: { jsonformsExtended: { collapsed: false } } });
  expect(getButtonByText(view.container, 'First').getAttribute('aria-expanded')).toBe('true');
});
it.each(['named', 'unnamed', 'duplicate'])(
  'preserves the open category when direct categories reorder (%s)',
  async (mode) => {
    const firstCategory =
      mode === 'named'
        ? first
        : mode === 'duplicate'
          ? { ...first, name: 'shared' }
          : { ...first, name: undefined };
    const secondCategory =
      mode === 'named'
        ? second
        : mode === 'duplicate'
          ? { ...second, name: 'shared' }
          : { ...second, name: undefined };
    const authored = {
      ...makeUI(mode === 'named' ? { initial: 'second' } : {}),
      elements: [firstCategory, secondCategory],
    } as UISchemaElement;
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema: authored,
      data: { first: 'One', second: 'Two', hide: false },
    });
    if (mode !== 'named')
      await page.elementLocator(getButtonByText(view.container, 'Second')).click();
    await vi.waitFor(() =>
      expect(getButtonByText(view.container, 'Second').getAttribute('aria-expanded')).toBe('true'),
    );
    const changes = onchange.mock.calls.length;
    await view.rerender({
      uischema: { ...authored, elements: [secondCategory, firstCategory] },
    });
    await vi.waitFor(() =>
      expect(getButtonByText(view.container, 'Second').getAttribute('aria-expanded')).toBe('true'),
    );
    expect(getInputByLabel(view.container, 'Second value').value).toBe('Two');
    expect(onchange.mock.calls).toHaveLength(changes);
  },
);

it('keeps an explicitly closed accordion closed across category reorder', async () => {
  const authored = makeUI({ initial: 'second' });
  const { view, onchange } = await mountForm({
    renderers,
    schema,
    uischema: authored,
    data: { first: 'One', second: 'Two', hide: false },
  });
  await page.elementLocator(getButtonByText(view.container, 'Second')).click();
  await vi.waitFor(() =>
    expect(getButtonByText(view.container, 'Second').getAttribute('aria-expanded')).toBe('false'),
  );
  const changes = onchange.mock.calls.length;
  await view.rerender({ uischema: { ...authored, elements: [second, first] } });
  expect(getButtonByText(view.container, 'First').getAttribute('aria-expanded')).toBe('false');
  expect(getButtonByText(view.container, 'Second').getAttribute('aria-expanded')).toBe('false');
  expect(onchange.mock.calls).toHaveLength(changes);
});

it('opens the first remaining category when the focused open category is removed', async () => {
  const authored = makeUI({ initial: 'second' });
  const { view, onchange } = await mountForm({
    renderers,
    schema,
    uischema: authored,
    data: { first: 'One', second: 'Two', hide: false },
  });
  getButtonByText(view.container, 'Second').focus();
  const changes = onchange.mock.calls.length;
  await view.rerender({ uischema: { ...authored, elements: [first] } });
  const fallback = getButtonByText(view.container, 'First');
  await vi.waitFor(() => expect(fallback.getAttribute('aria-expanded')).toBe('true'));
  expect(document.activeElement).toBe(fallback);
  expect(getInputByLabel(view.container, 'First value').value).toBe('One');
  expect(onchange.mock.calls).toHaveLength(changes);
});

it('starts collapsed without an explicit initial category', async () => {
  const { view } = await mountForm({
    renderers,
    schema,
    uischema: makeUI({ collapsed: true }),
    data: { hide: false },
  });
  expect(getButtonByText(view.container, 'First').getAttribute('aria-expanded')).toBe('false');
  expect(getButtonByText(view.container, 'Second').getAttribute('aria-expanded')).toBe('false');
});

it('diagnoses invalid accordion collapse without coercing it', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema: makeUI({ collapsed: 'yes' }),
      data: { hide: false },
      config: { jsonformsExtended: { collapsed: true } },
    });
    expect(getButtonByText(view.container, 'First').getAttribute('aria-expanded')).toBe('false');
    const diagnostics = () =>
      warning.mock.calls.filter(([code]) => code === 'section.invalidCollapsed');
    await vi.waitFor(() => expect(diagnostics()).toHaveLength(1));
    expect(diagnostics()[0]).toEqual([
      'section.invalidCollapsed',
      { component: 'accordion', source: 'options.collapsed', type: 'string' },
    ]);
    await view.rerender({ config: { jsonformsExtended: { collapsed: false } } });
    expect(getButtonByText(view.container, 'First').getAttribute('aria-expanded')).toBe('true');
    expect(diagnostics()).toHaveLength(1);
  } finally {
    warning.mockRestore();
  }
});

it('supports keyboard opening, switching and closing accordion categories', async () => {
  const { view } = await mountForm({
    renderers,
    schema,
    uischema: makeUI({ collapsed: true }),
    data: { first: 'One', second: 'Two', hide: false },
  });
  const firstButton = getButtonByText(view.container, 'First');
  const secondButton = getButtonByText(view.container, 'Second');
  expect(firstButton.getAttribute('aria-expanded')).toBe('false');
  firstButton.focus();
  await userEvent.keyboard('{Enter}');
  await vi.waitFor(() => expect(firstButton.getAttribute('aria-expanded')).toBe('true'));
  expect(document.activeElement).toBe(firstButton);
  secondButton.focus();
  await userEvent.keyboard(' ');
  await vi.waitFor(() => expect(secondButton.getAttribute('aria-expanded')).toBe('true'));
  expect(firstButton.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(secondButton);
  await userEvent.keyboard('{Enter}');
  await vi.waitFor(() => expect(secondButton.getAttribute('aria-expanded')).toBe('false'));
});
