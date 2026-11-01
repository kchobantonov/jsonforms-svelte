import '../test.css';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { skeletonCells } from '../../src/lib/cells';
import { skeletonRenderers } from '../../src/lib/renderers';
import { mountForm } from '../testUtils';

afterEach(cleanup);

const schema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          nested: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
} as JsonSchema;
const data = {
  items: [
    { name: 'A', nested: [] },
    { name: 'B', nested: [] },
  ],
};

for (const presentation of ['table', 'layout'] as const) {
  const specific =
    presentation === 'table' ? 'showArrayTableSortButtons' : 'showArrayLayoutSortButtons';
  const other =
    presentation === 'table' ? 'showArrayLayoutSortButtons' : 'showArrayTableSortButtons';
  const uischema = (options: Record<string, unknown> = {}): UISchemaElement => ({
    type: 'Control',
    scope: '#/properties/items',
    options: { table: presentation === 'table', ...options },
  });
  const downButtons = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLButtonElement>('button')).filter((button) =>
      button.getAttribute('aria-label')?.includes(messages.en['array.downAriaLabel']),
    );

  it(`uses the legacy ${presentation} sort flag with local generic false and reorders data`, async () => {
    const { view, onchange } = await mountForm({
      schema,
      uischema: uischema({ showSortButtons: false }),
      config: { [specific]: true },
      data: structuredClone(data),
      renderers: skeletonRenderers,
      cells: skeletonCells,
    });
    await vi.waitFor(() => expect(downButtons(view.container)).toHaveLength(2));
    const before = onchange.mock.calls.length;
    downButtons(view.container)[0].click();
    await vi.waitFor(() => expect(onchange.mock.calls.length).toBeGreaterThan(before));
    expect(
      onchange.mock.lastCall?.[0].data.items.map((item: { name: string }) => item.name),
    ).toEqual(['B', 'A']);
    await cleanup();

    const generic = await mountForm({
      schema,
      uischema: uischema({ [specific]: false }),
      config: { showSortButtons: true },
      data: structuredClone(data),
      renderers: skeletonRenderers,
      cells: skeletonCells,
    });
    await vi.waitFor(() => expect(downButtons(generic.view.container)).toHaveLength(2));
    await cleanup();

    const unrelated = await mountForm({
      schema,
      uischema: uischema(),
      config: { [other]: true },
      data: structuredClone(data),
      renderers: skeletonRenderers,
      cells: skeletonCells,
    });
    expect(downButtons(unrelated.view.container)).toHaveLength(0);
  });
}
