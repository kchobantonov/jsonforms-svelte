import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { shadcnRenderers, shadcnCells } from '../../src/lib';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';

afterEach(cleanup);
for (const kind of ['object', 'primitive']) {
  for (const locale of ['en', 'bg'] as const) {
    it.each([
      'move',
      'remove-earlier',
      'remove-owner',
      'replacement',
      'external-reference',
      'edit',
      'append',
    ])(`tracks selected ${kind} list occurrence in ${locale} through %s`, async (operation) => {
      const rows = kind === 'object' ? [{ text: 'same' }, { text: 'same' }] : ['same', 'same'];
      const onchange = vi.fn();
      const view = await render(JsonForms, {
        props: {
          data: { rows, sibling: 'keep' },
          schema: {
            type: 'object',
            properties: {
              rows: {
                type: 'array',
                items:
                  kind === 'object'
                    ? {
                        type: 'object',
                        properties: { text: { type: 'string' } },
                      }
                    : { type: 'string' },
              },
            },
          } as JsonSchema,
          uischema: {
            type: 'ListWithDetail',
            scope: '#/properties/rows',
            options: {
              confirmation: { delete: 'never' },
              showSortButtons: true,
            },
          } as UISchemaElement,
          i18n: { locale },
          renderers: shadcnRenderers,
          cells: shadcnCells,
          onchange,
        },
      });
      const items = () => [
        ...view.container.querySelectorAll<HTMLElement>('[role="option"], button[aria-current]'),
      ];
      items()[1].click();
      await vi.waitFor(() =>
        expect(view.container.querySelector('input[type="text"]')).not.toBeNull(),
      );
      const editor = view.container.querySelector<HTMLInputElement>('input[type="text"]')!;
      expect(editor.value).toBe('same');
      const command = (action: 'up' | 'remove' | 'add', index: number) => {
        const label =
          action === 'add'
            ? messages[locale]['array.addAriaLabelWithLabel'].replace('{label}', 'Rows')
            : messages[locale][`array.${action}AriaLabel`];
        const buttons = [...view.container.querySelectorAll<HTMLButtonElement>('button')].filter(
          (button) => button.getAttribute('aria-label') === label,
        );
        expect(buttons[index]).toBeTruthy();
        buttons[index].click();
      };
      if (operation === 'move') command('up', 1);
      else if (operation === 'remove-earlier') command('remove', 0);
      else if (operation === 'remove-owner') command('remove', 1);
      else if (operation === 'append') command('add', 0);
      else if (operation === 'edit') {
        editor.value = 'edited';
        editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
        editor.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      } else if (operation === 'replacement') {
        await view.rerender({
          data: {
            rows: kind === 'object' ? [{ text: 'same' }, { text: 'same' }] : ['same', 'same'],
            sibling: 'external',
          },
        });
      } else {
        const current = onchange.mock.lastCall![0].data;
        await view.rerender({ data: { rows: [current.rows[1]], sibling: 'keep' } });
      }
      const cleared =
        operation === 'remove-owner' ||
        operation === 'replacement' ||
        (operation === 'external-reference' && kind === 'primitive');
      if (cleared) {
        await vi.waitFor(() => expect(editor.isConnected).toBe(false));
        expect(view.container.querySelector('input[type="text"]')).toBeNull();
        if (operation === 'remove-owner') {
          await view.rerender({ data: { rows, sibling: 'keep' } });
          expect(view.container.querySelector('input[type="text"]')).toBeNull();
        }
        expect(
          items().some(
            (item) =>
              item.getAttribute('aria-selected') === 'true' ||
              item.getAttribute('aria-current') === 'true',
          ),
        ).toBe(false);
      } else {
        const expectedIndex = ['move', 'remove-earlier', 'external-reference'].includes(operation)
          ? 0
          : 1;
        await vi.waitFor(() => {
          const item = items()[expectedIndex];
          expect(
            item?.getAttribute('aria-selected') === 'true' ||
              item?.getAttribute('aria-current') === 'true',
          ).toBe(true);
        });
        expect(view.container.querySelector('input[type="text"]')).toBe(editor);
        if (operation === 'edit')
          await vi.waitFor(() =>
            expect(onchange.mock.lastCall?.[0].data.rows[1]).toEqual(
              kind === 'object' ? { text: 'edited' } : 'edited',
            ),
          );
        if (operation === 'append')
          await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.rows).toHaveLength(3));
      }
      expect(onchange.mock.lastCall?.[0].data.sibling).toBe(
        operation === 'replacement' ? 'external' : 'keep',
      );
    });
  }
}

it('routes additional-error badges to the exact list row, not an index prefix', async () => {
  const error = {
    keyword: 'server',
    instancePath: '/rows/10/text',
    schemaPath: '',
    params: {},
    message: 'Row error',
  };
  const view = await render(JsonForms, {
    props: {
      data: { rows: Array.from({ length: 11 }, () => ({ text: 'same' })) },
      schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: { type: 'object', properties: { text: { type: 'string' } } },
          },
        },
      } as JsonSchema,
      uischema: { type: 'ListWithDetail', scope: '#/properties/rows' } as UISchemaElement,
      renderers: shadcnRenderers,
      cells: shadcnCells,
      additionalErrors: [error],
    },
  });
  const items = () => [
    ...view.container.querySelectorAll<HTMLElement>('[role="option"], button[aria-current]'),
  ];
  expect(items()).toHaveLength(11);
  expect(items()[1].querySelector('[data-list-item-errors]')).toBeNull();
  expect(items()[10].querySelector('[data-list-item-errors]')).not.toBeNull();
  await view.rerender({ additionalErrors: [{ ...error, instancePath: '/rows/1/text' }] });
  await vi.waitFor(() =>
    expect(items()[1].querySelector('[data-list-item-errors]')).not.toBeNull(),
  );
  expect(items()[10].querySelector('[data-list-item-errors]')).toBeNull();
});
