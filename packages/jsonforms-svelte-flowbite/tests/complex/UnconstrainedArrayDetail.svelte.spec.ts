import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { flowbiteRenderers, flowbiteCells } from '../../src/lib';
import type { JsonSchema } from '@jsonforms/core';

afterEach(cleanup);
it('edits an unconstrained mixed array item without reusing the root UI schema', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'object', properties: { value: { type: ['array', 'null'] } } } as JsonSchema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Label', text: 'Root-only marker' },
          {
            type: 'Control',
            scope: '#/properties/value',
            options: { structuredLayout: 'nested', collapsed: false },
          },
        ],
      },
      data: { value: ['before', 'keep'], sibling: 'keep' },
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
      onchange,
    },
  });
  let input: HTMLInputElement | undefined;
  await expect
    .poll(() => {
      input = [...view.container.querySelectorAll<HTMLInputElement>('input')].find(
        (node) => node.value === 'before',
      );
      return !!input;
    })
    .toBe(true);
  expect(view.container.textContent?.split('Root-only marker').length).toBe(2);
  input!.value = 'edited';
  input!.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data)
    .toEqual({ value: ['edited', 'keep'], sibling: 'keep' });
});
