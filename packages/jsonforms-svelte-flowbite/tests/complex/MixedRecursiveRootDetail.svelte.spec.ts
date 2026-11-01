import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import type { JsonSchema } from '@jsonforms/core';
import { flowbiteRenderers } from '../../src/lib/renderers';

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
      renderers: flowbiteRenderers,
      onchange,
    },
  });
  const tree = view.container.querySelector<HTMLElement>('[role="tree"]')!;
  await vi.waitFor(() => expect(tree).toBeTruthy());
  const root = tree.querySelector<HTMLElement>('[role="treeitem"]')!;
  if (root.getAttribute('aria-expanded') === 'false')
    root.querySelector<HTMLElement>('[role="button"][aria-label="Expand"]')!.click();
  let properties: HTMLElement | undefined;
  await vi.waitFor(() => {
    properties = Array.from(tree.querySelectorAll<HTMLElement>('[role="treeitem"]'))
      .filter((item) => item.textContent?.includes('properties'))
      .at(-1);
    expect(properties).toBeTruthy();
  });
  if (properties!.getAttribute('aria-expanded') === 'false')
    properties!.querySelector<HTMLElement>('[role="button"][aria-label="Expand"]')!.click();
  let name: HTMLElement | undefined;
  await vi.waitFor(() => {
    name = Array.from(tree.querySelectorAll<HTMLElement>('[role="treeitem"]'))
      .filter((item) => item.textContent?.includes('name'))
      .at(-1);
    expect(name).toBeTruthy();
  });
  name!.querySelector<HTMLButtonElement>('button')!.click();
  await vi.waitFor(() => expect(view.container.textContent).toContain('Resolved recursive detail'));
  expect(onchange.mock.lastCall?.[0].data).toEqual({ properties: { name: { type: 'string' } } });
});
