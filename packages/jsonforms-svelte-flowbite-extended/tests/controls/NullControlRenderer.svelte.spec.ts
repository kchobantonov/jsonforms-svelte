import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { page } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import { flowbiteRenderers, flowbiteCells } from '@chobantonov/jsonforms-svelte-flowbite';
import { flowbiteExtendedCells } from '../../src/lib/cells';
import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { nullControlRendererEntry } from '../../src/lib/controls';
import { expectLabelVisible, mountControl, waitForChange } from '../testUtils';

afterEach(cleanup);

describe('NullControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [nullControlRendererEntry];
  const propertySchema: JsonSchema = {
    type: 'null',
    title: 'Nullable marker',
  };

  it('associates visible help with the checkbox and preserves authored descriptions', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { ...propertySchema, description: 'Nullable guidance' },
      options: { flowbite: { Checkbox: { 'aria-describedby': 'author-help' } } },
    });
    const checkbox = view.container.querySelector<HTMLElement>(
      'input[type="checkbox"][id$="-input"]',
    )!;
    expect(checkbox.getAttribute('aria-describedby')?.split(' ')).toContain('author-help');
    checkbox.focus();
    await vi.waitFor(() => {
      const help = view.container.querySelector<HTMLElement>('[id$="-help"]')!;
      expect(help.textContent).toContain('Nullable guidance');
      expect(checkbox.getAttribute('aria-describedby')?.split(' ')).toContain(help.id);
    });
  });

  it('retains an accessible label when the native field wrapper is hidden', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
      options: { hideControlWrapper: true },
    });
    const checkbox = view.container.querySelector<HTMLElement>(
      '[role="checkbox"], input[type="checkbox"]',
    )!;
    const label = view.container.querySelector<HTMLLabelElement>('label.sr-only');
    expect(checkbox).toBeTruthy();
    expect(label?.htmlFor).toBe(checkbox.id);
    expect(label?.textContent?.trim()).toBe('Nullable marker');
  });

  it('prevents null toggles with separately presented readonly state', async () => {
    const { view, onchange } = await mountControl({ renderers, propertySchema, value: null });
    await view.rerender({ readonly: true, config: { separateReadonlyFromDisabled: true } });
    const checkbox = page.getByRole('checkbox');
    await expect.element(checkbox).toBeDisabled();
    await expect.element(checkbox).toBeChecked();
    expect(onchange.mock.lastCall?.[0].data.value).toBeNull();
    await view.rerender({ readonly: false });
    await checkbox.click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBeUndefined());
  });

  it('renders an unchecked checkbox when the property is unset', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
    });

    const input = view.container.querySelector<HTMLInputElement>(
      'input[type="checkbox"][id$="-input"]',
    );
    expect(input).toBeTruthy();
    expect(input?.checked).toBe(false);
    expectLabelVisible(view.container, 'Nullable marker');
  });

  it('marks the checkbox as checked when the value is null', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
      value: null,
    });

    const input = view.container.querySelector<HTMLInputElement>(
      'input[type="checkbox"][id$="-input"]',
    );
    expect(input).toBeTruthy();
    expect(input?.checked).toBe(true);
  });

  it('updates core data to null when checked and removes it when unchecked', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema,
    });

    const input = view.container.querySelector<HTMLInputElement>(
      'input[type="checkbox"][id$="-input"]',
    );
    expect(input).toBeTruthy();

    let before = onchange.mock.calls.length;
    input!.checked = true;
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    let changeEvent = await waitForChange(onchange, before);
    expect(changeEvent.data.value).toBeNull();

    before = onchange.mock.calls.length;
    input!.checked = false;
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    changeEvent = await waitForChange(onchange, before);
    expect(changeEvent.data.value).toBeUndefined();
  });
});

it('keeps compact-cell help available to assistive technology without a visible duplicate', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: { marker: { type: 'null', description: 'Marker guidance' } },
            },
          },
        },
      },
      uischema: { type: 'Control', scope: '#/properties/rows', options: { table: true } },
      data: { rows: [{ marker: null }] },
      renderers: [...flowbiteRenderers, nullControlRendererEntry],
      cells: [...flowbiteCells, ...flowbiteExtendedCells],
    },
  });
  const checkbox = view.container.querySelector<HTMLElement>('td [id$="-input"]')!;
  await vi.waitFor(() => expect(checkbox).not.toBeNull());
  checkbox.focus();
  await vi.waitFor(() => {
    const help = view.container.querySelector<HTMLElement>('[id$="-help"]')!;
    expect(help.textContent).toContain('Marker guidance');
    expect(help.classList.contains('sr-only')).toBe(true);
    expect(checkbox.getAttribute('aria-describedby')?.split(' ')).toContain(help.id);
  });
});

it('dispatches null table cells, stores null and clears to absence without changing siblings', async () => {
  const onchange = vi.fn();
  const props = {
    schema: {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: { type: 'object', properties: { marker: { type: 'null' } } },
        },
      },
    },
    uischema: { type: 'Control', scope: '#/properties/rows', options: { table: true } },
    data: { rows: [{ marker: null }, {}], untouched: 'keep' },
    renderers: [...flowbiteRenderers, nullControlRendererEntry],
    cells: [...flowbiteCells, ...flowbiteExtendedCells],
    onchange,
  };
  const view = await render(JsonForms, { props });
  const checks = [...view.container.querySelectorAll<HTMLInputElement>('td [id$="-input"]')];
  await vi.waitFor(() => expect(checks[0].checked).toBe(true));
  checks[1].click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual({
      rows: [{ marker: null }, { marker: null }],
      untouched: 'keep',
    }),
  );
  checks[1].click();
  await vi.waitFor(() => {
    const data = onchange.mock.lastCall?.[0].data;
    expect(data).toEqual({ rows: [{ marker: null }, {}], untouched: 'keep' });
    expect(Object.hasOwn(data.rows[1], 'marker')).toBe(false);
  });
  await view.rerender({ ...props, readonly: true });
  await vi.waitFor(() => expect(checks[0].disabled).toBe(true));
});
