import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import specSchema from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/schema.json';
import specUi from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/uischema.json';
import specData from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/data.json';
import specConfig from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/config.json';
import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import { flowbiteRenderers, flowbiteCells } from '../../src/lib';

afterEach(cleanup);

const values = [0, '0', null, '', false, { id: 1 }, { id: 2 }, ['a']];
const labels = [
  'Number zero',
  'String zero',
  'Null',
  'Empty',
  'False',
  'First object',
  'Second object',
  'Array',
];
const propertySchema = {
  oneOf: values.map((value, index) => ({ const: value, title: labels[index] })),
};
const uischema = { type: 'Control', scope: '#/properties/value' };

async function selectLabel(container: HTMLElement, label: string, occurrence = 0) {
  const native = container.querySelector<HTMLSelectElement>('select');
  if (native) {
    native.value = Array.from(native.options).filter((option) => option.textContent === label)[
      occurrence
    ].value;
    native.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    const trigger = container.querySelector<HTMLButtonElement>(
      'button[aria-haspopup="listbox"], button[data-part="trigger"]',
    );
    expect(trigger).toBeTruthy();
    await page.elementLocator(trigger!).click();
    await page.getByRole('option', { name: label, exact: true }).nth(occurrence).click();
  }
}

it('selects every JSON type and retains structural selection after host reload', async () => {
  const onchange = vi.fn();
  const props = {
    schema: { type: 'object', properties: { value: propertySchema } },
    data: { value: { id: 2 } },
    uischema,
    renderers: flowbiteRenderers,
    onchange,
  };
  const view = await render(JsonForms, { props });
  for (const index of [0, 1, 2, 3, 4, 5, 6, 7]) {
    await selectLabel(view.container, labels[index]);
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toEqual(values[index]));
  }
  await view.rerender({ ...props, data: JSON.parse(JSON.stringify(props.data)) });
  const native = view.container.querySelector<HTMLSelectElement>('select');
  const input = view.container.querySelector<HTMLInputElement>('input[role="combobox"]');
  const text =
    native?.selectedOptions[0]?.textContent ??
    input?.value ??
    view.container.querySelector('[role="combobox"], button[aria-haspopup="listbox"]')?.textContent;
  expect(text).toContain('Second object');
});

it('uses typed radio choices with duplicate labels and parsed object values', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          value: {
            oneOf: [
              { const: { id: 1 }, title: 'Same' },
              { const: { id: 2 }, title: 'Same' },
              { const: null, title: 'Null' },
            ],
          },
        },
      },
      data: { value: JSON.parse('{"id":2}') },
      uischema: { ...uischema, options: { format: 'radio' } },
      renderers: flowbiteRenderers,
      onchange,
    },
  });
  await expect.element(page.getByRole('radio').nth(1)).toBeChecked();
  const radio = document.querySelectorAll<HTMLElement>('[role="radio"], input[type="radio"]')[0];
  radio.click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toEqual({ id: 1 }));
});

it('removes a parsed object multi-choice without deleting an unrelated invalid member', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          value: { type: 'array', uniqueItems: true, items: { enum: [{ id: 1 }, { id: 2 }] } },
        },
      },
      data: { value: [{ id: 1 }, 'invalid'], untouched: 'keep' },
      uischema,
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
      onchange,
    },
  });
  await expect.element(page.getByRole('checkbox').nth(0)).toBeChecked();
  view.container.querySelector<HTMLElement>('[role="checkbox"], input[type="checkbox"]')!.click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value: ['invalid'], untouched: 'keep' }),
  );
});

it('opens every spec choice-controls feature tab without rewriting its data', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: specSchema as unknown as JsonSchema,
      uischema: specUi as UISchemaElement,
      data: structuredClone(specData),
      config: specConfig,
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
      onchange,
    },
  });
  for (const category of specUi.elements[0].elements) {
    await page.getByRole('tab', { name: category.label, exact: true }).click();
  }
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(specData));
});

it.each([null, false, 0, ''])(
  'offers a standalone falsy const %j without confusing it with absence',
  async (value) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'object', properties: { value: { const: value } } },
        uischema: { ...uischema, options: { format: 'radio' } },
        data: {},
        renderers: flowbiteRenderers,
        onchange,
      },
    });
    const radio = view.container.querySelector<HTMLElement>('[role="radio"], input[type="radio"]');
    expect(radio).not.toBeNull();
    radio!.click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual({ value }));
  },
);

it('keeps every JSON type and duplicate choice labels distinct in table cells', async () => {
  const onchange = vi.fn();
  const cellLabels = labels.map((label, index) =>
    index === 5 || index === 6 ? 'Same object label' : label,
  );
  const original = {
    rows: [
      { value: { id: 2 }, note: 'keep' },
      { value: 'invalid', note: 'neighbor' },
    ],
  };
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
                value: {
                  oneOf: values.map((value, index) => ({ const: value, title: cellLabels[index] })),
                },
                note: { type: 'string' },
              },
            },
          },
        },
      },
      uischema: { type: 'Control', scope: '#/properties/rows', options: { table: true } },
      data: structuredClone(original),
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
      onchange,
    },
  });
  const cell = () =>
    view.container
      .querySelector<HTMLElement>(
        'tbody tr:first-child [role="combobox"], tbody tr:first-child button[aria-haspopup="listbox"], tbody tr:first-child select',
      )
      ?.closest('td');
  await expect.poll(() => cell()).toBeTruthy();
  for (let index = 0; index < values.length; index++) {
    await selectLabel(cell()!, cellLabels[index], index === 6 ? 1 : 0);
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        rows: [{ value: values[index], note: 'keep' }, original.rows[1]],
      }),
    );
  }
  await view.rerender({ data: JSON.parse(JSON.stringify(original)) });
  const element = cell()!.querySelector<HTMLElement>(
    'select, input[role="combobox"], button[aria-haspopup="listbox"]',
  )!;
  const label =
    element instanceof HTMLSelectElement
      ? element.selectedOptions[0]?.textContent
      : element instanceof HTMLInputElement
        ? element.value
        : element.textContent;
  expect(label).toContain('Same object label');
  if (element instanceof HTMLSelectElement) {
    expect(element.selectedOptions[0]).toBe(
      [...element.options].filter((option) => option.textContent === 'Same object label')[1],
    );
  } else {
    const trigger = cell()!.querySelector<HTMLButtonElement>(
      'button[aria-haspopup="listbox"], button[data-part="trigger"]',
    )!;
    await page.elementLocator(trigger).click();
    await expect
      .element(page.getByRole('option', { name: 'Same object label', exact: true }).nth(1))
      .toHaveAttribute('aria-selected', 'true');
  }
  expect(original.rows[1].value).toBe('invalid');
});
