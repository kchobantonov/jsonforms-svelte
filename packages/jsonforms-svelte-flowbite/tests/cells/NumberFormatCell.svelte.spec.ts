import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { flowbiteCells, flowbiteRenderers } from '../../src/lib';

afterEach(cleanup);

const schema = {
  type: 'array',
  items: {
    type: 'object',
    properties: { quantity: { type: 'integer', description: 'Quantity entry help', maxLength: 8 } },
  },
} as const;

it('formats and parses an integer cell through local callbacks without changing its value type', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema,
      data: [{ quantity: 1234 }],
      config: { separateReadonlyFromDisabled: true },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          table: true,
          cells: {
            quantity: {
              format: true,
              toFormatted: (value: number | undefined) =>
                value === undefined ? '' : `#${value.toLocaleString('en-US')}`,
              fromFormatted: (value: string) => Number(value.replace(/[#,]/g, '')),
            },
          },
        },
      },
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
      onchange,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('tbody input[type="text"]')!;
  expect(input.value).toBe('#1,234');
  expect(input.maxLength).toBe(8);
  input.focus();
  const help = () =>
    view.container.querySelector<HTMLElement>(`#${CSS.escape(input.id + '-help')}`);
  await vi.waitFor(() => expect(help()?.textContent).toBe('Quantity entry help'));
  expect(input.getAttribute('aria-describedby')).toBe(help()?.id);
  input.value = '#2,500';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual([{ quantity: 2500 }]));
  expect(document.activeElement).toBe(input);
  expect(view.container.querySelector('tbody input[type="number"]')).toBeNull();
  const beforeInvalid = onchange.mock.calls.length;
  input.value = '#bad';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(input.closest('td')?.querySelector('.cell-invalid')).not.toBeNull(),
  );
  expect(input.value).toBe('#bad');
  expect(input.getAttribute('aria-describedby')).toBe(help()?.id);
  expect(help()?.textContent).toBeTruthy();
  expect(help()?.textContent).not.toBe('Quantity entry help');
  expect(onchange).toHaveBeenCalledTimes(beforeInvalid);
  input.value = '#25';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual([{ quantity: 25 }]));
  await vi.waitFor(() => expect(input.closest('td')?.querySelector('.cell-invalid')).toBeNull());
  expect(help()?.textContent).toBe('Quantity entry help');
  const clear = () =>
    input.closest('td')!.querySelector<HTMLButtonElement>('button[aria-label="Clear value"]');
  expect(clear()).not.toBeNull();
  await view.rerender({ readonly: true });
  await vi.waitFor(() => expect(clear()).toBeNull());
  expect(input.readOnly).toBe(true);
  await view.rerender({ readonly: false });
  await vi.waitFor(() => expect(clear()).not.toBeNull());
  clear()!.click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data[0].quantity).toBeUndefined());
  await view.rerender({ readonly: true });
  expect(input.readOnly).toBe(true);
  expect(input.disabled).toBe(false);
  const beforeReadonlyEdit = onchange.mock.calls.length;
  input.value = '#999';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  expect(onchange).toHaveBeenCalledTimes(beforeReadonlyEdit);
});

it('keeps the standard integer editor when no formatter callbacks are supplied', async () => {
  const view = await render(JsonForms, {
    props: {
      schema,
      data: [{ quantity: 1234 }],
      config: { separateReadonlyFromDisabled: true },
      uischema: {
        type: 'Control',
        scope: '#',
        options: { table: true, cells: { quantity: { format: true } } },
      },
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
    },
  });
  expect(view.container.querySelector('tbody input[type="number"]')).not.toBeNull();
});

it('uses config formatter defaults with local column options taking precedence', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema,
      data: [{ quantity: 12 }],
      config: {
        toFormatted: (value: number | undefined) => `global ${value ?? ''}`,
        fromFormatted: (value: string) => Number(value.replace('#', '')),
      },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          table: true,
          cells: {
            quantity: {
              format: true,
              toFormatted: (value: number | undefined) => `#${value ?? ''}`,
            },
          },
        },
      },
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
      onchange,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('tbody input[type="text"]')!;
  expect(input.value).toBe('#12');
  input.value = '#34';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual([{ quantity: 34 }]));
});

