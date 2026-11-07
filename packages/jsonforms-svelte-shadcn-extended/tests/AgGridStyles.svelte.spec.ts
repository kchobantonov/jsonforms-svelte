import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnCells, shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
import { shadcnExtendedCells, shadcnExtendedRenderers } from '../src/lib';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import './test.css';

afterEach(cleanup);

it('shares one grid stylesheet per ShadowRoot and removes only its owned style', async () => {
  const host = document.createElement('div');
  const shadow = host.attachShadow({ mode: 'open' });
  const firstTarget = document.createElement('div');
  const secondTarget = document.createElement('div');
  shadow.append(firstTarget, secondTarget);
  document.body.append(host);
  const props = {
    schema: {
      type: 'array',
      items: { type: 'object', properties: { name: { type: 'string' } } },
    },
    data: [{ name: 'Ada' }],
    uischema: { type: 'Control', scope: '#', options: { variant: 'ag-grid' } },
    renderers: [...shadcnExtendedRenderers, ...shadcnRenderers],
    cells: [...shadcnExtendedCells, ...shadcnCells],
  };
  const styleId = '#jsonforms-shadcn-ag-grid-runtime-styles';
  const first = await render(JsonForms, { target: firstTarget, props });
  let second: Awaited<ReturnType<typeof render>> | undefined;
  try {
    second = await render(JsonForms, { target: secondTarget, props });
    await vi.waitFor(() => expect(shadow.querySelectorAll('.ag-root')).toHaveLength(2));
    expect(shadow.querySelectorAll(styleId)).toHaveLength(1);
    await first.unmount();
    expect(shadow.querySelectorAll(styleId)).toHaveLength(1);
    await second.unmount();
    second = undefined;
    expect(shadow.querySelectorAll(styleId)).toHaveLength(0);

    const hostStyle = document.createElement('style');
    hostStyle.id = styleId.slice(1);
    shadow.prepend(hostStyle);
    const hostStyled = await render(JsonForms, { target: firstTarget, props });
    try {
      await vi.waitFor(() => expect(shadow.querySelectorAll('.ag-root')).toHaveLength(1));
      expect(shadow.querySelectorAll(styleId)).toHaveLength(1);
    } finally {
      await hostStyled.unmount();
    }
    expect(shadow.querySelector(styleId)).toBe(hostStyle);
  } finally {
    if (second) await second.unmount();
    host.remove();
  }
});
