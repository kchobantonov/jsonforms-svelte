import {
  Generate,
  rankWith,
  schemaTypeIs,
  type JsonFormsCellRendererRegistryEntry,
  type JsonFormsRendererRegistryEntry,
  type JsonFormsUISchemaRegistryEntry,
  type JsonSchema,
  type Middleware,
  type UISchemaElement,
} from '@jsonforms/core';
import { describe, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import JsonForms from '../src/lib/components/JsonForms.svelte';
import CaptureRenderer from './fixtures/CaptureRenderer.svelte';

const alwaysRender: JsonFormsRendererRegistryEntry['tester'] = () => 1;
const alwaysUiSchema: JsonFormsUISchemaRegistryEntry['tester'] = () => 1;

const captureRenderers: JsonFormsRendererRegistryEntry[] = [
  {
    tester: alwaysRender,
    renderer: CaptureRenderer,
  },
];

describe('JsonForms.svelte', () => {
  it('renders without schema prop', async () => {
    const data = { number: 5 };
    const renderers: JsonFormsRendererRegistryEntry[] = [];

    await render(JsonForms, {
      props: { data, renderers },
    });

    const fallback = page.getByText('No applicable renderer found.');
    await expect.element(fallback).toBeInTheDocument();
  });

  it('uses provided schema when given via prop', async () => {
    const data = { number: 5.5 };
    const schema: JsonSchema = {
      type: 'object',
      properties: { number: { type: 'string' } },
      required: ['number'],
    };

    await render(JsonForms, {
      props: { data, schema, renderers: captureRenderers },
    });

    const schemaJson = page.getByTestId('schema-json');
    await expect.element(schemaJson).toMatchTextContent(JSON.stringify(schema));
  });

  it('generates schema when not given via prop', async () => {
    const data = { number: 5.5 };

    await render(JsonForms, {
      props: { data, renderers: captureRenderers },
    });

    const schemaJson = page.getByTestId('schema-json');
    await expect.element(schemaJson).toBeInTheDocument();
    await expect.element(schemaJson).toMatchTextContent(JSON.stringify(Generate.jsonSchema(data)));
  });

  it('uses provided ui schema when given via prop', async () => {
    const data = { number: 5.5 };
    const schema: JsonSchema = {
      type: 'object',
      properties: { number: { type: 'number' } },
    };
    const uischema: UISchemaElement = {
      type: 'Control',
      scope: '#/properties/number',
      label: 'Custom Number',
    };

    await render(JsonForms, {
      props: { data, schema, uischema, renderers: captureRenderers },
    });

    const uischemaJson = page.getByTestId('uischema-json');
    await expect.element(uischemaJson).toMatchTextContent(JSON.stringify(uischema));
  });

  it('selects a new renderer when the schema changes', async () => {
    const stringRenderers: JsonFormsRendererRegistryEntry[] = [
      {
        tester: rankWith(1, schemaTypeIs('string')),
        renderer: CaptureRenderer,
      },
    ];
    const view = await render(JsonForms, {
      props: {
        data: 'initial value',
        schema: { type: 'string' },
        uischema: { type: 'Control', scope: '#' },
        renderers: stringRenderers,
      },
    });

    await expect.element(page.getByTestId('schema-json')).toBeInTheDocument();

    await view.rerender({
      data: [],
      schema: { type: 'array', items: { type: 'string' } },
      uischema: { type: 'Control', scope: '#' },
      renderers: stringRenderers,
    });

    await expect.element(page.getByText('No applicable renderer found.')).toBeInTheDocument();
  });

  it('generates ui schema when not given via prop', async () => {
    const data = { number: 5.5 };
    const schema: JsonSchema = {
      type: 'object',
      properties: { number: { type: 'number' } },
    };

    await render(JsonForms, {
      props: { data, schema, renderers: captureRenderers },
    });

    const uischemaJson = page.getByTestId('uischema-json');
    await expect.element(uischemaJson).toBeInTheDocument();
    await expect
      .element(uischemaJson)
      .toMatchTextContent(JSON.stringify(Generate.uiSchema(schema)));
  });

  it('calls onchange on initialization with current data', async () => {
    const data = { number: 5.5 };
    const onchange = vi.fn();

    await render(JsonForms, {
      props: { data, renderers: captureRenderers, onchange },
    });

    await vi.waitFor(() => {
      expect(onchange).toHaveBeenCalled();
    });

    const lastEvent = onchange.mock.lastCall?.[0];
    expect(lastEvent?.data).toEqual(data);
    expect(lastEvent?.errors).toBeDefined();
  });

  it('calls onchange when data prop changes', async () => {
    const initialData = { number: 1 };
    const updatedData = { number: 2 };
    const onchange = vi.fn();

    const view = await render(JsonForms, {
      props: { data: initialData, renderers: captureRenderers, onchange },
    });

    await vi.waitFor(() => {
      expect(onchange).toHaveBeenCalled();
    });

    const callsAfterInit = onchange.mock.calls.length;
    await view.rerender({ data: updatedData, renderers: captureRenderers, onchange });

    await vi.waitFor(() => {
      expect(onchange.mock.calls.length).toBeGreaterThan(callsAfterInit);
    });

    const lastEvent = onchange.mock.lastCall?.[0];
    expect(lastEvent?.data).toEqual(updatedData);
  });

  it('does not call onchange when middleware keeps state unchanged on update', async () => {
    const initialData = { number: 7 };
    const updatedData = { number: 8 };
    const onchange = vi.fn();
    const middleware = ((state, action, reducer) => {
      if (String(action.type).toUpperCase().includes('UPDATE')) {
        return state;
      }
      return reducer(state, action);
    }) as Middleware;

    const view = await render(JsonForms, {
      props: { data: initialData, renderers: captureRenderers, onchange, middleware },
    });

    await vi.waitFor(() => {
      expect(onchange).toHaveBeenCalled();
    });

    const callsAfterInit = onchange.mock.calls.length;
    await view.rerender({ data: updatedData, renderers: captureRenderers, onchange, middleware });
    await Promise.resolve();

    expect(onchange.mock.calls.length).toBe(callsAfterInit);
  });

  it('updates renderers, cells, uischemas, and readonly when props change', async () => {
    const data = { number: 5.5 };
    const cellsA: JsonFormsCellRendererRegistryEntry[] = [
      { tester: alwaysRender, cell: CaptureRenderer },
    ];
    const cellsB: JsonFormsCellRendererRegistryEntry[] = [
      ...cellsA,
      { tester: alwaysRender, cell: CaptureRenderer },
    ];
    const uischemasA: JsonFormsUISchemaRegistryEntry[] = [
      { tester: alwaysUiSchema, uischema: { type: 'Control', scope: '#/properties/number' } },
    ];
    const uischemasB: JsonFormsUISchemaRegistryEntry[] = [
      ...uischemasA,
      { tester: alwaysUiSchema, uischema: { type: 'Control', scope: '#/properties/extra' } },
    ];

    const view = await render(JsonForms, {
      props: {
        data,
        renderers: captureRenderers,
        cells: cellsA,
        uischemas: uischemasA,
        readonly: false,
      },
    });

    await expect.element(page.getByTestId('renderers-count')).toMatchTextContent('1');
    await expect.element(page.getByTestId('cells-count')).toMatchTextContent('1');
    await expect.element(page.getByTestId('uischemas-count')).toMatchTextContent('1');
    await expect.element(page.getByTestId('readonly-flag')).toMatchTextContent('false');

    await view.rerender({
      data: { number: 6.5 },
      renderers: [...captureRenderers, { tester: alwaysRender, renderer: CaptureRenderer }],
      cells: cellsB,
      uischemas: uischemasB,
      readonly: true,
    });

    await expect.element(page.getByTestId('renderers-count')).toMatchTextContent('2');
    await expect.element(page.getByTestId('cells-count')).toMatchTextContent('2');
    await expect.element(page.getByTestId('uischemas-count')).toMatchTextContent('2');
    await expect.element(page.getByTestId('readonly-flag')).toMatchTextContent('true');
  });

  it('invokes custom middleware on init and updates', async () => {
    const middlewareCalls: string[] = [];
    const middleware = ((state, action, reducer) => {
      middlewareCalls.push(String(action.type));
      return reducer(state, action);
    }) as Middleware;
    const initialData = { number: 1 };
    const updatedData = { number: 3 };

    const view = await render(JsonForms, {
      props: { data: initialData, renderers: captureRenderers, middleware },
    });

    await vi.waitFor(() => {
      expect(middlewareCalls.length).toBeGreaterThan(0);
    });

    await view.rerender({ data: updatedData, renderers: captureRenderers, middleware });

    await vi.waitFor(() => {
      expect(middlewareCalls.length).toBeGreaterThan(1);
    });

    expect(middlewareCalls.some((type) => type.toUpperCase().includes('INIT'))).toBe(true);
    expect(middlewareCalls.some((type) => type.toUpperCase().includes('UPDATE'))).toBe(true);
  });
});

it('regenerates an omitted schema for external root-type replacements and preserves explicit schemas', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, { props: { renderers: captureRenderers, onchange } });
  const currentSchema = () =>
    JSON.parse(view.container.querySelector('[data-testid="schema-json"]')!.textContent!);
  expect(currentSchema()).toEqual({});
  for (const [data, type] of [
    [{ name: 'Sample' }, 'object'],
    [[1, 'two'], 'array'],
    ['text', 'string'],
    [1.5, 'number'],
    [false, 'boolean'],
    [null, 'null'],
  ] as const) {
    await view.rerender({ data });
    await expect.poll(() => currentSchema().type).toBe(type);
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
  }
  await view.rerender({ data: 'kept', schema: {} });
  await expect.poll(currentSchema).toEqual({});
  await view.rerender({ data: [1, 2] });
  expect(currentSchema()).toEqual({});
  await view.rerender({ schema: undefined });
  await expect.poll(() => currentSchema().type).toBe('array');
  await view.rerender({ data: undefined });
  await expect.poll(currentSchema).toEqual({});
  expect(onchange.mock.lastCall?.[0].data).toBeUndefined();
});

