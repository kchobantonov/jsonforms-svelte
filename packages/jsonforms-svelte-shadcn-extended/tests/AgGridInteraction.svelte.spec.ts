import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import AgGridInteractionHarness from './AgGridInteractionHarness.svelte';
import './test.css';

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
  it('does not render a separator above the rounded grid border', async () => {
    const view = render(AgGridInteractionHarness);

    await vi.waitFor(() => expect(view.container.querySelector('.ag-root')).toBeTruthy());
    const toolbar = view.container.querySelector<HTMLElement>('.jsonforms-ag-grid__toolbar');
    expect(toolbar).toBeTruthy();
    expect(getComputedStyle(toolbar!).borderBottomWidth).toBe('0px');
  });

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

  it('vertically centers the native color selector', async () => {
    const view = render(AgGridInteractionHarness);

    await vi.waitFor(
      () =>
        expect(
          view.container.querySelector('.ag-cell[col-id="favoriteColor"] input[type="color"]'),
        ).toBeTruthy(),
      { timeout: 5000 },
    );
    const row = view.container.querySelector<HTMLElement>('.ag-row');
    expectColumnControlCentered(row!, 'favoriteColor', 'input[type="color"]');

    const picker = row!.querySelector<HTMLInputElement>(
      '.ag-cell[col-id="favoriteColor"] input[type="color"]',
    )!;
    const text = row!.querySelector<HTMLInputElement>(
      `.ag-cell[col-id="favoriteColor"] ${inputSelector}`,
    )!;
    const pickerRect = picker.getBoundingClientRect();
    const textRect = text.getBoundingClientRect();
    expect(
      Math.abs(pickerRect.y + pickerRect.height / 2 - (textRect.y + textRect.height / 2)),
    ).toBeLessThan(2.1);
  });

  it('preserves cell component instances when a color value changes', async () => {
    const view = render(AgGridInteractionHarness);

    await vi.waitFor(
      () =>
        expect(
          view.container.querySelector('.ag-cell[col-id="favoriteColor"] input[type="color"]'),
        ).toBeTruthy(),
      { timeout: 5000 },
    );
    const colorCellHost = view.container.querySelector<HTMLElement>(
      '.ag-cell[col-id="favoriteColor"] .jsonforms-ag-grid-cell-host',
    );
    const picker = colorCellHost?.querySelector<HTMLInputElement>('input[type="color"]');
    const firstNameInput = view.container.querySelector<HTMLInputElement>(
      `.ag-cell[col-id="firstName"] ${inputSelector}`,
    );
    expect(colorCellHost).toBeTruthy();
    expect(picker).toBeTruthy();
    expect(firstNameInput).toBeTruthy();

    picker!.value = '#123456';
    picker!.dispatchEvent(new Event('input', { bubbles: true }));
    picker!.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.waitFor(
      () =>
        expect(
          view.container.querySelector<HTMLInputElement>(
            `.ag-cell[col-id="favoriteColor"] ${inputSelector}`,
          )?.value,
        ).toBe('#123456'),
      { timeout: 2000 },
    );
    expect(
      view.container.querySelector('.ag-cell[col-id="favoriteColor"] .jsonforms-ag-grid-cell-host'),
    ).toBe(colorCellHost);
    expect(
      view.container.querySelector('.ag-cell[col-id="favoriteColor"] input[type="color"]'),
    ).toBe(picker);
    expect(view.container.querySelector(`.ag-cell[col-id="firstName"] ${inputSelector}`)).toBe(
      firstNameInput,
    );
  });

  it('keeps date and select cells mounted and enabled after adding and updating a row', async () => {
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
    let emptyColorSwatch: HTMLElement | null | undefined;
    await vi.waitFor(() => {
      newRow = Array.from(view.container.querySelectorAll<HTMLElement>('.ag-row')).at(-1);
      emptyColorSwatch = newRow?.querySelector<HTMLElement>(
        '.ag-cell[col-id="favoriteColor"] [data-color-empty-swatch]',
      );
      expect(emptyColorSwatch).toBeTruthy();
    });
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
    expect(getComputedStyle(dateInput!).boxShadow).toBe('none');

    dateInput!.value = '07/20/2026';
    dateInput!.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.waitFor(() => expect(view.container.querySelectorAll('.ag-row')).toHaveLength(2));

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
    expect(selectTrigger?.isConnected).toBe(true);
    expect(selectTrigger?.disabled).toBe(false);
    expect(document.body.style.pointerEvents).not.toBe('none');
    await vi.waitFor(
      () => {
        newRow = Array.from(view.container.querySelectorAll<HTMLElement>('.ag-row')).at(-1);
        expect(
          newRow?.querySelector<HTMLInputElement>('.ag-cell[col-id="date"] input')?.value,
        ).not.toBe('');
      },
      { timeout: 2000 },
    );
    newRow = Array.from(view.container.querySelectorAll<HTMLElement>('.ag-row')).at(-1);
    const currentSelectTrigger = newRow?.querySelector<HTMLButtonElement>(
      '.ag-cell[col-id="status"] button[aria-haspopup="listbox"]',
    );
    expect(currentSelectTrigger).toBeTruthy();
    expect(currentSelectTrigger?.isConnected).toBe(true);
    expect(currentSelectTrigger?.disabled).toBe(false);
    expect(document.body.style.pointerEvents).not.toBe('none');

    for (const label of ['Choose date', 'Choose time', 'Choose date and time']) {
      newRow = Array.from(view.container.querySelectorAll<HTMLElement>('.ag-row')).at(-1);
      const popupTrigger = newRow?.querySelector<HTMLButtonElement>(
        `button[aria-label="${label}"]`,
      );
      expect(popupTrigger).toBeTruthy();
      popupTrigger?.click();
      await vi.waitFor(() =>
        expect(document.querySelector('[data-slot="popover-content"]')).toBeTruthy(),
      );
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await vi.waitFor(() =>
        expect(document.querySelector('[data-slot="popover-content"]')).toBeFalsy(),
      );
    }

    currentSelectTrigger?.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
    );
    let newOption: HTMLElement | undefined;
    await vi.waitFor(() => {
      newOption = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find(
        (candidate) => (candidate.textContent ?? '').trim().toLowerCase() === 'new',
      );
      expect(newOption).toBeTruthy();
    });
    newOption?.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }),
    );

    await page.getByRole('button', { name: 'Outside action' }).click();
    await expect
      .element(page.getByRole('button', { name: 'Outside action 1' }))
      .toBeInTheDocument();

    for (let click = 0; click < 4; click++) addButton?.click();
    await vi.waitFor(
      () => {
        expect(view.container.querySelectorAll('.ag-row')).toHaveLength(6);
        expect(view.container.querySelector('[aria-label="Comment count"]')?.textContent).toBe('6');
      },
      { timeout: 2000 },
    );
  });
});
