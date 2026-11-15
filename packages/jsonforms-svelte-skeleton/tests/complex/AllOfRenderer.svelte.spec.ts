import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as allOfRendererEntry } from '../../src/lib/complex/AllOfRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as groupRendererEntry } from '../../src/lib/layouts/GroupRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { skeletonRenderers } from '../../src/lib/renderers';
import { mountControl, mountForm, waitForChange } from '../testUtils';

describe('AllOfRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [
    allOfRendererEntry,
    groupRendererEntry,
    layoutRendererEntry,
    stringControlRendererEntry,
  ];

  const propertySchema: JsonSchema = {
    allOf: [
      {
        type: 'object',
        properties: {
          firstName: { type: 'string', title: 'First Name', minLength: 2 },
        },
        required: ['firstName'],
      },
      {
        type: 'object',
        properties: {
          lastName: { type: 'string', title: 'Last Name', minLength: 3 },
        },
        required: ['lastName'],
      },
    ],
  };

  it('renders allOf subschema controls', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
      value: { firstName: 'Ada', lastName: 'Lovelace' },
    });

    const inputs = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    );
    expect(inputs).toHaveLength(2);
    expect(inputs[0].value).toBe('Ada');
    expect(inputs[1].value).toBe('Lovelace');
  });

  it('updates core data when allOf child control changes', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema,
      value: { firstName: 'Ada', lastName: 'Lovelace' },
    });

    const inputs = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    );
    const before = onchange.mock.calls.length;

    inputs[1].value = 'Byron';
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    const value = changeEvent.data.value as { lastName: string };
    expect(value.lastName).toBe('Byron');
  });

  it('renders invalid allOf data in child controls', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
      value: { firstName: 'Ada', lastName: 'Li' },
    });

    const inputs = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    );
    expect(inputs).toHaveLength(2);
    expect(inputs[1].value).toBe('Li');
  });

  it('renders enclosing, referenced and branch fields once without rewriting the object', async () => {
    const data = { element: { code: 'A1', width: 12, geometry: 'circle' } };
    const { view, onchange } = await mountForm({
      renderers: skeletonRenderers,
      schema: {
        type: 'object',
        $defs: {
          Base: { type: 'object', properties: { width: { type: 'integer' } } },
        },
        properties: {
          element: {
            type: 'object',
            properties: { code: { type: 'string' } },
            allOf: [
              { $ref: '#/$defs/Base' },
              { type: 'object', properties: { geometry: { type: 'string' } } },
            ],
          },
        },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/element' },
      data,
    });
    const inputs = Array.from(view.container.querySelectorAll<HTMLInputElement>('input'));
    expect(inputs.map((input) => input.value).sort()).toEqual(['12', 'A1', 'circle']);
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
  });

  it('keeps contradictory object branches visible and bound to the same value', async () => {
    const { view, onchange } = await mountControl({
      renderers: skeletonRenderers,
      propertySchema: {
        type: 'object',
        properties: { name: { type: 'string', title: 'Name' } },
        allOf: [
          { properties: { code: { type: 'string', title: 'Minimum code', minLength: 5 } } },
          { properties: { code: { type: 'string', title: 'Maximum code', maxLength: 2 } } },
        ],
      },
      value: { name: 'Item', code: 'ABCD' },
    });
    const inputs = Array.from(view.container.querySelectorAll<HTMLInputElement>('input'));
    expect(inputs.map((input) => input.value)).toEqual(['Item', 'ABCD', 'ABCD']);
    expect(onchange.mock.lastCall?.[0].data).toEqual({
      value: { name: 'Item', code: 'ABCD' },
    });
    expect(
      onchange.mock.lastCall?.[0].errors.map((error: { keyword: string }) => error.keyword).sort(),
    ).toEqual(['maxLength', 'minLength']);
    const before = onchange.mock.calls.length;
    inputs[1].value = 'ABCDEFG';
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    const event = await waitForChange(onchange, before);
    expect(event.data.value).toEqual({ name: 'Item', code: 'ABCDEFG' });
    expect((event.errors as Array<{ keyword: string }>).map((error) => error.keyword)).toEqual([
      'maxLength',
    ]);
    await vi.waitFor(() =>
      expect(
        Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).map(
          (input) => input.value,
        ),
      ).toEqual(['Item', 'ABCDEFG', 'ABCDEFG']),
    );
  });
  it('renders finite allOf nodes through a local recursive reference without creating descendants', async () => {
    const data = { node: { label: 'Root', next: { label: 'Leaf' } } };
    const { view, onchange } = await mountForm({
      renderers: skeletonRenderers,
      schema: {
        type: 'object',
        $defs: {
          Node: {
            type: 'object',
            allOf: [
              { type: 'object', properties: { label: { type: 'string' } } },
              { type: 'object', properties: { next: { $ref: '#/$defs/Node' } } },
            ],
          },
        },
        properties: { node: { $ref: '#/$defs/Node' } },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/node' },
      data,
    });
    const inputs = Array.from(view.container.querySelectorAll<HTMLInputElement>('input'));
    expect(inputs.map((input) => input.value)).toEqual(['Root', 'Leaf']);
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
    const create = Array.from(view.container.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Add node',
    );
    expect(create).toBeDefined();
    await view.rerender({ readonly: true });
    await vi.waitFor(() => expect(create?.disabled).toBe(true));
    await view.rerender({ readonly: false });
    await vi.waitFor(() => expect(create?.disabled).toBe(false));
    const before = onchange.mock.calls.length;
    create!.click();
    const event = await waitForChange(onchange, before);
    expect(event.data).toEqual({ node: { label: 'Root', next: { label: 'Leaf', next: {} } } });
    await vi.waitFor(() =>
      expect(
        Array.from(view.container.querySelectorAll('button')).filter(
          (button) => button.textContent?.trim() === 'Add node',
        ),
      ).toHaveLength(1),
    );
  });

  it('keeps non-terminating required recursion finite and reports the missing child', async () => {
    const data = { node: { label: 'Root' } };
    const { view, onchange } = await mountForm({
      renderers: skeletonRenderers,
      schema: {
        type: 'object',
        $defs: {
          Node: {
            type: 'object',
            allOf: [
              { type: 'object', properties: { label: { type: 'string' } } },
              {
                type: 'object',
                properties: { next: { $ref: '#/$defs/Node' } },
                required: ['next'],
              },
            ],
          },
        },
        properties: { node: { $ref: '#/$defs/Node' } },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/node' },
      data,
    });
    expect(
      Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).map(
        (input) => input.value,
      ),
    ).toEqual(['Root']);
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
    expect(onchange.mock.lastCall?.[0].errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'required',
          instancePath: '/node',
          params: { missingProperty: 'next' },
        }),
      ]),
    );
    const create = Array.from(view.container.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Add node',
    );
    expect(create).toBeDefined();
    expect(view.container.querySelector('[role="alert"]')?.textContent).toContain(
      'is a required property',
    );
    const before = onchange.mock.calls.length;
    create!.click();
    const event = await waitForChange(onchange, before);
    expect(event.data).toEqual({ node: { label: 'Root', next: {} } });
    expect(event.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'required',
          instancePath: '/node/next',
          params: { missingProperty: 'next' },
        }),
      ]),
    );
  });
  it('creates a recursive child with its allOf field default only after the action', async () => {
    const data = { node: { label: 'Root' } };
    const { view, onchange } = await mountForm({
      renderers: skeletonRenderers,
      schema: {
        type: 'object',
        $defs: {
          Node: {
            type: 'object',
            allOf: [
              { type: 'object', properties: { label: { type: 'string', default: 'New node' } } },
              { type: 'object', properties: { next: { $ref: '#/$defs/Node' } } },
            ],
          },
        },
        properties: { node: { $ref: '#/$defs/Node' } },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/node' },
      data,
    });
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
    const create = Array.from(view.container.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Add node',
    );
    expect(create).toBeDefined();
    const before = onchange.mock.calls.length;
    create!.click();
    const event = await waitForChange(onchange, before);
    expect(event.data).toEqual({ node: { label: 'Root', next: { label: 'New node' } } });
    await vi.waitFor(() =>
      expect(
        Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).map(
          (input) => input.value,
        ),
      ).toEqual(['Root', 'New node']),
    );
    expect(
      Array.from(view.container.querySelectorAll('button')).filter(
        (button) => button.textContent?.trim() === 'Add node',
      ),
    ).toHaveLength(1);
  });
});