it('uses a multiline formatted editor when requested and keeps invalid drafts local', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema,
      data: [{ quantity: 12 }],
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          table: true,
          cells: {
            quantity: {
              format: true,
              multi: true,
              toFormatted: (value: number | undefined) => `#${value ?? ''}`,
              fromFormatted: (value: string) =>
                value === '#?' ? undefined : Number(value.replace('#', '')),
            },
          },
        },
      },
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
      onchange,
    },
  });
  const textarea = view.container.querySelector<HTMLTextAreaElement>('tbody textarea')!;
  expect(textarea).not.toBeNull();
  expect(textarea.value).toBe('#12');
  expect(textarea.maxLength).toBe(8);
  textarea.focus();
  const beforeInvalid = onchange.mock.calls.length;
  textarea.value = '#?';
  textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(textarea.getAttribute('aria-invalid')).toBe('true'));
  const help = view.container.querySelector<HTMLElement>(`#${CSS.escape(textarea.id + '-help')}`);
  expect(textarea.getAttribute('aria-describedby')).toBe(help?.id);
  expect(help?.textContent).toBeTruthy();
  expect(onchange).toHaveBeenCalledTimes(beforeInvalid);
  expect(textarea.value).toBe('#?');
  textarea.value = '#34';
  textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual([{ quantity: 34 }]));
  expect(document.activeElement).toBe(textarea);
  await vi.waitFor(() => expect(textarea.getAttribute('aria-invalid')).toBe('false'));
});

it('counts a formatted cell in active initial-focus conflicts without changing its native request', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            rows: schema,
          },
        },
        data: { name: 'Ada', rows: [{ quantity: 12 }] },
        uischema: {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/name', options: { focus: true } },
            {
              type: 'Control',
              scope: '#/properties/rows',
              options: {
                table: true,
                cells: {
                  quantity: {
                    format: true,
                    focus: true,
                    toFormatted: (value: number | undefined) => `#${value ?? ''}`,
                    fromFormatted: (value: string) => Number(value.slice(1)),
                  },
                },
              },
            },
          ],
        },
        renderers: flowbiteRenderers,
        cells: flowbiteCells,
      },
    });
    const inputs = [...view.container.querySelectorAll<HTMLInputElement>('input[autofocus]')];
    expect(inputs).toHaveLength(2);
    await vi.waitFor(() =>
      expect(warn.mock.calls.filter(([code]) => code === 'focus.conflict')).toEqual([
        [
          'focus.conflict',
          {
            severity: 'warning',
            message: 'Several active controls request initial focus; the winner is not portable.',
            details: { paths: ['name', 'rows.0.quantity'] },
          },
        ],
      ]),
    );
  } finally {
    warn.mockRestore();
  }
});

it('replaces an invalid local formatted draft when the host supplies new data', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema,
      data: [{ quantity: 12 }],
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          table: true,
          cells: {
            quantity: {
              format: true,
              toFormatted: (value: number | undefined) => `#${value ?? ''}`,
              fromFormatted: (value: string) => Number(value.slice(1)),
            },
          },
        },
      },
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
      onchange,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('tbody input[type="text"]')!;
  const beforeInvalid = onchange.mock.calls.length;
  input.value = '#bad';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
  expect(onchange).toHaveBeenCalledTimes(beforeInvalid);

  await view.rerender({ data: [{ quantity: 77 }] });
  const currentInput = () =>
    view.container.querySelector<HTMLInputElement>('tbody input[type="text"]');
  await vi.waitFor(() => expect(currentInput()?.value).toBe('#77'));
  expect(currentInput()?.getAttribute('aria-invalid')).toBe('false');
  expect(onchange.mock.lastCall?.[0].data).toEqual([{ quantity: 77 }]);
});

it('dispatches a formatted integer cell through a referenced item schema', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: { quantity: { $ref: '#/definitions/quantity' } },
        },
        definitions: { quantity: { type: 'integer' } },
      },
      data: [{ quantity: 42 }],
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          table: true,
          cells: {
            quantity: {
              format: true,
              toFormatted: (value: number | undefined) => `#${value ?? ''}`,
              fromFormatted: (value: string) => Number(value.slice(1)),
            },
          },
        },
      },
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
      onchange,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('tbody input[type="text"]');
  expect(input?.value).toBe('#42');
  input!.value = '#57';
  input!.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual([{ quantity: 57 }]));
});

it('keeps ordinary cells for incompatible string and decimal-number schemas', async () => {
  const onchange = vi.fn();
  const toFormatted = vi.fn(() => 'wrong formatter');
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: { note: { type: 'string' }, price: { type: 'number' } },
        },
      },
      data: [{ note: 'plain', price: 2.5 }],
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          table: true,
          cells: {
            note: { format: true, toFormatted, fromFormatted: () => 0 },
            price: { format: true, toFormatted, fromFormatted: () => 0 },
          },
        },
      },
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
      onchange,
    },
  });
  const row = view.container.querySelector('tbody tr')!;
  const text = row.querySelector<HTMLInputElement>('input[type="text"]')!;
  const number = row.querySelector<HTMLInputElement>('input[type="number"]')!;
  expect(text.value).toBe('plain');
  expect(number.value).toBe('2.5');
  expect(toFormatted).not.toHaveBeenCalled();
  number.value = '3.5';
  number.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([{ note: 'plain', price: 3.5 }]),
  );
});
