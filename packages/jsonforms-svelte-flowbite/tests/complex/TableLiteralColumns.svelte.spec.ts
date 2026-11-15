import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { flowbiteCells, flowbiteRenderers } from '../../src/lib';

afterEach(cleanup);

it('binds empty and escaped column names to their values with translated required headers', async () => {
  const onchange = vi.fn();
  const data = [
    {
      '': 'empty value',
      'a/b~c': 'escaped value',
      'a.b': 'literal dotted',
      a: { b: 'nested value' },
      untouched: 'keep',
    },
  ];
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            '': { type: 'string', title: 'Empty field' },
            'a/b~c': { type: 'string', title: 'Escaped field' },
            'a.b': { type: 'string', title: 'Dotted field' },
            a: { type: 'object', properties: { b: { type: 'string' } } },
            untouched: { type: 'string' },
          },
          required: ['', 'a/b~c', 'a.b'],
        },
      },
      uischema: {
        type: 'Control',
        scope: '#',
        options: { table: true, columnDefs: [{ field: '' }, { field: 'a/b~c' }, { field: 'a.b' }] },
      },
      data,
      i18n: {
        locale: 'bg',
        translate: (key: string, fallback?: string) =>
          fallback === 'Empty field'
            ? 'Празно поле'
            : fallback === 'Escaped field'
              ? 'Екранирано поле'
              : fallback === 'Dotted field'
                ? 'Поле с точка'
                : (fallback ?? key),
      },
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
      onchange,
    },
  });
  const headers = [...view.container.querySelectorAll<HTMLElement>('thead [data-column-field]')];
  await vi.waitFor(() => expect(headers).toHaveLength(3));
  expect(headers.map((header) => header.dataset.columnField)).toEqual(['', 'a/b~c', 'a.b']);
  expect(headers[0].textContent).toContain('Празно поле');
  expect(headers[1].textContent).toContain('Екранирано поле');
  expect(headers[2].textContent).toContain('Поле с точка');
  expect(
    headers.every((header) => header.querySelector('[aria-hidden="true"]')?.textContent === '*'),
  ).toBe(true);
  const inputs = view.container.querySelectorAll<HTMLInputElement>('tbody td input[type="text"]');
  await vi.waitFor(() => expect(inputs).toHaveLength(3));
  expect([...inputs].map((input) => input.value)).toEqual([
    'empty value',
    'escaped value',
    'literal dotted',
  ]);
  inputs[0].value = 'edited empty';
  inputs[0].dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([
      {
        '': 'edited empty',
        'a/b~c': 'escaped value',
        'a.b': 'literal dotted',
        a: { b: 'nested value' },
        untouched: 'keep',
      },
    ]),
  );
  inputs[1].value = 'edited escaped';
  inputs[1].dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([
      {
        '': 'edited empty',
        'a/b~c': 'edited escaped',
        'a.b': 'literal dotted',
        a: { b: 'nested value' },
        untouched: 'keep',
      },
    ]),
  );
  inputs[2].value = 'edited dotted';
  inputs[2].dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([
      {
        '': 'edited empty',
        'a/b~c': 'edited escaped',
        'a.b': 'edited dotted',
        a: { b: 'nested value' },
        untouched: 'keep',
      },
    ]),
  );
});

it('edits an own prototype-looking property without changing the object prototype', async () => {
  const onchange = vi.fn();
  const row = Object.defineProperty({ untouched: 'keep' }, '__proto__', {
    value: 'original',
    enumerable: true,
    configurable: true,
    writable: true,
  });
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            ['__proto__']: { type: 'string', title: 'Prototype member' },
            untouched: { type: 'string' },
          },
        },
      },
      uischema: {
        type: 'Control',
        scope: '#',
        options: { table: true, columnDefs: [{ field: '__proto__' }] },
      },
      data: [row],
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
      onchange,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('tbody td input[type="text"]')!;
  await vi.waitFor(() => expect(input?.value).toBe('original'));
  input.value = 'changed';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data[0].__proto__).toBe('changed'));
  const updated = onchange.mock.lastCall![0].data[0];
  expect(Object.hasOwn(updated, '__proto__')).toBe(true);
  expect(Object.getPrototypeOf(updated)).toBe(Object.prototype);
  expect(updated.untouched).toBe('keep');
});
