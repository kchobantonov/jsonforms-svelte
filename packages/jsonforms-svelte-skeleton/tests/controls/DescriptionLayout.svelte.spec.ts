import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonCells, skeletonRenderers } from '../../src/lib';
import { render, cleanup } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
afterEach(cleanup);
it('keeps the next checkbox under the pointer when descriptions hide on blur', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          first: {
            type: 'boolean',
            title: 'First',
            description: 'Description shown while the first checkbox has focus.',
          },
          second: {
            type: 'boolean',
            title: 'Second',
            description: 'Description for the second checkbox.',
          },
        },
      },
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/first' },
          { type: 'Control', scope: '#/properties/second' },
        ],
      },
      data: { first: false, second: false },
      config: { showUnfocusedDescription: false },
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  const second = page.getByRole('checkbox', { name: 'Second', exact: true });
  const top = second.element().getBoundingClientRect().top;
  await page.getByRole('checkbox', { name: 'First', exact: true }).click();
  expect(second.element().getBoundingClientRect().top).toBe(top);
  await second.click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.second).toBe(true));
  expect(second.element().getBoundingClientRect().top).toBe(top);
});
