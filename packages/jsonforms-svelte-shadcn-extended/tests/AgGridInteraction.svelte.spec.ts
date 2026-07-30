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
  it('keeps date and select cells interactive after adding and updating a row', async () => {
    const view = render(AgGridInteractionHarness);

    await vi.waitFor(() => expect(view.container.querySelectorAll('.ag-row')).toHaveLength(1));
    const addButton = view.container.querySelector<HTMLButtonElement>(
      '.jsonforms-ag-grid__button--add',
    );
    expect(addButton).toBeTruthy();
    expect(addButton?.disabled).toBe(false);
    addButton?.click();
    await expect.element(page.getByLabelText('Comment count')).toHaveTextContent('2');
    await vi.waitFor(() => expect(view.container.querySelectorAll('.ag-row')).toHaveLength(2));

    let newRow = Array.from(view.container.querySelectorAll<HTMLElement>('.ag-row')).at(-1);
    const dateInput = newRow?.querySelector<HTMLInputElement>('input:not([type="checkbox"])');
    const dateCell = dateInput?.closest<HTMLElement>('.jsonforms-ag-grid-data-cell');
    expect(dateInput).toBeTruthy();
    expect(dateCell).toBeTruthy();
    expect(getComputedStyle(dateInput!).borderTopWidth).toBe('0px');
    expect(getComputedStyle(dateInput!).borderRadius).toBe('0px');
    expect(dateInput!.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      dateCell!.getBoundingClientRect().width - 2,
    );

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
      expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
      expect(view.container.querySelectorAll('.ag-row')).toHaveLength(2);
    });

    newRow = Array.from(view.container.querySelectorAll<HTMLElement>('.ag-row')).at(-1);
    const selectTrigger = newRow?.querySelector<HTMLButtonElement>(
      'button[aria-haspopup="listbox"]',
    );
    expect(selectTrigger).toBeTruthy();
    const selectCell = selectTrigger?.closest<HTMLElement>('.jsonforms-ag-grid-data-cell');
    expect(selectCell).toBeTruthy();
    expect(getComputedStyle(selectTrigger!).borderTopWidth).toBe('0px');
    expect(getComputedStyle(selectTrigger!).borderRadius).toBe('0px');
    expect(selectTrigger!.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      selectCell!.getBoundingClientRect().width - 2,
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
