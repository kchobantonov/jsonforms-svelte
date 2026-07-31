import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import AgGridInteractionHarness from './AgGridInteractionHarness.svelte';

afterEach(() => {
  cleanup();
  document.body.style.pointerEvents = '';
  document.body.style.overflow = '';
});

describe('AG Grid cell interactions', () => {
  it('keeps object and array dialogs constrained and uses the object icon', async () => {
    const view = render(AgGridInteractionHarness);

    await vi.waitFor(() => expect(view.container.querySelectorAll('.ag-row')).toHaveLength(1));
    await vi.waitFor(() =>
      expect(
        view.container.querySelector(
          '.ag-cell[col-id="address"] button[aria-label="Edit Address"]',
        ),
      ).toBeTruthy(),
    );
    const objectTrigger = view.container.querySelector<HTMLButtonElement>(
      '.ag-cell[col-id="address"] button[aria-label="Edit Address"]',
    );
    expect(objectTrigger).toBeTruthy();
    const objectIcon = objectTrigger?.querySelector<SVGElement>('svg.jsonforms-object-icon');
    expect(objectIcon).toBeTruthy();
    expect(objectIcon?.querySelector('path')?.getAttribute('d')).toContain('M8 3');
    objectTrigger?.click();

    await vi.waitFor(() => {
      expect(view.container.querySelector<HTMLDialogElement>('dialog[open]')).toBeTruthy();
    });

    const objectDialog = view.container.querySelector<HTMLDialogElement>('dialog[open]');
    const expectedMaximumWidth = Math.min(42 * 16, window.innerWidth - 32);
    expect(objectDialog!.getBoundingClientRect().width).toBeLessThanOrEqual(
      expectedMaximumWidth + 2,
    );
    expect(objectDialog!.closest('.jsonforms-ag-grid-cell-host')).toBeTruthy();
    objectDialog?.close();

    await vi.waitFor(() =>
      expect(
        view.container.querySelector('.ag-cell[col-id="tags"] button[aria-label="Edit Tags"]'),
      ).toBeTruthy(),
    );
    const arrayTrigger = view.container.querySelector<HTMLButtonElement>(
      '.ag-cell[col-id="tags"] button[aria-label="Edit Tags"]',
    );
    expect(arrayTrigger).toBeTruthy();
    arrayTrigger?.click();

    await vi.waitFor(() => {
      expect(view.container.querySelector<HTMLDialogElement>('dialog[open]')).toBeTruthy();
    });
    const arrayDialog = view.container.querySelector<HTMLDialogElement>('dialog[open]');
    expect(arrayDialog!.getBoundingClientRect().width).toBeLessThanOrEqual(
      expectedMaximumWidth + 2,
    );
  });

  it('keeps Flowbite date and select cells interactive after adding a row', async () => {
    const view = render(AgGridInteractionHarness);

    await vi.waitFor(() => expect(view.container.querySelectorAll('.ag-row')).toHaveLength(1));
    await vi.waitFor(() =>
      expect(
        view.container.querySelector('.ag-cell[col-id="favoriteColor"] input[type="color"]'),
      ).toBeTruthy(),
    );
    await vi.waitFor(() =>
      expect(
        view.container.querySelector('.ag-cell[col-id="active"] input[type="checkbox"]'),
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
    const checkbox = booleanCell?.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(booleanCell?.classList.contains('jsonforms-ag-grid-boolean-cell')).toBe(true);
    expect(checkbox).toBeTruthy();
    const booleanRect = booleanCell!.getBoundingClientRect();
    const checkboxRect = checkbox!.getBoundingClientRect();
    expect(checkbox?.checked).toBe(false);
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
    expect(
      newRow?.querySelector('.ag-cell[col-id="favoriteColor"] [data-color-empty-swatch]'),
    ).toBeTruthy();
    const dateCell = newRow?.querySelector<HTMLElement>('.ag-cell[col-id="date"]');
    const dateInput = dateCell?.querySelector<HTMLInputElement>('input:not([type="checkbox"])');
    expect(dateInput).toBeTruthy();
    expect(dateCell).toBeTruthy();
    expect(getComputedStyle(dateInput!).borderTopWidth).toBe('0px');
    expect(getComputedStyle(dateInput!).borderRadius).toBe('0px');
    expect(dateInput!.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      dateCell!.getBoundingClientRect().width - 2,
    );
    dateInput?.focus();
    expect(getComputedStyle(dateInput!).boxShadow).toBe('none');

    const dateTrigger = dateCell?.querySelector<HTMLButtonElement>('button[id$="-menu"]');
    expect(dateTrigger).toBeTruthy();
    dateTrigger?.click();

    let day: HTMLButtonElement | undefined;
    await vi.waitFor(() => {
      const calendar = document.querySelector<HTMLElement>(
        '[role="dialog"][aria-label="Calendar"]',
      );
      expect(calendar).toBeTruthy();
      day = Array.from(
        calendar!.querySelectorAll<HTMLButtonElement>('button[role="gridcell"]'),
      ).find(
        (candidate) => !candidate.disabled && candidate.getAttribute('aria-disabled') !== 'true',
      );
      expect(day).toBeTruthy();
    });
    day?.click();
    await page.getByRole('button', { name: 'Outside action' }).click();

    await vi.waitFor(() => {
      expect(document.querySelector('[role="dialog"][aria-label="Calendar"]')).toBeNull();
      expect(view.container.querySelectorAll('.ag-row')).toHaveLength(2);
    });

    newRow = Array.from(view.container.querySelectorAll<HTMLElement>('.ag-row')).at(-1);
    const selectCell = newRow?.querySelector<HTMLElement>('.ag-cell[col-id="status"]');
    const select = selectCell?.querySelector<HTMLSelectElement>('select');
    expect(select).toBeTruthy();
    expect(selectCell).toBeTruthy();
    expect(getComputedStyle(select!).borderTopWidth).toBe('0px');
    expect(getComputedStyle(select!).borderRadius).toBe('0px');
    expect(select!.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      selectCell!.getBoundingClientRect().width - 2,
    );
    select?.click();
    select!.value = 'new';
    select?.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.waitFor(() => {
      const currentRow = Array.from(view.container.querySelectorAll<HTMLElement>('.ag-row')).at(-1);
      expect(currentRow?.querySelector<HTMLSelectElement>('select')?.value).toBe('new');
      expect(document.body.style.pointerEvents).not.toBe('none');
      expect(view.container.querySelectorAll('.ag-row')).toHaveLength(2);
    });
    await expect
      .element(page.getByRole('button', { name: 'Outside action 1' }))
      .toBeInTheDocument();
  });
});
