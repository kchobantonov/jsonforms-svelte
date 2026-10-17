import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import { page, userEvent } from 'vitest/browser';
import { arrayControlRendererEntry } from '@chobantonov/jsonforms-svelte-skeleton';
import { clearAllIds, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { durationControlRendererEntry } from '../../src/lib/controls';
import { durationCellEntry } from '../../src/lib/cells';
import { expectLabelVisible, mountControl, mountForm, waitForChange } from '../testUtils';

describe('DurationControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [durationControlRendererEntry];
  const propertySchema: JsonSchema = {
    type: 'string',
    format: 'duration',
    title: 'Duration',
  };

  it('renders duration input when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      options: { placeholder: 'Enter duration' },
    });

    const input = view.container.querySelector<HTMLInputElement>(
      'input[type="text"][id$="-input"]',
    );
    expect(input).toBeTruthy();
    expect(input?.value).toBe('');
    expect(input?.getAttribute('placeholder')).toBe('Enter duration');
    expectLabelVisible(view.container, 'Duration');
  });

  it('updates core data on valid duration input', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: 'P1D',
    });

    const input = view.container.querySelector<HTMLInputElement>(
      'input[type="text"][id$="-input"]',
    );
    expect(input).toBeTruthy();
    expect(input?.value).toBe('P1D');

    const before = onchange.mock.calls.length;
    input!.value = 'P2DT3H';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('P2DT3H');
  });

  it('updates core data via duration picker fields when actions are disabled', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      options: { showActions: false },
    });

    const menuButton = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Choose duration"]',
    );
    expect(menuButton).toBeTruthy();
    menuButton!.click();

    await vi.waitFor(() => {
      expect(document.querySelectorAll('input[type="number"]').length).toBeGreaterThan(0);
    });

    document.querySelector<HTMLButtonElement>('button[aria-pressed="false"]')!.click();
    await vi.waitFor(() =>
      expect(document.querySelector('button[aria-pressed="true"]')?.textContent).toContain('Weeks'),
    );

    const numberInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[type="number"]'),
    );
    const weeksInput = numberInputs[0];
    expect(weeksInput).toBeTruthy();

    const before = onchange.mock.calls.length;
    weeksInput.value = '2';
    weeksInput.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('P2W');
  });

  it('renders the duration control inside a table cell', () => {
    const schema = {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: { duration: propertySchema },
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
      data: { rows: [{ duration: 'P3D' }] },
      renderers: [arrayControlRendererEntry, durationControlRendererEntry],
      cells: [durationCellEntry],
    });

    expect(view.container.querySelector<HTMLInputElement>('input[id$="-input"]')?.value).toBe(
      'P3D',
    );
    expect(
      view.container.querySelector<HTMLButtonElement>('button[aria-label="Choose duration"]'),
    ).toBeTruthy();
  });
  it('retains an incomplete nested draft without replacing data, then accepts uncapped exact text', async () => {
    const { view, onchange } = mountControl({ renderers, propertySchema, value: 'P1D' });
    const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
    const before = onchange.mock.calls.length;
    input.value = 'P1DT';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
    expect(input.value).toBe('P1DT');
    expect(onchange.mock.calls.length).toBe(before);
    expect(view.container.querySelector('[role="status"]')?.textContent).toContain(
      'Complete the duration',
    );
    input.value = 'P001DT90M';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changed = await waitForChange(onchange, before);
    expect(changed.data.value).toBe('P001DT90M');
    expect(input.value).toBe('P001DT90M');
  });
  it('opens by keyboard, stages added quantities and discards cancelled edits', async () => {
    const { onchange } = mountControl({ renderers, propertySchema, value: 'PT1H' });
    const trigger = page
      .getByRole('button', { name: 'Choose duration' })
      .element() as HTMLButtonElement;
    expect(trigger.tabIndex).toBeGreaterThanOrEqual(0);
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await expect
      .element(page.getByRole('spinbutton', { name: 'Hours', exact: true }))
      .toBeVisible();
    const select = page.getByRole('combobox', { name: 'Add unit' }).element() as HTMLSelectElement;
    select.value = 'minutes';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const minutes = page.getByRole('spinbutton', { name: 'Minutes', exact: true });
    await expect.element(minutes).toBeVisible();
    const before = onchange.mock.calls.length;
    await minutes.fill('90');
    await page.getByRole('button', { name: 'Remove Hours', exact: true }).click();
    expect(onchange.mock.calls.length).toBe(before);
    await page.getByRole('button', { name: messages.en['duration.ok'], exact: true }).click();
    const changed = await waitForChange(onchange, before);
    expect(changed.data.value).toBe('PT90M');
    await page.getByRole('button', { name: 'Choose duration' }).click();
    await page.getByRole('spinbutton', { name: 'Minutes', exact: true }).fill('120');
    const committed = onchange.mock.calls.length;
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect
      .element(page.getByRole('combobox', { name: 'Duration', exact: true }))
      .toHaveValue('PT90M');
    expect(onchange.mock.calls.length).toBe(committed);
  });
  it('translates clearing live and hides it when clearable is disabled', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: 'P1D',
      options: { clearable: true },
    });
    (
      page.getByRole('combobox', { name: 'Duration', exact: true }).element() as HTMLInputElement
    ).focus();
    await expect
      .element(page.getByRole('button', { name: messages.en['control.clearValue'], exact: true }))
      .toBeInTheDocument();
    await view.rerender({ i18n: { locale: 'bg' } });
    const clear = page.getByRole('button', {
      name: messages.bg['control.clearValue'],
      exact: true,
    });
    await expect.element(clear).toBeInTheDocument();
    // Reveal the native clear affordance without depending on hover animations.
    const input = page
      .getByRole('combobox', { name: 'Duration', exact: true })
      .element() as HTMLInputElement;
    input.focus();
    const before = onchange.mock.calls.length;
    await clear.click();
    expect((await waitForChange(onchange, before)).data.value).toBeUndefined();
    await expect.element(clear).not.toBeInTheDocument();
    await view.rerender({
      data: { value: 'P1D' },
      uischema: { type: 'Control', scope: '#/properties/value', options: { clearable: false } },
    });
    await expect.element(clear).not.toBeInTheDocument();
  });
});
