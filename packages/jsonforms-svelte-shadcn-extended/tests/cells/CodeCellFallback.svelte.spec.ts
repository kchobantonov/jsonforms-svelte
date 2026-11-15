import { JsonForms } from '@chobantonov/jsonforms-svelte-extended';
import { shadcnCells, shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { shadcnExtendedCells, shadcnExtendedRenderers } from '../../src/lib';
import '../test.css';

afterEach(cleanup);

it('edits code strings as compact table text without mounting Monaco', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: { script: { type: 'string', description: 'Full editor description' } },
            },
          },
        },
      },
      uischema: { type: 'Control', scope: '#/properties/rows', options: { table: true } },
      data: { rows: [{ script: 'first()' }, { script: 'second()' }] },
      renderers: [...shadcnRenderers, ...shadcnExtendedRenderers],
      cells: [...shadcnCells, ...shadcnExtendedCells],
      onchange,
    },
  });

  const inputs = [...view.container.querySelectorAll<HTMLInputElement>('input')].filter((input) =>
    ['first()', 'second()'].includes(input.value),
  );
  expect(inputs).toHaveLength(2);
  expect(view.container.querySelector('.monaco-editor')).toBeNull();
  expect(view.container.textContent).not.toContain('Full editor description');

  inputs[0].value = 'updated()';
  inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.calls.at(-1)?.[0].data.rows).toEqual([
      { script: 'updated()' },
      { script: 'second()' },
    ]),
  );
});
