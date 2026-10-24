import '../../../jsonforms-svelte-shadcn/tests/test.css';
import { createCatalogTranslator } from '@chobantonov/jsonforms-svelte';
import { tick } from 'svelte';
import { arrayControlRendererEntry, shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-svelte';
import { colorCellEntry } from '../../src/lib/cells';
import { colorControlRendererEntry } from '../../src/lib/controls';
import { mountControl, mountForm, waitForChange } from '../testUtils';

describe('ColorControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  async function openPicker(view: { container: HTMLElement }) {
    await page.elementLocator(view.container.querySelector('[data-color-trigger]')!).click();
    await vi.waitFor(() =>
      expect(document.querySelector('[data-color-spectrum] input[type="range"]')).not.toBeNull(),
    );
    return document.querySelector<HTMLInputElement>('[data-color-spectrum] input[type="range"]')!;
  }

  async function selectView(value: string) {
    await page.getByRole('button', { name: 'Color channels' }).click();
    await page.getByRole('option', { name: value, exact: true }).click();
  }

  const pattern = '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$';
  const propertySchema: JsonSchema = {
    type: 'string',
    format: 'color',
    pattern,
    title: 'Color',
  };
  const renderers = [colorControlRendererEntry];

  it('keeps readonly text inspectable and rejects stale spectrum interactions', async () => {
    const { view, onchange } = await mountControl({ renderers, propertySchema, value: '#112233' });
    await view.rerender({ config: { separateReadonlyFromDisabled: true } });
    const text = view.container.querySelector<HTMLInputElement>('input[type="text"]')!;
    const picker = await openPicker(view);
    await view.rerender({ readonly: true });
    expect(text.readOnly).toBe(true);
    expect(text.disabled).toBe(false);
    text.focus();
    expect(document.activeElement).toBe(text);
    expect(view.container.querySelector<HTMLButtonElement>('[data-color-trigger]')!.disabled).toBe(
      true,
    );
    picker.value = '120';
    picker.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();
    expect(onchange.mock.lastCall?.[0].data.value).toBe('#112233');
    await view.rerender({ readonly: false });
    await openPicker(view);
    await page.getByRole('slider', { name: 'Saturation and brightness' }).click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).not.toBe('#112233'));
  });

  it('renders editable text and normalizes the native picker preview', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
      value: '#abc',
    });

    const textInput = view.container.querySelector<HTMLInputElement>(
      'input[type="text"][id$="-input"]',
    );
    const picker = view.container.querySelector<HTMLButtonElement>('[data-color-trigger]');

    expect(textInput?.value).toBe('#abc');
    expect(textInput?.maxLength).toBe(-1);
    expect(picker).toBeTruthy();

    expect(textInput?.closest('div.relative')?.contains(picker!)).toBe(true);
    const textRect = textInput!.getBoundingClientRect();
    const pickerRect = picker!
      .closest<HTMLElement>('[data-color-picker-wrapper]')!
      .getBoundingClientRect();
    expect(
      Math.abs(textRect.y + textRect.height / 2 - (pickerRect.y + pickerRect.height / 2)),
    ).toBeLessThan(1);
    await openPicker(view);
    expect(document.querySelector('input[type=color]')).toBeNull();
    await expect.element(page.getByRole('textbox', { name: 'Hex color' })).toHaveValue('#aabbcc');
  });

  it('shows a neutral checkerboard instead of the native black fallback', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
      value: undefined,
    });

    const picker = view.container.querySelector<HTMLButtonElement>('[data-color-trigger]');
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
  });

  it('keeps unsupported and incomplete input local, including across unrelated data updates', async () => {
    const { view, onchange } = await mountControl({ renderers, propertySchema, value: '#abc' });
    const input = view.container.querySelector<HTMLInputElement>('input[type="text"]')!;
    const before = onchange.mock.calls.length;
    input.value = 'rgba(12,';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();
    expect(input.value).toBe('rgba(12,');
    expect(onchange.mock.calls).toHaveLength(before);
    expect(view.container.querySelector('[role="alert"]')?.textContent).toContain(
      'supported color',
    );
    await view.rerender({ data: { value: '#abc', unrelated: true } });
    expect(input.value).toBe('rgba(12,');
    await view.rerender({ data: { value: '#123456' } });
    await vi.waitFor(() => expect(input.value).toBe('#123456'));
  });

  it('lets a user type through valid hex prefixes without expanding text under the caret', async () => {
    const { view, onchange } = await mountControl({ renderers, propertySchema, value: '#fff' });
    const input = view.container.querySelector<HTMLInputElement>('input[type="text"]')!;
    for (const value of ['#1', '#12', '#123', '#1234', '#12345', '#123456']) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await tick();
      expect(input.value).toBe(value);
    }
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe('#123456'));
  });

  it('serializes functional text and picker edits using the namespaced format while retaining alpha', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'color' },
      value: '#abc',
    });
    await view.rerender({
      config: { colorSaveFormat: 'hex', jsonformsExtended: { colorSaveFormat: 'rgb' } },
    });
    const input = view.container.querySelector<HTMLInputElement>('input[type="text"]')!;
    expect(input.value).toBe('#abc');
    input.value = 'hsla(120, 100%, 50%, .5)';
    const before = onchange.mock.calls.length;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changed = await waitForChange(onchange, before);
    expect(changed.data.value).toBe('rgba(0, 255, 0, 0.5)');
    expect(changed.errors).toEqual([]);
    const picker = await openPicker(view);
    picker.value = '240';
    picker.dispatchEvent(new Event('input', { bubbles: true }));
    picker.dispatchEvent(new FocusEvent('blur'));
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.value).toBe('rgba(0, 0, 255, 0.5)'),
    );
  });

  it('supports picker-only entry with localized clear actions and local overrides', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema,
      value: '#abc',
      options: { clearable: true },
    });
    await view.rerender({
      config: { jsonformsExtended: { colorTextEntry: false } },
      i18n: { locale: 'bg' },
    });
    expect(view.container.querySelector('input[type="text"]')).toBeNull();
    const picker = view.container.querySelector<HTMLButtonElement>('[data-color-trigger]')!;
    expect(picker.id).toMatch(/-input$/);
    expect(picker.getAttribute('aria-label')).toBe('Color');
    expect(picker.title).toBe('Избор на цвят');
    await view.rerender({
      i18n: {
        locale: 'bg',
        translate: createCatalogTranslator('bg', { bg: { 'editor.chooseColor': 'Палитра' } }),
      },
    });
    expect(picker.title).toBe('Палитра');

    const clear = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Изчистване на цвета"]',
    )!;
    expect(clear).not.toBeNull();
    clear.click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBeUndefined());
    await view.rerender({
      uischema: { type: 'Control', scope: '#/properties/value', options: { colorTextEntry: true } },
    });
    expect(view.container.querySelector('input[type="text"]')).not.toBeNull();
  });

  it('selects directly inside one popup with pointer and keyboard controls', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema,
      value: '#ff000080',
    });
    await openPicker(view);
    expect(document.querySelector('input[type=color]')).toBeNull();
    const area = page.getByRole('slider', { name: 'Saturation and brightness' });
    await area.click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).not.toBe('#ff000080'));
    const before = onchange.mock.lastCall?.[0].data.value;
    await userEvent.keyboard('{ArrowUp}');
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).not.toBe(before));
    expect(onchange.mock.lastCall?.[0].data.value).toMatch(/80$/);
  });

  it('renders the color control inside a table cell', async () => {
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
    const { view, onchange } = await mountForm({
      schema,
      uischema,
      data: { rows: [{ color: '#12345680' }, {}] },
      renderers: [arrayControlRendererEntry, colorControlRendererEntry],
      cells: [colorCellEntry],
    });

    expect(
      view.container.querySelector<HTMLInputElement>('input[type="text"][id$="-input"]')?.value,
    ).toBe('#12345680');
    await openPicker(view);
    await expect.element(page.getByRole('textbox', { name: 'Hex color' })).toHaveValue('#12345680');
    expect(view.container.querySelector('[data-color-empty-swatch]')).toBeTruthy();
    await selectView('RGB');
    await page.getByRole('spinbutton', { name: 'Red', exact: true }).fill('255');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual({ rows: [{ color: '#ff345680' }, {}] }),
    );
    await userEvent.keyboard('{Escape}');
    const text = view.container.querySelector<HTMLInputElement>('td input[type="text"]')!;
    text.value = 'rgba(12,';
    text.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await tick();
    expect(text.getAttribute('aria-invalid')).toBe('true');
    expect(text.closest('td')!.textContent).toContain('supported color');
    expect(onchange.mock.lastCall?.[0].data).toEqual({ rows: [{ color: '#ff345680' }, {}] });
  });
  it('keeps the save format independent of channel views and resets the view on reopen', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', format: 'color' },
      value: 'rgb(255, 0, 0)',
    });
    await view.rerender({ config: { jsonformsExtended: { colorSaveFormat: 'rgb' } } });
    await openPicker(view);
    expect(document.querySelector('input[aria-label="Red"]')).not.toBeNull();
    const before = onchange.mock.calls.length;
    await selectView('HSB');
    const channelInputs = ['Hue', 'Saturation (%)', 'Brightness (%)'].map(
      (label) =>
        document.querySelector<HTMLInputElement>(`input[type="number"][aria-label="${label}"]`)!,
    );
    await expect
      .poll(() => {
        const tops = channelInputs.map((input) => input.getBoundingClientRect().top);
        return Math.max(...tops) - Math.min(...tops);
      })
      .toBeLessThan(1);
    expect(onchange.mock.calls).toHaveLength(before);
    await page.getByRole('spinbutton', { name: 'Hue', exact: true }).fill('120');
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe('rgb(0, 255, 0)'));
    await page.getByRole('spinbutton', { name: 'Opacity (%)', exact: true }).fill('50');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.value).toBe('rgba(0, 255, 0, 0.5)'),
    );
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.querySelector('[data-color-channels]')).toBeNull());
    await openPicker(view);
    expect(document.querySelector<HTMLInputElement>('input[aria-label="Green"]')?.value).toBe(
      '255',
    );
    expect(document.querySelector<HTMLInputElement>('input[aria-label="Opacity (%)"]')?.value).toBe(
      '50',
    );
  });

  it('rejects hex3 transparency without losing the draft and allows an opaque repair', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema,
      value: '#abc',
    });
    await view.rerender({ config: { jsonformsExtended: { colorSaveFormat: 'hex3' } } });
    await openPicker(view);
    const before = onchange.mock.calls.length;
    await page.getByRole('spinbutton', { name: 'Opacity (%)', exact: true }).fill('50');
    expect(onchange.mock.calls).toHaveLength(before);
    expect(document.querySelector('[data-color-channels] [role="alert"]')?.textContent).toContain(
      'transparency',
    );
    expect(document.querySelector<HTMLInputElement>('input[aria-label="Opacity (%)"]')?.value).toBe(
      '50',
    );
    await page.getByRole('spinbutton', { name: 'Opacity (%)', exact: true }).fill('100');
    await vi.waitFor(() =>
      expect(document.querySelector('[data-color-channels] [role="alert"]')).toBeNull(),
    );
    expect(onchange.mock.lastCall?.[0].data.value).toBe('#abc');
  });

  it('preserves invalid imported colors until edited and translates picker fields through the host catalog', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema,
      value: 'invalid',
      options: { clearable: true },
    });
    await view.rerender({
      config: { jsonformsExtended: { colorTextEntry: false } },
      i18n: {
        locale: 'fr',
        translate: createCatalogTranslator('fr', {
          fr: { 'color.hex': 'Couleur', 'color.alpha': 'Opacité' },
        }),
      },
    });
    const before = onchange.mock.calls.length;
    await openPicker(view);
    expect(onchange.mock.calls).toHaveLength(before);
    expect(document.querySelector<HTMLInputElement>('input[aria-label="Couleur"]')?.value).toBe('');
    await page.getByRole('textbox', { name: 'Couleur', exact: true }).fill('#12345680');
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBe('#12345680'));
    expect(document.querySelector<HTMLInputElement>('input[aria-label="Opacité"]')?.value).toBe(
      '50',
    );
    await page.getByRole('button', { name: 'Clear value', exact: true }).click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBeUndefined());
  });
  it('selects the native picker for a plain string with local format color through the real registry', async () => {
    const { view, onchange } = await mountControl({
      renderers: [colorControlRendererEntry, ...shadcnRenderers],
      propertySchema: { type: 'string' },
      value: 'rgb(82, 196, 26)',
      options: { format: 'color', colorSaveFormat: 'rgb' },
    });
    await openPicker(view);
    await page.getByRole('spinbutton', { name: 'Red', exact: true }).fill('100');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.value).toBe('rgb(100, 196, 26)'),
    );
  });
  it('anchors the native popup to its swatch instead of the document origin', async () => {
    const { view } = await mountControl({ renderers, propertySchema, value: '#abc' });
    view.container.style.paddingTop = '180px';
    const picker = await openPicker(view);
    const trigger = view.container.querySelector<HTMLElement>('[data-color-trigger]')!;
    await vi.waitFor(() => {
      const popup = picker.parentElement!.parentElement!.getBoundingClientRect();
      const anchor = trigger.getBoundingClientRect();
      expect(popup.top).toBeGreaterThanOrEqual(anchor.bottom);
      expect(popup.top - anchor.bottom).toBeLessThan(40);
    });
  });
});
