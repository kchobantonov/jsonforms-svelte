import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { shadcnRenderers, shadcnCells } from '../../src/lib';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import type { JsonSchema } from '@jsonforms/core';

afterEach(cleanup);
for (const kind of ['table', 'layout']) {
  it.each(['move', 'delete', 'replacement', 'external-reference'])(
    `retains only established ${kind} row occurrences through %s`,
    async (action) => {
      const data = { rows: [{ text: 'same' }, { text: 'same' }], sibling: 'keep' };
      const onchange = vi.fn();
      const view = await render(JsonForms, {
        props: {
          data,
          schema: {
            type: 'object',
            properties: {
              rows: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { text: { type: 'string' } },
                },
              },
            },
          } as JsonSchema,
          uischema: {
            type: 'Control',
            scope: '#/properties/rows',
            options: {
              ...(kind === 'layout' ? { detail: 'GENERATED' } : {}),
              confirmation: { delete: 'never' },
              showSortButtons: true,
            },
          },
          renderers: shadcnRenderers,
          cells: shadcnCells,
          onchange,
        },
      });
      const buttons = (label: string) =>
        [...view.container.querySelectorAll<HTMLButtonElement>('button')].filter(
          (button) => button.getAttribute('aria-label') === label,
        );
      const removals = () => buttons(messages.en['array.removeAriaLabel']);
      const occurrences = () =>
        kind === 'table'
          ? [...view.container.querySelectorAll<HTMLElement>('[data-array-row-index]')]
          : removals();
      const original = occurrences();
      expect(original).toHaveLength(2);
      if (action === 'move') {
        buttons(messages.en['array.downAriaLabel'])[0].click();
        await vi.waitFor(() =>
          expect(occurrences().map((element, index) => element === original[1 - index])).toEqual([
            true,
            true,
          ]),
        );
        expect(onchange.mock.lastCall?.[0].data).toEqual(data);
      } else if (action === 'delete') {
        if (kind === 'table') {
          view.container
            .querySelector<HTMLElement>(
              `[aria-label="${messages.en['collection.selectRow'].replace('{index}', '1')}"]`,
            )!
            .click();
          await vi.waitFor(() =>
            expect(
              view.container.querySelector<HTMLButtonElement>('[data-delete-selected]')?.disabled,
            ).toBe(false),
          );
          view.container.querySelector<HTMLButtonElement>('[data-delete-selected]')!.click();
        } else original[0].click();
        await vi.waitFor(() =>
          expect(occurrences().length === 1 && occurrences()[0] === original[1]).toBe(true),
        );
        expect(onchange.mock.lastCall?.[0].data).toEqual({
          rows: [{ text: 'same' }],
          sibling: 'keep',
        });
      } else if (action === 'replacement') {
        await view.rerender({
          data: { rows: [{ text: 'same' }, { text: 'same' }], sibling: 'external' },
        });
        await vi.waitFor(() => expect(occurrences()[0]).not.toBe(original[0]));
        expect(occurrences()).toHaveLength(2);
        expect(original.every((element) => !element.isConnected)).toBe(true);
      } else {
        const current = onchange.mock.lastCall![0].data;
        await view.rerender({ data: { rows: [current.rows[1]], sibling: 'keep' } });
        await vi.waitFor(() =>
          expect(occurrences().length === 1 && occurrences()[0] === original[1]).toBe(true),
        );
      }
    },
  );
}
