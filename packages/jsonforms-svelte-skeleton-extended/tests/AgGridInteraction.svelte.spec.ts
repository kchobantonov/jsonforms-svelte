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
  it('keeps Skeleton date and select cells interactive after adding a row', async () => {
    const view = render(AgGridInteractionHarness);
    view.container.style.colorScheme = 'dark';

    await vi.waitFor(() => expect(view.container.querySelectorAll('.ag-row')).toHaveLength(1));
    const styledRoot = view.container.querySelector<HTMLElement>('.ag-styled-root');
    expect(styledRoot).toBeTruthy();
    expect(getComputedStyle(styledRoot!).colorScheme).toBe('dark');

    const addButton = view.container.querySelector<HTMLButtonElement>(
      '.jsonforms-ag-grid__button--add',
    );
    expect(addButton).toBeTruthy();
    expect(addButton?.disabled).toBe(false);
    addButton?.click();
    await expect.element(page.getByLabelText('Comment count')).toHaveTextContent('2');
    await vi.waitFor(() => expect(view.container.querySelectorAll('.ag-row')).toHaveLength(2));

    let newRow = Array.from(view.container.querySelectorAll<HTMLElement>('.ag-row')).at(-1);
    const dateCell = newRow?.querySelector<HTMLElement>('.ag-cell[col-id="date"]');
    const dateInput = dateCell?.querySelector<HTMLInputElement>('input:not([type="checkbox"])');
    expect(dateInput).toBeTruthy();
    expect(dateCell).toBeTruthy();
    expect(getComputedStyle(dateInput!).borderTopWidth).toBe('0px');
    expect(getComputedStyle(dateInput!).borderRadius).toBe('0px');
    expect(dateInput!.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      dateCell!.getBoundingClientRect().width - 2,
    );

    const dateTrigger = dateCell?.querySelector<HTMLButtonElement>('[aria-label="Choose date"]');
    expect(dateTrigger).toBeTruthy();
    await page.getByRole('button', { name: 'Choose date' }).last().click();

    let day: HTMLElement | undefined;
    await vi.waitFor(() => {
      const calendar = document.querySelector<HTMLElement>(
        '[data-scope="date-picker"][data-part="content"][data-state="open"]',
      );
      expect(calendar).toBeTruthy();
      day = Array.from(
        calendar!.querySelectorAll<HTMLElement>(
          '[data-scope="date-picker"][data-part="table-cell-trigger"]',
        ),
      ).find(
        (candidate) =>
          candidate.getAttribute('aria-disabled') !== 'true' &&
          candidate.getAttribute('data-outside-range') === null,
      );
      expect(day).toBeTruthy();
    });
    const dayLabel = day?.getAttribute('aria-label');
    expect(dayLabel).toBeTruthy();
    await page.getByRole('button', { name: dayLabel! }).last().click();

    await vi.waitFor(() => {
      expect(
        document.querySelector(
          '[data-scope="date-picker"][data-part="content"][data-state="open"]',
        ),
      ).toBeNull();
      expect(view.container.querySelectorAll('.ag-row')).toHaveLength(2);
    });

    newRow = Array.from(view.container.querySelectorAll<HTMLElement>('.ag-row')).at(-1);
    const selectCell = newRow?.querySelector<HTMLElement>('.ag-cell[col-id="status"]');
    const select = selectCell?.querySelector<HTMLSelectElement>('select');
    expect(select).toBeTruthy();
    expect(selectCell).toBeTruthy();
    expect(select?.disabled).toBe(false);
    expect(getComputedStyle(select!).borderTopWidth).toBe('0px');
    expect(getComputedStyle(select!).borderRadius).toBe('0px');
    expect(select!.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      selectCell!.getBoundingClientRect().width - 2,
    );
    select?.click();
    select!.value = 'new';
    select?.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
      const currentRow = Array.from(view.container.querySelectorAll<HTMLElement>('.ag-row')).at(-1);
      expect(currentRow?.querySelector<HTMLSelectElement>('select')?.value).toBe('new');
      expect(view.container.querySelectorAll('.ag-row')).toHaveLength(2);
    });
    await page.getByRole('button', { name: 'Outside action' }).click();
    await expect
      .element(page.getByRole('button', { name: 'Outside action 1' }))
      .toBeInTheDocument();
  });
});
