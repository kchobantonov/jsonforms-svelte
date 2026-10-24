import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as arrayLayoutRendererEntry } from '../../src/lib/layouts/ArrayLayoutRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import { expectValidationError, getBySelector, mountForm, waitForFormChange } from '../testUtils';

describe('ArrayLayoutRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [arrayLayoutRendererEntry, layoutRendererEntry, stringControlRendererEntry];

  const itemSchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: 'Name',
        minLength: 2,
      },
    },
    required: ['name'],
  } as JsonSchema;

  const schema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        title: 'Items',
        items: itemSchema,
      } as unknown as JsonSchema,
    },
  } as JsonSchema;

  const uischema: UISchemaElement = {
    type: 'Control',
    scope: '#/properties/items',
    options: {
      detail: 'GENERATED',
    },
  };

  it('renders no-data state when no array data is provided', async () => {
    const { view } = await mountForm({ renderers, schema, uischema });
    const text = view.container.textContent ?? '';

    expect(text.includes('No data')).toBe(true);
    const addButton = Array.from(view.container.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => (button.getAttribute('aria-label') ?? '').toLowerCase().includes('add'),
    );
    expect(addButton).toBeTruthy();
    expect(addButton?.disabled).toBe(false);
  });

  it('adds an item and updates core data', async () => {
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [] },
    });

    const addButton = Array.from(view.container.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => (button.getAttribute('aria-label') ?? '').toLowerCase().includes('add'),
    );
    expect(addButton).toBeTruthy();
    const before = onchange.mock.calls.length;
    addButton!.click();
    const changeEvent = await waitForFormChange(onchange, before);

    expect(Array.isArray(changeEvent.data.items)).toBe(true);
    expect((changeEvent.data.items as unknown[]).length).toBe(1);

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('');
  });

  it('renders validation error for invalid nested item data', async () => {
    const { view } = await mountForm({
      renderers,
      schema,
      uischema,
      data: { items: [{ name: 'A' }] },
    });

    expectValidationError(view.container);
  });

  it('uses elementLabelProp for array item headers', async () => {
    const customLabelSchema = {
      ...schema,
      properties: {
        items: {
          type: 'array',
          title: 'Items',
          items: {
            type: 'object',
            properties: {
              message1: { type: 'string' },
              message2: { type: 'string' },
            },
          },
        },
      },
    } as JsonSchema;
    const customLabelUiSchema = {
      ...uischema,
      options: { ...uischema.options, elementLabelProp: 'message2' },
    } as UISchemaElement;

    const { view } = await mountForm({
      renderers,
      schema: customLabelSchema,
      uischema: customLabelUiSchema,
      data: { items: [{ message1: 'Message one', message2: 'Message two' }] },
    });

    const itemHeader = view.container.querySelector<HTMLElement>('.truncate.text-sm.font-medium');
    expect(itemHeader?.textContent?.trim()).toBe('Message two');
  });
  it('uses catalog array actions and lets host translations override them', async () => {
    const renderers = [arrayLayoutRendererEntry, layoutRendererEntry, stringControlRendererEntry];
    const { view } = await mountForm({
      renderers,
      schema: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
      uischema: { type: 'Control', scope: '#', label: 'Records', options: { detail: 'GENERATE' } },
      data: [],
      i18n: { locale: 'bg' },
    });
    expect(
      view.container.querySelector('button[aria-label="Бутон за добавяне към Records"]'),
    ).not.toBeNull();
    expect(view.container.textContent).toContain('Няма данни');
    await view.rerender({
      i18n: {
        locale: 'fr',
        translate: (key: string, fallback?: string) =>
          key === 'array.addAriaLabelWithLabel' ? 'Ajouter à {label}' : (fallback ?? key),
      },
    });
    expect(view.container.querySelector('button[aria-label="Ajouter à Records"]')).not.toBeNull();
  });
});
