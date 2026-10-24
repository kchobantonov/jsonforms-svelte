import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import type { UISchemaElement } from '@jsonforms/core';
import { flowbiteRenderers } from '../../src/lib/renderers';
import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';

afterEach(cleanup);
const label = (text: string, layout = {}) => ({ type: 'Label', text, options: { layout } });
it('uses configured minimum widths and allows a local zero to restore a single row', async () => {
  const elements = [label('First'), label('Second'), label('Third')];
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'object' },
      data: {},
      renderers: flowbiteRenderers,
      config: { jsonformsExtended: { layoutDefaults: { minItemWidth: 240, wrap: true } } },
      uischema: { type: 'HorizontalLayout', elements } as UISchemaElement,
    },
  });
  view.container.style.width = '640px';
  const items = Array.from(view.container.querySelectorAll<HTMLElement>('[data-layout-item]'));
  expect(items[2].getBoundingClientRect().top).toBeGreaterThan(
    items[0].getBoundingClientRect().top,
  );
  await view.rerender({
    uischema: {
      type: 'HorizontalLayout',
      options: { minItemWidth: 0 },
      elements,
    } as UISchemaElement,
  });
  expect(items[2].getBoundingClientRect().top).toBe(items[0].getBoundingClientRect().top);
});
it('redistributes space when a weighted child reaches its maximum width', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'object' },
      data: {},
      renderers: flowbiteRenderers,
      uischema: {
        type: 'HorizontalLayout',
        elements: [
          label('Limited', { weight: 1, maxWidth: 100 }),
          label('Remaining', { weight: 1 }),
        ],
      } as UISchemaElement,
    },
  });
  view.container.style.width = '640px';
  const items = Array.from(view.container.querySelectorAll<HTMLElement>('[data-layout-item]'));
  expect(items[0].getBoundingClientRect().width).toBeCloseTo(100, 0);
  expect(items[1].getBoundingClientRect().width).toBeCloseTo(524, 0);
});

it('passes an allocated height to nested vertical weights and responds to a new allocation', async () => {
  const layout = (height: number): UISchemaElement => ({
    type: 'VerticalLayout',
    elements: [
      {
        type: 'VerticalLayout',
        options: { layout: { height } },
        elements: [label('One share', { weight: 1 }), label('Three shares', { weight: 3 })],
      },
    ],
  });
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'object' },
      data: {},
      renderers: flowbiteRenderers,
      uischema: layout(240),
    },
  });
  const nested = view.container.querySelectorAll<HTMLElement>('[data-layout="column"]')[1];
  const children = Array.from(nested.children) as HTMLElement[];
  expect(nested.getBoundingClientRect().height).toBeCloseTo(240, 0);
  const first = children[0].getBoundingClientRect().height;
  const second = children[1].getBoundingClientRect().height;
  expect(first + second + 16).toBeCloseTo(240, 0);
  expect(second).toBeGreaterThan(first);
  await view.rerender({ uischema: layout(320) });
  expect(nested.getBoundingClientRect().height).toBeCloseTo(320, 0);
  expect(children[0].getBoundingClientRect().height - first).toBeCloseTo(20, 0);
  expect(children[1].getBoundingClientRect().height - second).toBeCloseTo(60, 0);
});

it.each(['HorizontalLayout', 'VerticalLayout'])(
  'applies both dimensions to a child in %s',
  async (type) => {
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'object' },
        data: {},
        renderers: flowbiteRenderers,
        uischema: {
          type,
          elements: [label('Sized', { width: 120, height: 80 })],
        } as UISchemaElement,
      },
    });
    const item = view.container.querySelector<HTMLElement>('[data-layout-item]')!;
    expect(item.getBoundingClientRect().width).toBeCloseTo(120, 0);
    expect(item.getBoundingClientRect().height).toBeCloseTo(80, 0);
  },
);
