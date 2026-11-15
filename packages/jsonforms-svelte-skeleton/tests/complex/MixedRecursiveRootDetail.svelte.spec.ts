import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import type { JsonSchema } from '@jsonforms/core';
import { skeletonRenderers } from '../../src/lib/renderers';

afterEach(cleanup);

it('uses a registered detail for a recursive additional property at the schema root', async () => {
  const schema: JsonSchema = {
    $id: 'https://example.com/recursive-meta-schema',
    type: ['object', 'boolean'],
    properties: {
      properties: { type: 'object', additionalProperties: { $ref: '#' } },
      title: { type: 'string' },
    },
  };
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      data: { properties: { name: { type: 'string' } } },
      schema,
      uischema: { type: 'Control', scope: '#' },
      uischemas: [
        {
          tester: (candidate: JsonSchema, _schemaPath: string, path: string) =>
            (candidate as { $id?: string }).$id === 'https://example.com/recursive-meta-schema' &&
            candidate.type === 'object' &&
            path === 'properties.name'
              ? 10
              : -1,
          uischema: { type: 'Label', text: 'Resolved recursive detail' },
        },
      ],
      renderers: skeletonRenderers,
      onchange,
    },
  });
  const tree = view.container.querySelector<HTMLElement>('[role="tree"]')!;
  await vi.waitFor(() => expect(tree).toBeTruthy());
  const properties = Array.from(tree.querySelectorAll<HTMLElement>('[role="treeitem"]')).find(
    (item) => item.textContent?.includes('properties'),
  )!;
  await vi.waitFor(() => expect(properties).toBeTruthy());
  let name: HTMLElement | undefined;
  await vi.waitFor(() => {
    name = tree.querySelector<HTMLElement>('[data-value="properties.name"]') ?? undefined;
    expect(name?.isConnected).toBe(true);
  });
  name!.click();
  await vi.waitFor(() =>
    expect(
      view.container.querySelector('[data-value="properties.name"]')?.getAttribute('aria-selected'),
    ).toBe('true'),
  );
  await vi.waitFor(() => expect(view.container.textContent).toContain('Resolved recursive detail'));
  expect(onchange.mock.lastCall?.[0].data).toEqual({ properties: { name: { type: 'string' } } });
});
