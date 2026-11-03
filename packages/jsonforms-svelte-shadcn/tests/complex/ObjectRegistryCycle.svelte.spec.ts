import '../test.css';
import { JsonForms, UI_SCHEMA_CYCLE_DIAGNOSTIC } from '@chobantonov/jsonforms-svelte';
import type { ControlElement, JsonSchema, JsonSchema7, Layout } from '@jsonforms/core';
import { render, cleanup } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { shadcnRenderers, shadcnCells } from '../../src/lib';

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
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
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
        renderers: shadcnRenderers,
        cells: shadcnCells,
        onchange,
      },
    });
    const street = page.getByRole('textbox', { name: 'Street', exact: true });
    await expect.element(street).toHaveValue('First');
    await vi.waitFor(() =>
      expect(
        warning.mock.calls.filter(([code]) => code === UI_SCHEMA_CYCLE_DIAGNOSTIC),
      ).toHaveLength(1),
    );
    expect(
      warning.mock.calls.find(([code]) => code === UI_SCHEMA_CYCLE_DIAGNOSTIC)?.[1],
    ).toMatchObject({ path: 'address', type: 'Control', scope: '#' });
    warning.mockRestore();
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

it('terminates a registry cycle when each lookup returns a fresh equivalent element', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  await render(JsonForms, {
    props: {
      schema,
      data,
      uischema: { type: 'Control', scope: '#/properties/address' } as ControlElement,
      uischemas: [
        {
          tester: (schema) => (schema.title === 'Address' ? 10 : -1),
          get uischema() {
            return { type: 'Control', scope: '#' } as ControlElement;
          },
        },
      ],
      renderers: shadcnRenderers,
      cells: shadcnCells,
    },
  });
  await expect
    .element(page.getByRole('textbox', { name: 'Street', exact: true }))
    .toHaveValue('First');
  await vi.waitFor(() =>
    expect(warning.mock.calls.filter(([code]) => code === UI_SCHEMA_CYCLE_DIAGNOSTIC)).toHaveLength(
      1,
    ),
  );
  warning.mockRestore();
});

it('reports a cycle again when a host restores its recursive registry entry', async () => {
  const ondiagnostic = vi.fn();
  const cycle = [
    {
      tester: (candidate: JsonSchema) =>
        typeof candidate === 'object' && candidate.title === 'Address' ? 10 : -1,
      uischema: { type: 'Control', scope: '#' } as ControlElement,
    },
  ];
  const detail = [
    {
      tester: (candidate: JsonSchema) =>
        typeof candidate === 'object' && candidate.title === 'Address' ? 10 : -1,
      uischema: {
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/properties/city' }],
      } as Layout,
    },
  ];
  const view = await render(JsonForms, {
    props: {
      schema,
      data,
      uischema: { type: 'Control', scope: '#/properties/address' } as ControlElement,
      uischemas: cycle,
      renderers: shadcnRenderers,
      cells: shadcnCells,
      ondiagnostic,
    },
  });
  const count = () =>
    ondiagnostic.mock.calls.filter(([diagnostic]) => diagnostic.code === UI_SCHEMA_CYCLE_DIAGNOSTIC)
      .length;
  await vi.waitFor(() => expect(count()).toBe(1));
  await view.rerender({ uischemas: detail });
  await expect
    .element(page.getByRole('textbox', { name: 'City', exact: true }))
    .toHaveValue('Sofia');
  expect(count()).toBe(1);
  await view.rerender({ uischemas: cycle });
  await vi.waitFor(() => expect(count()).toBe(2));
});

it('keeps a registered Control detail ahead of the cycle fallback', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  await render(JsonForms, {
    props: {
      schema,
      data,
      uischema: { type: 'Control', scope: '#/properties/address' } as ControlElement,
      uischemas: [
        {
          tester: (schema) => (schema.title === 'Address' ? 10 : -1),
          uischema: {
            type: 'Control',
            scope: '#',
            options: {
              detail: {
                type: 'VerticalLayout',
                elements: [{ type: 'Control', scope: '#/properties/city' }],
              },
            },
          } as ControlElement,
        },
      ],
      renderers: shadcnRenderers,
      cells: shadcnCells,
    },
  });
  await expect
    .element(page.getByRole('textbox', { name: 'City', exact: true }))
    .toHaveValue('Sofia');
  expect(page.getByRole('textbox', { name: 'Street', exact: true }).query()).toBeNull();
  expect(warning.mock.calls.filter(([code]) => code === UI_SCHEMA_CYCLE_DIAGNOSTIC)).toHaveLength(
    0,
  );
  warning.mockRestore();
});

it('allows the same registered form in sibling controls and at different data paths', async () => {
  const ondiagnostic = vi.fn();
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
      renderers: shadcnRenderers,
      cells: shadcnCells,
      ondiagnostic,
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
  expect(
    ondiagnostic.mock.calls.filter(
      ([diagnostic]) => diagnostic.code === UI_SCHEMA_CYCLE_DIAGNOSTIC,
    ),
  ).toHaveLength(0);
});
