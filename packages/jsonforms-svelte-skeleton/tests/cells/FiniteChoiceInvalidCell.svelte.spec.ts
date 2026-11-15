import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { skeletonCells, skeletonRenderers } from '../../src/lib';

afterEach(cleanup);

it('keeps invalid finite choice cell values visible without replacing row data', async () => {
  const data = [{ choice: 'outside', named: 'unknown' }];
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            choice: { type: 'string', enum: ['A', 'B'] },
            named: {
              type: 'string',
              oneOf: [
                { const: 'X', title: 'X' },
                { const: 'Y', title: 'Y' },
              ],
            },
          },
        },
      },
      uischema: { type: 'Control', scope: '#', options: { table: true } },
      data,
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  const statuses = [
    ...view.container.querySelectorAll<HTMLElement>('tbody [id$="-invalid-value"]'),
  ];
  await vi.waitFor(() => expect(statuses).toHaveLength(2));
  expect(statuses.map((status) => status.textContent)).toEqual([
    expect.stringContaining('"outside"'),
    expect.stringContaining('"unknown"'),
  ]);
  for (const status of statuses) {
    const cell = status.closest('td');
    expect(cell).not.toBeNull();
    expect(
      [...cell!.querySelectorAll<HTMLElement>('[aria-describedby]')].some((element) =>
        element.getAttribute('aria-describedby')?.split(' ').includes(status.id),
      ),
    ).toBe(true);
  }
  expect(onchange.mock.lastCall?.[0].data).toEqual(data);
});