it('preserves absent and explicit host config before core defaults, including live replacements', async () => {
  const view = await render(JsonForms, {
    props: { data: {}, schema: {}, renderers: captureRenderers },
  });
  await expect.element(page.getByTestId('authored-config')).toMatchTextContent('absent');
  await expect.element(page.getByTestId('core-restrict')).toMatchTextContent('false');
  await view.rerender({ config: { restrict: false, custom: 0 } });
  await expect
    .element(page.getByTestId('authored-config'))
    .toMatchTextContent('{"restrict":false,"custom":0}');
  await view.rerender({ config: { restrict: true } });
  await expect.element(page.getByTestId('authored-config')).toMatchTextContent('{"restrict":true}');
  await view.rerender({ config: undefined });
  await expect.element(page.getByTestId('authored-config')).toMatchTextContent('absent');
});

it('preserves boolean root schemas and their original validation errors across host updates', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: { schema: false, data: 'retained', renderers: captureRenderers, onchange },
  });
  await expect.element(page.getByTestId('core-schema-json')).toMatchTextContent('false');
  await expect.poll(() => onchange.mock.lastCall?.[0].errors?.[0]?.keyword).toBe('false schema');
  expect(onchange.mock.lastCall?.[0].errors[0].instancePath).toBe('');
  expect(onchange.mock.lastCall?.[0].errors[0].schemaPath).toBe('#/false schema');
  expect(onchange.mock.lastCall?.[0].data).toBe('retained');
  await view.rerender({ schema: true });
  await expect.element(page.getByTestId('core-schema-json')).toMatchTextContent('true');
  await expect.poll(() => onchange.mock.lastCall?.[0].errors).toHaveLength(0);
  expect(onchange.mock.lastCall?.[0].data).toBe('retained');
  await view.rerender({ schema: false, validationMode: 'NoValidation' });
  await expect.element(page.getByTestId('core-schema-json')).toMatchTextContent('false');
  expect(onchange.mock.lastCall?.[0].errors).toHaveLength(0);
});

