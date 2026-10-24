import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import SplitPaneHarness from '../fixtures/SplitPaneHarness.svelte';
import '../test.css';

afterEach(cleanup);
it.each([
  ['horizontal', 'ltr'],
  ['horizontal', 'rtl'],
  ['vertical', 'ltr'],
  ['vertical', 'rtl'],
] as const)(
  'keeps %s %s panes bounded when minimums exceed available space',
  async (direction, dir) => {
    const resized = vi.fn();
    const view = await render(SplitPaneHarness, { direction, dir, onResize: resized });
    const handle = view.container.querySelector<HTMLElement>('[role="separator"]')!;
    await expect.poll(() => handle.getAttribute('aria-valuenow')).toBe('50');
    // Wait for the native ResizeObserver to see the narrow container.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const first = view.container.querySelector<HTMLInputElement>('input')!;
    const value = () => Number(handle.getAttribute('aria-valuenow'));
    for (const key of direction === 'horizontal'
      ? ['ArrowLeft', 'ArrowRight']
      : ['ArrowUp', 'ArrowDown']) {
      handle.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      await expect.poll(value).toBe(50);
    }
    handle.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, clientX: 40, clientY: 40, bubbles: true }),
    );
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 300 }));
    window.dispatchEvent(new PointerEvent('pointerup'));
    await expect.poll(value).toBe(50);
    expect(
      resized.mock.calls
        .flatMap(([sizes]) => sizes)
        .every((size: number) => size >= 0 && size <= 100),
    ).toBe(true);
    await view.rerender({ size: 500 });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const key = direction === 'vertical' ? 'ArrowDown' : dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    handle.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    await expect.poll(value).toBeGreaterThan(50);
    expect(view.container.querySelector('input')).toBe(first);
    expect(first.value).toBe('Original');
  },
);

it('keeps the vertical resize hit target above adjacent pane content', async () => {
  const view = await render(SplitPaneHarness, { direction: 'vertical', dir: 'rtl', size: 360 });
  const handle = view.container.querySelector<HTMLElement>('[role="separator"]')!;
  await expect.poll(() => handle.getAttribute('aria-valuenow')).toBe('50');
  const rect = handle.getBoundingClientRect();
  // The expanded hit area overlaps the following pane; it must receive the event.
  const target = document.elementFromPoint(rect.left + 20, rect.bottom + 2);
  expect(target?.closest('[role="separator"]')).toBe(handle);
  expect(getComputedStyle(handle).touchAction).toBe('none');
});

it.each(['blur', 'disable', 'remove'] as const)(
  'cleans up the active pointer on %s and ignores other pointers',
  async (operation) => {
    const view = await render(SplitPaneHarness, { size: 360 });
    const handle = view.container.querySelector<HTMLElement>('[role="separator"]')!;
    await expect.poll(() => handle.getAttribute('aria-valuenow')).toBe('50');
    const previous = document.body.style.userSelect;
    handle.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerId: 7, button: 0, clientX: 180 }),
    );
    window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 8, clientX: 240 }));
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 8 }));
    await expect.poll(() => handle.getAttribute('aria-valuenow')).toBe('50');
    window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 7, clientX: 220 }));
    await expect.poll(() => Number(handle.getAttribute('aria-valuenow'))).toBeGreaterThan(50);
    if (operation === 'blur') window.dispatchEvent(new Event('blur'));
    else
      await view.rerender(operation === 'disable' ? { resizable: false } : { showSecond: false });
    await expect.poll(() => document.body.style.userSelect).toBe(previous);
    if (operation === 'remove')
      expect(view.container.querySelectorAll('[role="separator"]')).toHaveLength(0);
    else {
      const value = handle.getAttribute('aria-valuenow');
      window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 7, clientX: 300 }));
      await expect.poll(() => handle.getAttribute('aria-valuenow')).toBe(value);
    }
  },
);
