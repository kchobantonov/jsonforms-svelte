import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnCells, shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { shadcnExtendedRenderers } from '../src/lib';

afterEach(cleanup);

it('uses flat height, local height and legacy local gridHeight in precedence order', async () => {
  const schema = {
    type: 'array',
    items: { type: 'object', properties: { name: { type: 'string' } } },
  } as const;
  const control = (options: Record<string, unknown>) => ({
    type: 'Control',
    scope: '#',
    options: { variant: 'ag-grid', ...options },
  });
  const view = await render(JsonForms, {
    props: {
      schema,
      data: [{ name: 'Ada' }],
      uischema: control({}),
      config: { height: 240, jsonformsExtended: { height: 700 } },
      renderers: [...shadcnRenderers, ...shadcnExtendedRenderers],
      cells: shadcnCells,
    },
  });
  const height = () =>
    view.container.querySelector<HTMLElement>('.jsonforms-ag-grid__body')?.style.height;
  await expect.poll(height).toBe('240px');
  await view.rerender({ uischema: control({ height: '180px' }) });
  await expect.poll(height).toBe('180px');
  await view.rerender({ uischema: control({ gridHeight: '160px' }) });
  await expect.poll(height).toBe('160px');
});
