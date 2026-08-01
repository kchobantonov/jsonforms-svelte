import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import AgGridInteractionHarness from './AgGridInteractionHarness.svelte';

const inputSelector = 'input:not([type="checkbox"]):not([type="color"]):not([type="hidden"])';

function expectColumnControlCentered(row: HTMLElement, column: string, selector: string): void {
  const cell = row.querySelector<HTMLElement>(`.ag-cell[col-id="${column}"]`);
  const control = cell?.querySelector<HTMLElement>(selector);

  expect(cell, `Expected the ${column} cell`).toBeTruthy();
  expect(control, `Expected a control in the ${column} cell`).toBeTruthy();

  const cellRect = cell!.getBoundingClientRect();
  const controlRect = control!.getBoundingClientRect();
  expect(controlRect.height).toBeLessThanOrEqual(cellRect.height);
  expect(
    Math.abs(controlRect.y + controlRect.height / 2 - (cellRect.y + cellRect.height / 2)),
    `${column} should be vertically centered`,
  ).toBeLessThan(2.1);
}

afterEach(() => {
  cleanup();
  document.body.style.pointerEvents = '';
  document.body.style.overflow = '';
});

describe('AG Grid cell interactions', () => {
  it('vertically centers scalar and composite cell controls', async () => {
    const view = render(AgGridInteractionHarness);

    await vi.waitFor(
      () =>
        expect(
          view.container.querySelector('.ag-cell[col-id="tags"] button[aria-label="Edit Tags"]'),
        ).toBeTruthy(),
      { timeout: 5000 },
    );
    const row = view.container.querySelector<HTMLElement>('.ag-row');
    expect(row).toBeTruthy();

    for (const [column, selector] of [
      ['firstName', inputSelector],
      ['age', inputSelector],
      ['role', 'button[aria-haspopup="listbox"]'],
      ['tenure', inputSelector],
      ['date', inputSelector],
      ['time', inputSelector],
      ['dateTime', inputSelector],
      ['status', 'button[aria-haspopup="listbox"]'],
      ['favoriteColor', inputSelector],
      ['active', '[data-slot="checkbox"]'],
      ['address', 'button[aria-label="Edit Address"]'],
      ['tags', 'button[aria-label="Edit Tags"]'],
    ]) {
      expectColumnControlCentered(row!, column, selector);
    }
  });

  it('keeps date and select cells interactive after adding and updating a row', async () => {
    const view = render(AgGridInteractionHarness);

    await vi.waitFor(() => expect(view.container.querySelectorAll('.ag-row')).toHaveLength(1));
    await vi.waitFor(() =>
      expect(
        view.container.querySelector('.ag-cell[col-id="favoriteColor"] input[type="color"]'),
      ).toBeTruthy(),
    );
    await vi.waitFor(() =>
      expect(
        view.container.querySelector('.ag-cell[col-id="active"] [data-slot="checkbox"]'),
      ).toBeTruthy(),
    );
    const existingRow = view.container.querySelector<HTMLElement>('.ag-row');
    const colorCell = existingRow?.querySelector<HTMLElement>('.ag-cell[col-id="favoriteColor"]');
    const colorPicker = colorCell?.querySelector<HTMLInputElement>('input[type="color"]');
    const colorText = colorCell?.querySelector<HTMLInputElement>(
      'input:not([type="color"]):not([type="hidden"])',
    );
    expect(colorPicker).toBeTruthy();
    expect(colorText?.value).toBe('#7c3aed');
    expect(colorPicker!.getBoundingClientRect().width).toBeLessThan(
      colorCell!.getBoundingClientRect().width / 2,
    );
    expect(colorText!.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      colorCell!.getBoundingClientRect().width - 2,
    );

    const booleanCell = existingRow?.querySelector<HTMLElement>('.ag-cell[col-id="active"]');
    const checkbox = booleanCell?.querySelector<HTMLElement>('[data-slot="checkbox"]');
    expect(booleanCell?.classList.contains('jsonforms-ag-grid-boolean-cell')).toBe(true);
    expect(checkbox).toBeTruthy();
    const booleanRect = booleanCell!.getBoundingClientRect();
    const checkboxRect = checkbox!.getBoundingClientRect();
    expect(checkboxRect.width).toBeGreaterThan(0);
    expect(checkboxRect.width).toBeLessThanOrEqual(20);
    expect(checkboxRect.height).toBeLessThanOrEqual(20);
    expect(getComputedStyle(checkbox!).visibility).toBe('visible');
    expect(
      Math.abs(checkboxRect.x + checkboxRect.width / 2 - (booleanRect.x + booleanRect.width / 2)),
    ).toBeLessThan(3);
    expect(
      Math.abs(checkboxRect.y + checkboxRect.height / 2 - (booleanRect.y + booleanRect.height / 2)),
    ).toBeLessThan(3);
    const gridContainer = view.container.querySelector<HTMLElement>('[data-jsonforms-ag-grid]');
    expect(getComputedStyle(gridContainer!).borderTopWidth).toBe('0px');
    expect(getComputedStyle(gridContainer!).borderRadius).toBe('0px');

    const addButton = view.container.querySelector<HTMLButtonElement>(
      '.jsonforms-ag-grid__button--add',
    );
    expect(addButton).toBeTruthy();
    expect(addButton?.disabled).toBe(false);
    addButton?.click();
    await expect.element(page.getByLabelText('Comment count')).toHaveTextContent('2');
    await vi.waitFor(() => expect(view.container.querySelectorAll('.ag-row')).toHaveLength(2));

    let newRow = Array.from(view.container.querySelectorAll<HTMLElement>('.ag-row')).at(-1);
    const emptyColorSwatch = newRow?.querySelector<HTMLElement>(
      '.ag-cell[col-id="favoriteColor"] [data-color-empty-swatch]',
    );
    expect(emptyColorSwatch).toBeTruthy();
    expect(emptyColorSwatch?.querySelector('[data-color-empty-pattern]')).toBeTruthy();
    const dateCell = newRow?.querySelector<HTMLElement>('.ag-cell[col-id="date"]');
    const dateInput = dateCell?.querySelector<HTMLInputElement>(inputSelector);
    expect(dateInput).toBeTruthy();
    expect(dateCell).toBeTruthy();
    expect(getComputedStyle(dateInput!).borderTopWidth).toBe('0px');
    expect(getComputedStyle(dateInput!).borderRadius).toBe('0px');
    const dateControl = dateInput?.closest<HTMLElement>('.group') ?? dateInput?.parentElement;
    expect(dateControl).toBeTruthy();
    expect(dateInput!.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      dateControl!.getBoundingClientRect().width - 2,
    );
    dateInput?.focus();
    expect(getComputedStyle(dateInput!).boxShadow).toBe('none');

    const dateTrigger = newRow?.querySelector<HTMLButtonElement>('[aria-label="Choose date"]');
    expect(dateTrigger).toBeTruthy();
    dateTrigger?.click();

    let day: HTMLButtonElement | undefined;
    await vi.waitFor(() => {
      day = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-bits-day]')).find(
        (candidate) =>
          candidate.getAttribute('aria-disabled') !== 'true' &&
          candidate.getAttribute('data-outside-month') === null,
      );
      expect(day).toBeTruthy();
    });
    day?.click();

    await vi.waitFor(() => {
      expect(document.querySelector('[data-slot="popover-content"][data-state="open"]')).toBeNull();
      expect(view.container.querySelectorAll('.ag-row')).toHaveLength(2);
    });

    newRow = Array.from(view.container.querySelectorAll<HTMLElement>('.ag-row')).at(-1);
    const selectTrigger = newRow?.querySelector<HTMLButtonElement>(
      '.ag-cell[col-id="status"] button[aria-haspopup="listbox"]',
    );
    expect(selectTrigger).toBeTruthy();
    const selectCell = selectTrigger?.closest<HTMLElement>('.jsonforms-ag-grid-data-cell');
    expect(selectCell).toBeTruthy();
    expect(getComputedStyle(selectTrigger!).borderTopWidth).toBe('0px');
    expect(getComputedStyle(selectTrigger!).borderRadius).toBe('0px');
    const selectControl =
      selectTrigger?.closest<HTMLElement>('.group') ?? selectTrigger?.parentElement;
    expect(selectControl).toBeTruthy();
    expect(selectTrigger!.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      selectControl!.getBoundingClientRect().width - 2,
    );
    selectTrigger?.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
    );

    let option: HTMLElement | undefined;
    await vi.waitFor(() => {
      option = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find(
        (candidate) => candidate.textContent?.trim() === 'new',
      );
      expect(option).toBeTruthy();
    });
    option?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }));

    await vi.waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
      expect(document.querySelector('[role="option"]')).toBeNull();
    });
    await page.getByRole('button', { name: 'Outside action' }).click();
    await expect
      .element(page.getByRole('button', { name: 'Outside action 1' }))
      .toBeInTheDocument();
  });
});
