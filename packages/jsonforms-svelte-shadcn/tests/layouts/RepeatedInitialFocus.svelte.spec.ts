import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as arrayLayout } from '../../src/lib/layouts/ArrayLayoutRenderer.entry';
import { entry as layout } from '../../src/lib/layouts/LayoutRenderer.entry';
import { entry as string } from '../../src/lib/controls/StringControlRenderer.entry';
import { mountForm, waitForFormChange } from '../testUtils';

beforeEach(() => clearAllIds());
afterEach(async () => cleanup());

const schema: JsonSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: { type: 'object', properties: { name: { type: 'string' } } },
    },
  },
};
const uischema: UISchemaElement = {
  type: 'Control',
  scope: '#/properties/items',
  options: { detail: 'GENERATED' },
};

it('focuses each newly mounted repeated input without reclaiming focus on data updates', async () => {
  const { view, onchange } = await mountForm({
    renderers: [arrayLayout, layout, string],
    schema,
    uischema,
    data: { items: [] },
    config: { focus: true },
  });
  const add = () =>
    Array.from(view.container.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.getAttribute('aria-label')?.toLowerCase().includes('add'),
    )!;
  const before = onchange.mock.calls.length;
  add().click();
  await waitForFormChange(onchange, before);
  const first = view.container.querySelector<HTMLInputElement>('input[type="text"]');
  expect(first).toBeTruthy();
  await expect.poll(() => document.activeElement).toBe(first);

  const outside = document.createElement('button');
  document.body.append(outside);
  outside.focus();
  await view.rerender({ data: { items: [{ name: 'Ada' }] } });
  expect(document.activeElement).toBe(outside);
  outside.remove();

  const next = onchange.mock.calls.length;
  add().click();
  await waitForFormChange(onchange, next);
  const inputs = [...view.container.querySelectorAll<HTMLInputElement>('input[type="text"]')];
  expect(inputs.length).toBeGreaterThan(1);
  await expect.poll(() => document.activeElement).toBe(inputs.at(-1));
});
