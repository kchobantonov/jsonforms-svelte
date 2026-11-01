import {
  JsonForms,
  type JsonFormsValidityEvent,
  type useJsonFormsArrayControl,
} from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import MonacoCollection from './fixtures/MonacoCollection.svelte';
import MonacoDraftRenderer from './fixtures/MonacoDraftRenderer.svelte';
import type { useMonacoDraft } from '../src/lib/core/monacoDraft.svelte';

afterEach(cleanup);
for (const kind of ['object', 'primitive']) {
  it.each(
    ['remove-earlier', 'move', 'remove-owner', 'replace'].flatMap((operation) =>
      [true, false].map((withHost) => ({ operation, withHost })),
    ),
  )(
    `tracks ${kind} diagnostic ownership through $operation (host: $withHost)`,
    async ({ operation, withHost }) => {
      const drafts: ReturnType<typeof useMonacoDraft>[] = [];
      let array: ReturnType<typeof useJsonFormsArrayControl>;
      const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
      const host = {
        keyword: 'server',
        instancePath: '/host',
        schemaPath: '',
        params: {},
        message: 'Keep host error',
      };
      const hostErrors = withHost ? [host] : [];
      const view = await render(JsonForms, {
        props: {
          data: kind === 'object' ? [{ value: 'same' }, { value: 'same' }] : ['same', 'same'],
          schema: { type: 'array', items: { type: kind === 'object' ? 'object' : 'string' } },
          uischema: {
            type: 'Control',
            scope: '#',
            options: {
              convertJson: kind === 'object',
              propagateErrors: true,
              capture: ({ draft }: { draft: ReturnType<typeof useMonacoDraft> }) =>
                drafts.push(draft),
              captureArray: (binding: typeof array) => {
                array = binding;
              },
            },
          },
          renderers: [
            {
              tester: (_ui, schema) => (schema.type === 'array' ? 100 : -1),
              renderer: MonacoCollection,
            },
            { tester: () => 10, renderer: MonacoDraftRenderer },
          ],
          additionalErrors: hostErrors,
          onvaliditychange: validity,
        },
      });
      await vi.waitFor(() => expect(drafts).toHaveLength(2));
      const owner = drafts[1];
      if (kind === 'object') owner.update('{ incomplete');
      else owner.updateDiagnostics(1);
      await vi.waitFor(() =>
        expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([
          ...hostErrors,
          expect.objectContaining({ instancePath: '/1', keyword: 'editor' }),
        ]),
      );
      validity.mockClear();
      if (operation === 'remove-earlier') array!.removeItems!('', [0])();
      else if (operation === 'move') array!.moveUp!('', 1)();
      else if (operation === 'remove-owner') array!.removeItems!('', [1])();
      else
        await view.rerender({
          data: kind === 'object' ? [{ value: 'replacement' }] : ['replacement'],
        });
      if (operation === 'move' || operation === 'remove-earlier') {
        await vi.waitFor(() =>
          expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([
            ...hostErrors,
            expect.objectContaining({ instancePath: '/0', keyword: 'editor' }),
          ]),
        );
        expect(drafts).toHaveLength(2);
        if (kind === 'object') expect(owner.text).toBe('{ incomplete');
      } else {
        await vi.waitFor(() =>
          expect(validity.mock.lastCall?.[0].additionalErrors).toEqual(hostErrors),
        );
        owner.updateDiagnostics(4);
        await vi.waitFor(() =>
          expect(validity.mock.lastCall?.[0].additionalErrors).toEqual(hostErrors),
        );
      }
      if (operation === 'move' || operation === 'remove-earlier') {
        expect(validity.mock.calls.every(([event]) => !event.valid)).toBe(true);
        expect(validity.mock.calls.some(([event]) => event.pending)).toBe(true);
        expect(
          validity.mock.calls.every(
            ([event]) =>
              event.pending ||
              event.additionalErrors
                .filter((error) => error.keyword === 'editor')
                .every((error) => error.instancePath === '/0'),
          ),
        ).toBe(true);
      }
    },
  );
}
