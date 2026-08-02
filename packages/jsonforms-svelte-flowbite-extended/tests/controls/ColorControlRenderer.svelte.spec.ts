import { arrayControlRendererEntry } from '@chobantonov/jsonforms-svelte-flowbite';
import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
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

  it('renders editable text and reveals the clear action on interaction', async () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      value: '#abc',
    });

    const textInput = view.container.querySelector<HTMLInputElement>(
      'input[type="text"][id$="-input"]',
    );
    const picker = view.container.querySelector<HTMLInputElement>('input[type="color"]');
    const clearButton = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Clear color"]',
    );

    expect(textInput?.value).toBe('#abc');
    expect(textInput?.maxLength).toBe(9);
    expect(picker?.value).toBe('#aabbcc');
    expect(clearButton).toBeTruthy();
    expect(clearButton?.classList.contains('color-clear-button')).toBe(true);
    expect(clearButton?.closest('.color-control-group')).toBeTruthy();

    const outsideButton = document.createElement('button');
    document.body.append(outsideButton);
    outsideButton.focus();
    const textLocator = page.getByPlaceholder('#RRGGBB');
    await textLocator.unhover();
    expect(getComputedStyle(clearButton!).visibility).toBe('hidden');
    expect(getComputedStyle(clearButton!).opacity).toBe('0');

    await textLocator.hover();
    await vi.waitFor(() => {
      expect(getComputedStyle(clearButton!).visibility).toBe('visible');
      expect(getComputedStyle(clearButton!).opacity).toBe('1');
    });

    const colorGroup = textInput?.closest('.color-control-group');
    expect(colorGroup?.contains(picker!)).toBe(true);
    expect(textInput?.style.paddingInlineStart).toBe('3rem');
    expect(picker?.parentElement?.classList.contains('h-7')).toBe(true);
    expect(picker?.parentElement?.classList.contains('w-9')).toBe(true);
    outsideButton.remove();
  });

  it('shows a neutral checkerboard instead of the native black fallback', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      value: undefined,
    });

    const picker = view.container.querySelector<HTMLInputElement>('input[type="color"]');
    const swatch = view.container.querySelector<HTMLElement>('[data-color-empty-swatch]');
    const pattern = swatch?.querySelector<SVGElement>('[data-color-empty-pattern]');
    const base = pattern?.querySelector<SVGElement>('.color-empty-base');
    const check = pattern?.querySelector<SVGElement>('.color-empty-check');

    expect(picker?.getAttribute('aria-label')).toBe('Choose color; no color selected');
    expect(swatch).toBeTruthy();
    expect(pattern).toBeTruthy();
    expect(base).toBeTruthy();
    expect(check).toBeTruthy();
    expect(getComputedStyle(base!).fill).not.toBe(getComputedStyle(check!).fill);
    expect(getComputedStyle(swatch!).pointerEvents).toBe('none');
    expect(view.container.querySelector('button[aria-label="Clear color"]')).toBeNull();
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
      data: { rows: [{ color: '#12345680' }, {}] },
      renderers: [arrayControlRendererEntry, colorControlRendererEntry],
      cells: [colorCellEntry],
    });

    expect(
      view.container.querySelector<HTMLInputElement>('input[type="text"][id$="-input"]')?.value,
    ).toBe('#12345680');
    expect(view.container.querySelector<HTMLInputElement>('input[type="color"]')?.value).toBe(
      '#123456',
    );
    expect(view.container.querySelector('[data-color-empty-swatch]')).toBeTruthy();
  });
});
