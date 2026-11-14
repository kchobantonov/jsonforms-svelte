import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonCells, skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { skeletonExtendedRenderers } from '../src/lib';

afterEach(cleanup);

it('uses flat and local AG Grid height in precedence order', async () => {
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
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: skeletonCells,
    },
  });
  const height = () =>
    view.container.querySelector<HTMLElement>('.jsonforms-ag-grid__body')?.style.height;
  await expect.poll(height).toBe('240px');
  await view.rerender({ uischema: control({ height: '180px' }) });
  await expect.poll(height).toBe('180px');
});
