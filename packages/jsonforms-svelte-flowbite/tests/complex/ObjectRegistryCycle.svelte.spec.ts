import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import type { ControlElement, JsonSchema7, Layout } from '@jsonforms/core';
import { render, cleanup } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { flowbiteRenderers, flowbiteCells } from '../../src/lib';

afterEach(cleanup);
const address: JsonSchema7 = {
  type: 'object',
  title: 'Address',
  properties: {
    street: { type: 'string', title: 'Street' },
    city: { type: 'string', title: 'City' },
  },
};
const schema: JsonSchema7 = { type: 'object', properties: { address, other: address } };
const data = {
  address: { street: 'First', city: 'Sofia' },
  other: { street: 'Second', city: 'Plovdiv' },
};

it.each([undefined, {}, { summary: { type: 'Control', scope: '#/properties/street' } }])(
  'terminates self-dispatch with options %j and keeps edits at the original path',
  async (options) => {
    const onchange = vi.fn();
    await render(JsonForms, {
      props: {
        schema,
        data: structuredClone(data),
        uischema: { type: 'Control', scope: '#/properties/address' } as ControlElement,
        uischemas: [
          {
            tester: (schema) => (schema.title === 'Address' ? 10 : -1),
            uischema: { type: 'Control', scope: '#', options } as ControlElement,
          },
        ],
        renderers: flowbiteRenderers,
        cells: flowbiteCells,
        onchange,
      },
    });
    const street = page.getByRole('textbox', { name: 'Street', exact: true });
    await expect.element(street).toHaveValue('First');
    await expect
      .element(page.getByRole('textbox', { name: 'City', exact: true }))
      .toHaveValue('Sofia');
    await street.fill('Updated');
    await page.getByRole('textbox', { name: 'City', exact: true }).click();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        ...data,
        address: { ...data.address, street: 'Updated' },
      }),
    );
  },
);

it('allows the same registered form in sibling controls and at different data paths', async () => {
  const detail: Layout = {
    type: 'VerticalLayout',
    elements: [{ type: 'Control', scope: '#/properties/city' } as ControlElement],
  };
  await render(JsonForms, {
    props: {
      schema,
      data,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/address' },
          { type: 'Control', scope: '#/properties/address' },
          { type: 'Control', scope: '#/properties/other' },
        ],
      } as Layout,
      uischemas: [{ tester: (schema) => (schema.title === 'Address' ? 10 : -1), uischema: detail }],
      renderers: flowbiteRenderers,
      cells: flowbiteCells,
    },
  });
  await expect
    .element(page.getByRole('textbox', { name: 'City', exact: true }).nth(2))
    .toHaveValue('Plovdiv');
  expect(
    page
      .getByRole('textbox', { name: 'City', exact: true })
      .all()
      .map((item) => (item.element() as HTMLInputElement).value),
  ).toEqual(['Sofia', 'Sofia', 'Plovdiv']);
  expect(page.getByRole('textbox', { name: 'Street', exact: true }).query()).toBeNull();
});
