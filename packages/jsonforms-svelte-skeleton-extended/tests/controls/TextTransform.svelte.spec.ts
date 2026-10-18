import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { createAjv } from '@chobantonov/jsonforms-svelte-extended';
import { skeletonRenderers, skeletonCells } from '@chobantonov/jsonforms-svelte-skeleton';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';

afterEach(cleanup);

for (const cell of [false, true]) {
  it(`reflects validator transforms and subsequent edits in a ${cell ? 'table cell' : 'text control'}`, async () => {
    const property = { type: 'string', transform: ['trim', 'toUpperCase'] };
    const row = { type: 'object', properties: { code: property, other: { type: 'string' } } };
    const onchange = vi.fn();
    const view = render(JsonForms, {
      props: {
        schema: cell ? { type: 'array', items: row } : row,
        data: cell ? [{ code: 'before', other: 'keep' }] : { code: 'before', other: 'keep' },
        uischema: {
          type: 'Control',
          scope: cell ? '#' : '#/properties/code',
          options: { table: cell },
        },
        ajv: createAjv(),
        renderers: skeletonRenderers,
        cells: skeletonCells,
        onchange,
      },
    });
    const input = view.container.querySelector<HTMLInputElement>('input[type="text"]')!;
    const data = () =>
      cell ? onchange.mock.lastCall?.[0].data[0] : onchange.mock.lastCall?.[0].data;
    await vi.waitFor(() => expect(input.value).toBe('BEFORE'));
    input.focus();
    input.value = '  after  ';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));
    await vi.waitFor(() => expect(data()).toEqual({ code: 'AFTER', other: 'keep' }));
    await vi.waitFor(() => expect(input.value).toBe('AFTER'));
    expect(view.container.contains(input)).toBe(true);
    input.value = 'next';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));
    await vi.waitFor(() => expect(data()).toEqual({ code: 'NEXT', other: 'keep' }));
    await vi.waitFor(() => expect(input.value).toBe('NEXT'));
  });
}
