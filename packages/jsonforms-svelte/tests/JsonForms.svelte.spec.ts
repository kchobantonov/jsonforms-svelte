import {
  Generate,
  type JsonFormsCellRendererRegistryEntry,
  type JsonFormsRendererRegistryEntry,
  type JsonFormsUISchemaRegistryEntry,
  type JsonSchema,
  type Middleware,
  type UISchemaElement,
} from '@jsonforms/core';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
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

    render(JsonForms, {
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

    render(JsonForms, {
      props: { data, schema, renderers: captureRenderers },
    });

    const schemaJson = page.getByTestId('schema-json');
    await expect.element(schemaJson).toHaveTextContent(JSON.stringify(schema));
  });

  it('generates schema when not given via prop', async () => {
    const data = { number: 5.5 };

    render(JsonForms, {
      props: { data, renderers: captureRenderers },
    });

    const schemaJson = page.getByTestId('schema-json');
    await expect.element(schemaJson).toBeInTheDocument();
    await expect.element(schemaJson).toHaveTextContent(JSON.stringify(Generate.jsonSchema(data)));
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

    render(JsonForms, {
      props: { data, schema, uischema, renderers: captureRenderers },
    });

    const uischemaJson = page.getByTestId('uischema-json');
    await expect.element(uischemaJson).toHaveTextContent(JSON.stringify(uischema));
  });

  it('generates ui schema when not given via prop', async () => {
    const data = { number: 5.5 };
    const schema: JsonSchema = {
      type: 'object',
      properties: { number: { type: 'number' } },
    };

    render(JsonForms, {
      props: { data, schema, renderers: captureRenderers },
    });

    const uischemaJson = page.getByTestId('uischema-json');
    await expect.element(uischemaJson).toBeInTheDocument();
    await expect.element(uischemaJson).toHaveTextContent(JSON.stringify(Generate.uiSchema(schema)));
  });

  it('calls onchange on initialization with current data', async () => {
    const data = { number: 5.5 };
    const onchange = vi.fn();

    render(JsonForms, {
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

    const view = render(JsonForms, {
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

    const view = render(JsonForms, {
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

    const view = render(JsonForms, {
      props: {
        data,
        renderers: captureRenderers,
        cells: cellsA,
        uischemas: uischemasA,
        readonly: false,
      },
    });

    await expect.element(page.getByTestId('renderers-count')).toHaveTextContent('1');
    await expect.element(page.getByTestId('cells-count')).toHaveTextContent('1');
    await expect.element(page.getByTestId('uischemas-count')).toHaveTextContent('1');
    await expect.element(page.getByTestId('readonly-flag')).toHaveTextContent('false');

    await view.rerender({
      data: { number: 6.5 },
      renderers: [...captureRenderers, { tester: alwaysRender, renderer: CaptureRenderer }],
      cells: cellsB,
      uischemas: uischemasB,
      readonly: true,
    });

    await expect.element(page.getByTestId('renderers-count')).toHaveTextContent('2');
    await expect.element(page.getByTestId('cells-count')).toHaveTextContent('2');
    await expect.element(page.getByTestId('uischemas-count')).toHaveTextContent('2');
    await expect.element(page.getByTestId('readonly-flag')).toHaveTextContent('true');
  });

  it('invokes custom middleware on init and updates', async () => {
    const middlewareCalls: string[] = [];
    const middleware = ((state, action, reducer) => {
      middlewareCalls.push(String(action.type));
      return reducer(state, action);
    }) as Middleware;
    const initialData = { number: 1 };
    const updatedData = { number: 3 };

    const view = render(JsonForms, {
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
