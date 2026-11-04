import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { tick } from 'svelte';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { flowbiteRenderers, flowbiteCells } from '../../src/lib';
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
          renderers: flowbiteRenderers,
          cells: flowbiteCells,
          onchange,
        },
      });
      const buttons = (label: string) =>
        [...view.container.querySelectorAll<HTMLButtonElement>('button')].filter(
          (button) => button.getAttribute('aria-label') === label,
        );
      const removals = (): HTMLElement[] =>
        kind === 'table'
          ? [
              ...view.container.querySelectorAll<HTMLInputElement>(
                'tbody [data-row-selection] input[type="checkbox"]',
              ),
            ]
          : buttons(messages.en['array.removeAriaLabel']);
      const original = removals();
      expect(original).toHaveLength(2);
      if (action === 'move') {
        buttons(messages.en['array.downAriaLabel'])[0].click();
        await vi.waitFor(() =>
          expect(removals().map((button, index) => button === original[1 - index])).toEqual([
            true,
            true,
          ]),
        );
        expect(onchange.mock.lastCall?.[0].data).toEqual(data);
      } else if (action === 'delete') {
        original[0].click();
        if (kind === 'table') {
          await tick();
          view.container.querySelector<HTMLButtonElement>('[data-delete-selected]')!.click();
        }
        await vi.waitFor(() =>
          expect(removals().length === 1 && removals()[0] === original[1]).toBe(true),
        );
        expect(onchange.mock.lastCall?.[0].data).toEqual({
          rows: [{ text: 'same' }],
          sibling: 'keep',
        });
      } else if (action === 'replacement') {
        await view.rerender({
          data: { rows: [{ text: 'same' }, { text: 'same' }], sibling: 'external' },
        });
        await vi.waitFor(() => expect(removals()[0]).not.toBe(original[0]));
        expect(removals()).toHaveLength(2);
        expect(original.every((button) => !button.isConnected)).toBe(true);
      } else {
        const current = onchange.mock.lastCall![0].data;
        await view.rerender({ data: { rows: [current.rows[1]], sibling: 'keep' } });
        await vi.waitFor(() =>
          expect(removals().length === 1 && removals()[0] === original[1]).toBe(true),
        );
      }
    },
  );
}

it('updates table action accessible names when the locale changes', async () => {
  const view = await render(JsonForms, {
    props: {
      data: { rows: [{ text: 'Ada' }, { text: 'Bea' }] },
      schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: { type: 'object', properties: { text: { type: 'string' } } },
          },
        },
      } as JsonSchema,
      uischema: {
        type: 'Control',
        scope: '#/properties/rows',
        options: { table: true, showSortButtons: true },
      },
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
      i18n: { locale: 'en' },
    },
  });
  const moveDown = () =>
    view.container.querySelector<HTMLButtonElement>(
      `button[aria-label="${messages.en['array.downAriaLabel']}"]`,
    );
  await vi.waitFor(() => expect(moveDown()).not.toBeNull());
  expect(
    view.container.querySelector(
      `button[aria-label="${messages.en['collection.deleteSelected']}"]`,
    ),
  ).not.toBeNull();
  await view.rerender({ i18n: { locale: 'bg' } });
  await vi.waitFor(() =>
    expect(
      view.container.querySelector<HTMLButtonElement>(
        `button[aria-label="${messages.bg['array.downAriaLabel']}"]`,
      ),
    ).not.toBeNull(),
  );
  expect(
    view.container.querySelector(
      `button[aria-label="${messages.bg['collection.deleteSelected']}"]`,
    ),
  ).not.toBeNull();
});
