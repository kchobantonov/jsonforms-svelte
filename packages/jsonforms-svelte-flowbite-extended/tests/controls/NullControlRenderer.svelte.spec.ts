import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { flowbiteRenderers, flowbiteCells } from '@chobantonov/jsonforms-svelte-flowbite';
import { flowbiteExtendedCells } from '../../src/lib/cells';
import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { nullControlRendererEntry } from '../../src/lib/controls';
import { expectLabelVisible, mountControl, waitForChange } from '../testUtils';

afterEach(cleanup);

describe('NullControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [nullControlRendererEntry];
  const propertySchema: JsonSchema = {
    type: 'null',
    title: 'Nullable marker',
  };

  it('prevents null toggles with separately presented readonly state', async () => {
    const { view, onchange } = mountControl({ renderers, propertySchema, value: null });
    await view.rerender({ readonly: true, config: { separateReadonlyFromDisabled: true } });
    const checkbox = page.getByRole('checkbox');
    await expect.element(checkbox).toBeDisabled();
    await expect.element(checkbox).toBeChecked();
    expect(onchange.mock.lastCall?.[0].data.value).toBeNull();
    await view.rerender({ readonly: false });
    await checkbox.click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toBeUndefined());
  });

  it('renders an unchecked checkbox when the property is unset', () => {
    const { view } = mountControl({
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

  it('marks the checkbox as checked when the value is null', () => {
    const { view } = mountControl({
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
    const { view, onchange } = mountControl({
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
  const view = render(JsonForms, { props });
  const checks = page.getByRole('checkbox');
  await expect.element(checks.nth(0)).toBeChecked();
  await checks.nth(1).click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual({
      rows: [{ marker: null }, { marker: null }],
      untouched: 'keep',
    }),
  );
  await checks.nth(1).click();
  await vi.waitFor(() => {
    const data = onchange.mock.lastCall?.[0].data;
    expect(data).toEqual({ rows: [{ marker: null }, {}], untouched: 'keep' });
    expect(Object.hasOwn(data.rows[1], 'marker')).toBe(false);
  });
  await view.rerender({ ...props, readonly: true });
  await expect.element(checks.nth(0)).toBeDisabled();
});
