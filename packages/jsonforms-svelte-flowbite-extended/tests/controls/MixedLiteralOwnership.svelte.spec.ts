import { JsonForms, type JsonFormsValidityEvent } from '@chobantonov/jsonforms-svelte';
import { flowbiteRenderers, flowbiteCells } from '@chobantonov/jsonforms-svelte-flowbite';
import { flowbiteExtendedRenderers, flowbiteExtendedCells } from '../../src/lib';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import type { JsonSchema } from '@jsonforms/core';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';

afterEach(cleanup);
it.each(
  (['en', 'bg'] as const).flatMap((locale) =>
    ['a.b', '', 'a.b/c~d'].map((key) => ({ locale, key })),
  ),
)(
  'publishes selected mixed literal $key errors to its parent in $locale',
  async ({ locale, key }) => {
    const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
    const changes = vi.fn();
    const host = {
      instancePath: '/value/' + key.replaceAll('~', '~0').replaceAll('/', '~1'),
      keyword: 'server',
      schemaPath: '',
      params: {},
      message: 'Host error at literal node',
    };
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'object',
          properties: {
            value: {
              type: ['object', 'null'],
              additionalProperties: { type: 'string', format: 'byte' },
            },
          },
        } as JsonSchema,
        uischema: { type: 'Control', scope: '#/properties/value' },
        data: { value: { [key]: '', neighbor: '' }, sibling: 'keep' },
        config: { formatMaximum: 2, restrict: false },
        i18n: { locale },
        renderers: [...flowbiteExtendedRenderers, ...flowbiteRenderers],
        cells: [...flowbiteExtendedCells, ...flowbiteCells],
        additionalErrors: [host],
        onvaliditychange: validity,
        onchange: changes,
      },
    });
    const toggle = [...view.container.querySelectorAll<HTMLButtonElement>('button')].find(
      (node) => node.title === messages[locale]['mixed.showPrimitives'],
    );
    expect(toggle).toBeTruthy();
    toggle!.click();
    const search = view.container.querySelector<HTMLInputElement>(
      `input[placeholder="${messages[locale]['mixed.searchTree']}"]`,
    )!;
    search.value = key || '""';
    search.dispatchEvent(new InputEvent('input', { bubbles: true }));
    const row = () =>
      [...view.container.querySelectorAll<HTMLElement>('[role="treeitem"]')]
        .filter((node) => node.textContent?.includes(key || '""'))
        .at(-1);
    await vi.waitFor(() =>
      expect(view.container.querySelectorAll('[role="treeitem"]').length).toBeGreaterThan(1),
    );
    await vi.waitFor(() => expect(row()).toBeTruthy());
    row()!.querySelector<HTMLButtonElement>(':scope > button')!.click();
    const detail = () =>
      view.container.querySelector<HTMLElement>(
        `nav[aria-label="${messages[locale]['mixed.navigationPath']}"]`,
      )?.parentElement;
    await vi.waitFor(() =>
      expect(detail()?.querySelectorAll('[data-file-control]')).toHaveLength(1),
    );
    const input = detail()!.querySelector<HTMLInputElement>(
      '[data-file-control] input[type="file"]',
    )!;
    const transfer = new DataTransfer();
    transfer.items.add(new File(['hello'], 'large.txt'));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(() =>
      expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([
        host,
        expect.objectContaining({
          keyword: 'fileSize',
          instancePath: '/value/' + key.replaceAll('~', '~0').replaceAll('/', '~1'),
        }),
      ]),
    );
    expect(validity.mock.calls.some(([event]) => event.pending)).toBe(true);
    expect(changes.mock.lastCall?.[0].data).toEqual({
      value: { [key]: 'aGVsbG8=', neighbor: '' },
      sibling: 'keep',
    });
    expect(detail()?.textContent).toContain(host.message);
    await view.rerender({ data: { value: { neighbor: '' }, sibling: 'keep' } });
    await vi.waitFor(() => expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([host]));
    expect(input.isConnected).toBe(false);
  },
);