it('validates anonymous recursive roots and keeps the authored schema during host replacement', async () => {
  const schema: JsonSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      children: { type: 'array', items: { $ref: '#' } },
    },
    required: ['name'],
  };
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema,
      uischema: { type: 'Control', scope: '#' },
      renderers: captureRenderers,
      data: { name: 'root', children: [{ name: 'child' }] },
      onchange,
    },
  });
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].errors).toHaveLength(0));
  expect(view.container.querySelector('[data-testid="core-schema-json"]')?.textContent).toBe(
    JSON.stringify(schema),
  );
  await view.rerender({ data: { name: 'root', children: [{ name: 2 }] } });
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].errors[0].instancePath).toBe('/children/0/name'),
  );
  await view.rerender({
    schema: { type: 'array', items: { anyOf: [{ type: 'number' }, { $ref: '#' }] } },
    data: [1, [2]],
  });
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].errors).toHaveLength(0));
});

it('preserves row identity when a serialized host echoes the unchanged document', async () => {
  const data = { rows: [{ name: 'First' }, { name: 'Second' }] };
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: { data, schema: {}, renderers: captureRenderers, onchange },
  });
  await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
  const original = onchange.mock.lastCall![0].data;
  const calls = onchange.mock.calls.length;
  await view.rerender({ data: JSON.parse(JSON.stringify(original)) });
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  expect(onchange.mock.calls.length).toBe(calls);
  await view.rerender({ data: { rows: [{ name: 'Replacement' }, { name: 'Second' }] } });
  await vi.waitFor(() => expect(onchange.mock.lastCall![0].data.rows[0].name).toBe('Replacement'));
  expect(onchange.mock.lastCall![0].data).not.toBe(original);
});
