import { arrayControlRendererEntry } from '@chobantonov/jsonforms-svelte-shadcn';
import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { colorCellEntry } from '../../src/lib/cells';
import { colorControlRendererEntry } from '../../src/lib/controls';
import { mountControl, mountForm, waitForChange } from '../testUtils';

describe('ColorControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const pattern = '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$';
  const propertySchema: JsonSchema = {
    type: 'string',
    format: 'color',
    pattern,
    title: 'Color',
  };
  const renderers = [colorControlRendererEntry];

  it('renders editable text and normalizes the native picker preview', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      value: '#abc',
    });

    const textInput = view.container.querySelector<HTMLInputElement>(
      'input[type="text"][id$="-input"]',
    );
    const picker = view.container.querySelector<HTMLInputElement>('input[type="color"]');

    expect(textInput?.value).toBe('#abc');
    expect(textInput?.maxLength).toBe(9);
    expect(picker?.value).toBe('#aabbcc');

    expect(textInput?.closest('div.relative')?.contains(picker!)).toBe(true);
  });

  it('uses Maska to remove non-hex characters and enforce the maximum length', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: '#abc',
    });
    const input = view.container.querySelector<HTMLInputElement>(
      'input[type="text"][id$="-input"]',
    );
    expect(input).toBeTruthy();

    const before = onchange.mock.calls.length;
    input!.value = 'abz12Gf!345678';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(input!.value).toBe('#ab12f345');
    expect(changeEvent.data.value).toBe('#ab12f345');
  });

  it('updates core data from the native picker', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: '#abc',
    });
    const picker = view.container.querySelector<HTMLInputElement>('input[type="color"]');
    expect(picker).toBeTruthy();

    const before = onchange.mock.calls.length;
    picker!.value = '#123456';
    picker!.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('#123456');
  });

  it('renders the color control inside a table cell', () => {
    const schema = {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: { color: propertySchema },
          },
        },
      },
    } as JsonSchema;
    const uischema = {
      type: 'Control',
      scope: '#/properties/rows',
      options: { table: true },
    } as UISchemaElement;
    const { view } = mountForm({
      schema,
      uischema,
      data: { rows: [{ color: '#12345680' }] },
      renderers: [arrayControlRendererEntry, colorControlRendererEntry],
      cells: [colorCellEntry],
    });

    expect(
      view.container.querySelector<HTMLInputElement>('input[type="text"][id$="-input"]')?.value,
    ).toBe('#12345680');
    expect(view.container.querySelector<HTMLInputElement>('input[type="color"]')?.value).toBe(
      '#123456',
    );
  });
});
