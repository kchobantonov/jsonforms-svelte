import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { page } from 'vite-plus/test/browser';
import { entry as boolean } from '../../src/lib/controls/BooleanControlRenderer.entry';
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
const renderers = [accordion, layout, string, boolean];
it('honors initial, preserves mounted values and remembers explicit all-closed state', async () => {
  const { view } = await mountForm({
    renderers,
    schema,
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/hide', label: 'Hide second' },
        makeUI({ initial: 'second' }),
      ],
    } as UISchemaElement,
    data: { first: 'One', second: 'Two', hide: false },
  });
  const secondButton = getButtonByText(view.container, 'Second');
  expect(secondButton.getAttribute('aria-expanded')).toBe('true');
  const input = getInputByLabel(view.container, 'Second value');
  await page.elementLocator(secondButton).click();
  await vi.waitFor(() => expect(secondButton.getAttribute('aria-expanded')).toBe('false'));
  expect(input.isConnected).toBe(true);
  expect(input.value).toBe('Two');
  await page.getByRole('checkbox', { name: 'Hide second' }).click();
  await vi.waitFor(() => expect(view.container.textContent).not.toContain('Second value'));
  expect(getButtonByText(view.container, 'First').getAttribute('aria-expanded')).toBe('false');
  await page.elementLocator(getButtonByText(view.container, 'First')).click();
  await vi.waitFor(() =>
    expect(getButtonByText(view.container, 'First').getAttribute('aria-expanded')).toBe('true'),
  );
  expect(getInputByLabel(view.container, 'First value').value).toBe('One');
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
  await view.rerender({ data: { first: 'One', second: 'Two', hide: true } });
  expect(getButtonByText(view.container, 'First').getAttribute('aria-expanded')).toBe('true');
  await view.rerender({ config: { jsonformsExtended: { collapsed: false } } });
  await view.rerender({ config: { jsonformsExtended: { collapsed: true } } });
  expect(getButtonByText(view.container, 'First').getAttribute('aria-expanded')).toBe('false');
  await view.rerender({ config: { jsonformsExtended: { collapsed: false } } });
  expect(getButtonByText(view.container, 'First').getAttribute('aria-expanded')).toBe('true');
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
