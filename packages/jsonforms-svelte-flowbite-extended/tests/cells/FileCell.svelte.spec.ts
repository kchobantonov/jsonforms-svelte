import { JsonForms } from '@chobantonov/jsonforms-svelte-extended';
import { flowbiteCells, flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
import { flowbiteExtendedCells, flowbiteExtendedRenderers } from '../../src/lib';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';

afterEach(cleanup);

it('renders multiple-file table cells and exposes local feedback through a compact native popup', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                files: {
                  type: 'array',
                  description: 'Do not repeat this description inside a cell',
                  items: { type: 'string', format: 'byte' },
                },
              },
            },
          },
        },
      },
      uischema: {
        type: 'Control',
        scope: '#/properties/rows',
        options: { table: true, cells: { files: { formatMaximum: 1 } } },
      },
      data: { rows: [{ files: ['YQ=='] }] },
      renderers: [...flowbiteRenderers, ...flowbiteExtendedRenderers],
      cells: [...flowbiteCells, ...flowbiteExtendedCells],
      onchange,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
  expect(input).toBeTruthy();
  expect(input.multiple).toBe(true);
  expect(view.container.textContent).not.toContain('Do not repeat this description');
  const transfer = new DataTransfer();
  transfer.items.add(new File(['large'], 'large.txt'));
  input.files = transfer.files;
  const before = onchange.mock.calls.length;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  let feedback: HTMLButtonElement;
  await vi.waitFor(() => {
    feedback = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label*="size should"]',
    )!;
    expect(feedback).toBeTruthy();
  });
  expect(view.container.querySelector('[role="status"]')).toBeNull();
  expect(input.getAttribute('aria-invalid')).not.toBe('true');
  expect(onchange.mock.calls.length).toBe(before);
  feedback!.focus();
  await vi.waitFor(() => expect(document.body.textContent).toContain('size should be less than'));
  expect(view.container.querySelector('ul')?.classList.contains('max-h-8')).toBe(true);
});
