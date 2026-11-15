import { JsonForms, type JsonFormsValidityEvent } from '@chobantonov/jsonforms-svelte';
import { flowbiteRenderers, flowbiteCells } from '@chobantonov/jsonforms-svelte-flowbite';
import { flowbiteExtendedRenderers, flowbiteExtendedCells } from '../../src/lib';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';

afterEach(cleanup);
it.each([
  { key: 'a.b', nested: false },
  { key: '', nested: false },
  { key: 'a/b~c', nested: false },
  { key: 'inner/name', nested: true },
])(
  'publishes additional-property file ownership at the literal key %j',
  async ({ key, nested }) => {
    const bag = (value: unknown) => (nested ? { 'outer.key': { [key]: value } } : { [key]: value });
    const pointer =
      '/bag/' + (nested ? 'outer.key/' : '') + key.replaceAll('~', '~0').replaceAll('/', '~1');
    const fileSchema = { type: 'string', format: 'byte' };
    const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
    const changes = vi.fn();
    const host = {
      instancePath: '/server',
      keyword: 'server',
      schemaPath: '',
      params: {},
      message: 'Keep server error',
    };
    const targetHost = { ...host, instancePath: pointer, message: 'Server attachment error' };
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'object',
          properties: {
            bag: {
              type: 'object',
              additionalProperties: nested
                ? { type: 'object', additionalProperties: fileSchema }
                : fileSchema,
            },
          },
        },
        uischema: { type: 'Control', scope: '#/properties/bag' },
        data: { bag: bag(''), sibling: 'keep' },
        config: { formatMaximum: 2, restrict: false, allowEmptyPropertyNames: true },
        renderers: [...flowbiteExtendedRenderers, ...flowbiteRenderers],
        cells: [...flowbiteExtendedCells, ...flowbiteCells],
        additionalErrors: [host, targetHost],
        onvaliditychange: validity,
        onchange: changes,
      },
    });
    const input = view.container.querySelector<HTMLInputElement>(
      '[data-file-control] input[type="file"]',
    )!;
    expect(input).toBeTruthy();
    expect(view.container.textContent).toContain('Server attachment error');
    const transfer = new DataTransfer();
    transfer.items.add(new File(['hello'], 'large.txt'));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(() =>
      expect(changes.mock.lastCall?.[0].data).toEqual({
        bag: bag('aGVsbG8='),
        sibling: 'keep',
      }),
    );
    await vi.waitFor(() =>
      expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([
        host,
        targetHost,
        expect.objectContaining({ keyword: 'fileSize', instancePath: pointer }),
      ]),
    );
    expect(validity.mock.calls.some(([event]) => event.pending)).toBe(true);
    expect(validity.mock.lastCall?.[0].valid).toBe(false);
    const clear = view.container.querySelector<HTMLButtonElement>(
      '[data-file-control] button[aria-label="Clear value"]',
    )!;
    expect(clear).toBeTruthy();
    clear.click();
    await vi.waitFor(() =>
      expect(changes.mock.lastCall?.[0].data).toEqual({ bag: bag(''), sibling: 'keep' }),
    );
    await vi.waitFor(() =>
      expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([host, targetHost]),
    );
    await view.rerender({ data: { bag: {}, sibling: 'keep' } });
    await vi.waitFor(() =>
      expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([host, targetHost]),
    );
  },
);
