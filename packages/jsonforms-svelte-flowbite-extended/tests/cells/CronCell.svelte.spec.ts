import { JsonForms } from '@chobantonov/jsonforms-svelte-extended';
import { flowbiteCells, flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { flowbiteExtendedCells, flowbiteExtendedRenderers } from '../../src/lib';
import '../test.css';

afterEach(cleanup);

it('keeps cron table cells compact and edits the selected row', async () => {
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
                schedule: {
                  type: 'string',
                  format: 'cron',
                  description: 'Do not repeat this description inside a cell',
                },
              },
            },
          },
        },
      },
      uischema: { type: 'Control', scope: '#/properties/rows', options: { table: true } },
      data: { rows: [{ schedule: '0 0 9 * * *' }, { schedule: '0 0 10 * * *' }] },
      renderers: [...flowbiteRenderers, ...flowbiteExtendedRenderers],
      cells: [...flowbiteCells, ...flowbiteExtendedCells],
      onchange,
    },
  });

  const inputs = view.container.querySelectorAll<HTMLInputElement>('[data-cron-input] input');
  expect(inputs).toHaveLength(2);
  expect(inputs[0].value).toBe('0 0 9 * * *');
  expect(view.container.textContent).not.toContain('Do not repeat this description');
  expect(view.container.querySelectorAll('button[aria-label="Choose a schedule"]')).toHaveLength(2);

  inputs[0].value = '0 0 11 * * *';
  inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.calls.at(-1)?.[0].data.rows).toEqual([
      { schedule: '0 0 11 * * *' },
      { schedule: '0 0 10 * * *' },
    ]),
  );

  inputs[0].focus();
  expect(document.activeElement).toBe(inputs[0]);
  await vi.waitFor(() => {
    const help = view.container.querySelector<HTMLElement>('[id$="-help"]')!;
    expect(help.textContent).toContain('Do not repeat this description inside a cell');
    expect(help.classList.contains('sr-only')).toBe(true);
    expect(inputs[0].getAttribute('aria-describedby')?.split(' ')).toContain(help.id);
  });
  inputs[0].value = 'not a cron expression';
  inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
  await vi.waitFor(() => expect(inputs[0].getAttribute('aria-invalid')).toBe('true'));
  const help = view.container.querySelector<HTMLElement>('[id$="-help"]')!;
  expect(help.textContent).not.toContain('Do not repeat this description inside a cell');
  expect(help.textContent?.trim()).toBeTruthy();
  expect(inputs[0].getAttribute('aria-describedby')?.split(' ')).toContain(help.id);
  expect(inputs[1].getAttribute('aria-invalid')).not.toBe('true');
  expect(view.container.textContent).not.toContain('Do not repeat this description');
});
