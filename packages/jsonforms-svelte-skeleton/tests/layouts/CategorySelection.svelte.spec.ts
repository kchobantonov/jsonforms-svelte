import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import type { UISchemaElement, JsonSchema } from '@jsonforms/core';
import { RuleEffect } from '@jsonforms/core';
import { mountForm, getTabByText, getInputByLabel } from '../testUtils';
import { entry as tabs } from '../../src/lib/layouts/CategorizationRenderer.entry';
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
};
const renderers = [tabs, layout, string];
it('honors named initial selection and keeps identity across reorder and replacement', async () => {
  const uischema = {
    type: 'Categorization',
    options: { initial: 'second' },
    elements: [first, second],
  } as UISchemaElement;
  const { view } = await mountForm({
    renderers,
    schema,
    uischema,
    data: { first: 'One', second: 'Two' },
  });
  expect(getTabByText(view.container, 'Second').getAttribute('aria-selected')).toBe('true');
  expect(getInputByLabel(view.container, 'Second value').value).toBe('Two');
  await view.rerender({ uischema: { ...uischema, elements: [second, first] } as UISchemaElement });
  expect(getTabByText(view.container, 'Second').getAttribute('aria-selected')).toBe('true');
  getTabByText(view.container, 'First').click();
  await vi.waitFor(() =>
    expect(getTabByText(view.container, 'First').getAttribute('aria-selected')).toBe('true'),
  );
  await view.rerender({ uischema: { ...uischema, elements: [first, second] } as UISchemaElement });
  expect(getInputByLabel(view.container, 'First value').value).toBe('One');
});
it('falls back when selection is hidden and removes stale panels when all categories hide', async () => {
  const rule = {
    effect: RuleEffect.HIDE,
    condition: { scope: '#/properties/hide', schema: { const: true } },
  };
  const uischema = {
    type: 'Categorization',
    options: { initial: 'second' },
    elements: [first, { ...second, rule }],
  } as UISchemaElement;
  const { view } = await mountForm({
    renderers,
    schema,
    uischema,
    data: { first: 'One', second: 'Two', hide: false },
  });
  await view.rerender({ data: { first: 'One', second: 'Two', hide: true } });
  await vi.waitFor(() =>
    expect(getTabByText(view.container, 'First').getAttribute('aria-selected')).toBe('true'),
  );
  expect(view.container.textContent).not.toContain('Second');
  await view.rerender({
    uischema: {
      ...uischema,
      elements: [
        { ...first, rule },
        { ...second, rule },
      ],
    } as UISchemaElement,
  });
  expect(view.container.querySelector('[role="tab"]')).toBeNull();
  expect(view.container.querySelector('input')).toBeNull();
});
