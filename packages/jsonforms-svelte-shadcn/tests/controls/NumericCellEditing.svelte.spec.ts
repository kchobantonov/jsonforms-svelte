import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import type { JsonSchema7 } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { shadcnRenderers, shadcnCells } from '../../src/lib';

afterEach(cleanup);

it('keeps a numeric table cell focused and scopes invalid feedback to its row', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            quantity: { type: 'integer', minimum: 2 },
            other: { type: 'string' },
          },
        },
      },
      data: [
        { quantity: 3, other: 'first' },
        { quantity: 4, other: 'second' },
      ],
      uischema: { type: 'Control', scope: '#', options: { table: true } },
      config: { restrict: false },
      renderers: shadcnRenderers,
      cells: shadcnCells,
      onchange,
    },
  });
  const inputs = view.container.querySelectorAll<HTMLInputElement>('tbody input[type="number"]');
  expect(inputs).toHaveLength(2);
  const first = inputs[0]!;
  first.focus();
  first.value = '1';
  first.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([
      { quantity: 1, other: 'first' },
      { quantity: 4, other: 'second' },
    ]),
  );
  await vi.waitFor(() =>
    expect(first.closest('td')?.querySelector('.cell-invalid')).not.toBeNull(),
  );
  expect(inputs[1]!.closest('td')?.querySelector('.cell-invalid')).toBeNull();
  expect(first.closest('td')?.querySelector('label')).toBeNull();
  expect(document.activeElement).toBe(first);
  expect(first.isConnected).toBe(true);
  first.value = '3';
  first.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data[0].quantity).toBe(3));
  await vi.waitFor(() => expect(first.closest('td')?.querySelector('.cell-invalid')).toBeNull());
  expect(document.activeElement).toBe(first);
});

it('keeps an out-of-range date cell focused and scopes its error to the edited row', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date', formatMaximum: '2026-10-31' } as JsonSchema7,
            other: { type: 'string' },
          },
        },
      },
      data: [
        { date: '2026-10-14', other: 'first' },
        { date: '2026-10-15', other: 'second' },
      ],
      uischema: { type: 'Control', scope: '#', options: { table: true } },
      config: { restrict: false, mask: false, dateFormat: 'YYYY-MM-DD' },
      renderers: shadcnRenderers,
      cells: shadcnCells,
      onchange,
    },
  });
  const rows = view.container.querySelectorAll<HTMLTableRowElement>('tbody tr');
  expect(rows).toHaveLength(2);
  const input = rows[0]!.querySelector<HTMLInputElement>('input[type="text"]')!;
  expect(input.value).toBe('2026-10-14');
  input.focus();
  input.value = '2026-12-24';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data[0].date).toBe('2026-12-24'));
  await vi.waitFor(() => expect(rows[0]!.querySelector('.cell-invalid')).not.toBeNull());
  expect(rows[1]!.querySelector('.cell-invalid')).toBeNull();
  expect(rows[0]!.querySelector('label')).toBeNull();
  expect(document.activeElement).toBe(input);
  expect(input.isConnected).toBe(true);

  input.value = '2026-10-24';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data[0].date).toBe('2026-10-24'));
  await vi.waitFor(() => expect(rows[0]!.querySelector('.cell-invalid')).toBeNull());
  expect(document.activeElement).toBe(input);
  expect(rows[1]!.querySelector<HTMLInputElement>('input[type="text"]')?.value).toBe('2026-10-15');
});

it('keeps an out-of-range time cell focused and scopes its error to the edited row', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            time: { type: 'string', format: 'time', formatMaximum: '17:00:00Z' } as JsonSchema7,
            other: { type: 'string' },
          },
        },
      },
      data: [
        { time: '10:00:00Z', other: 'first' },
        { time: '11:00:00Z', other: 'second' },
      ],
      uischema: { type: 'Control', scope: '#', options: { table: true } },
      config: { restrict: false, mask: false, timeFormat: 'HH:mm:ss' },
      renderers: shadcnRenderers,
      cells: shadcnCells,
      onchange,
    },
  });
  const rows = view.container.querySelectorAll<HTMLTableRowElement>('tbody tr');
  expect(rows).toHaveLength(2);
  const input = rows[0]!.querySelector<HTMLInputElement>('input[type="text"]')!;
  const sibling = rows[1]!.querySelector<HTMLInputElement>('input[type="text"]')!;
  const siblingDisplay = sibling.value;
  input.focus();
  input.value = '18:00:00';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data[0].time).toMatch(/^18:00:00/));
  await vi.waitFor(() => expect(rows[0]!.querySelector('.cell-invalid')).not.toBeNull());
  expect(rows[1]!.querySelector('.cell-invalid')).toBeNull();
  expect(rows[0]!.querySelector('label')).toBeNull();
  expect(document.activeElement).toBe(input);
  expect(input.isConnected).toBe(true);

  input.value = '10:00:00';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data[0].time).toMatch(/^10:00:00/));
  await vi.waitFor(() => expect(rows[0]!.querySelector('.cell-invalid')).toBeNull());
  expect(document.activeElement).toBe(input);
  expect(sibling.value).toBe(siblingDisplay);
  expect(onchange.mock.lastCall?.[0].data[1].time).toBe('11:00:00Z');
});

it('keeps an out-of-range date-time cell focused and scopes its error to the edited row', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            slot: {
              type: 'string',
              format: 'date-time',
              formatMaximum: '2026-10-31T17:00:00Z',
            } as JsonSchema7,
            other: { type: 'string' },
          },
        },
      },
      data: [
        { slot: '2026-10-14T10:00:00Z', other: 'first' },
        { slot: '2026-10-15T11:00:00Z', other: 'second' },
      ],
      uischema: { type: 'Control', scope: '#', options: { table: true } },
      config: { restrict: false, mask: false, dateTimeFormat: 'YYYY-MM-DD HH:mm:ss' },
      renderers: shadcnRenderers,
      cells: shadcnCells,
      onchange,
    },
  });
  const rows = view.container.querySelectorAll<HTMLTableRowElement>('tbody tr');
  expect(rows).toHaveLength(2);
  const input = rows[0]!.querySelector<HTMLInputElement>('input[type="text"]')!;
  const sibling = rows[1]!.querySelector<HTMLInputElement>('input[type="text"]')!;
  const siblingDisplay = sibling.value;
  input.focus();
  input.value = '2026-12-24 10:00:00';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data[0].slot).toMatch(/^2026-12-24T/));
  await vi.waitFor(() => expect(rows[0]!.querySelector('.cell-invalid')).not.toBeNull());
  expect(rows[1]!.querySelector('.cell-invalid')).toBeNull();
  expect(rows[0]!.querySelector('label')).toBeNull();
  expect(document.activeElement).toBe(input);
  expect(input.isConnected).toBe(true);

  input.value = '2026-10-24 10:00:00';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data[0].slot).toMatch(/^2026-10-24T/));
  await vi.waitFor(() => expect(rows[0]!.querySelector('.cell-invalid')).toBeNull());
  expect(document.activeElement).toBe(input);
  expect(sibling.value).toBe(siblingDisplay);
  expect(onchange.mock.lastCall?.[0].data[1].slot).toBe('2026-10-15T11:00:00Z');
});
