import { afterEach, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import SplitPaneHarness from '../fixtures/SplitPaneHarness.svelte';
import '../test.css';

const originalDirection = document.dir;
afterEach(async () => {
  await cleanup();
  document.dir = originalDirection;
});
it.each([
  ['ltr', 'rtl'],
  ['rtl', 'ltr'],
  ['rtl', 'rtl'],
  ['ltr', 'ltr'],
] as const)('resizes a %s document with a %s pane group', async (documentDirection, dir) => {
  document.dir = documentDirection;
  const view = await render(SplitPaneHarness, { dir });
  const handle = page.getByRole('separator');
  const first = page.getByRole('textbox', { name: 'First', exact: true }).element();
  const width = () => first.parentElement!.getBoundingClientRect().width;
  await expect.poll(width).toBeGreaterThan(100);
  const before = width();
  handle.element().focus();
  await userEvent.keyboard(dir === 'rtl' ? '{ArrowLeft}' : '{ArrowRight}');
  await expect.poll(width).toBeGreaterThan(before);
  const afterKeyboard = width();
  await userEvent.dragAndDrop(handle, page.getByRole('textbox', { name: 'Second', exact: true }));
  await expect.poll(width).toBeGreaterThan(afterKeyboard);
  expect(view.container.querySelector('input')).toBe(first);
});
it.each(['ltr', 'rtl'] as const)(
  'keeps vertical resizing independent of %s direction',
  async (dir) => {
    document.dir = dir === 'rtl' ? 'ltr' : 'rtl';
    await render(SplitPaneHarness, { direction: 'vertical', dir });
    const handle = page.getByRole('separator');
    await expect.poll(() => handle.element().getAttribute('aria-valuenow')).toBe('50');
    handle.element().focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect
      .poll(() => Number(handle.element().getAttribute('aria-valuenow')))
      .toBeGreaterThan(50);
  },
);

it('follows live subtree direction without remounting the input', async () => {
  document.dir = 'ltr';
  const view = await render(SplitPaneHarness, { dir: 'ltr' });
  const handle = page.getByRole('separator');
  const first = page.getByRole('textbox', { name: 'First', exact: true }).element();
  await expect.poll(() => Number(handle.element().getAttribute('aria-valuenow'))).toBe(50);
  await view.rerender({ dir: 'rtl' });
  handle.element().focus();
  await userEvent.keyboard('{ArrowLeft}');
  await expect
    .poll(() => Number(handle.element().getAttribute('aria-valuenow')))
    .toBeGreaterThan(50);
  expect(view.container.querySelector('input')).toBe(first);
});

it('keeps the original touch drag when another finger lands on the handle', async () => {
  document.dir = 'ltr';
  await render(SplitPaneHarness, { dir: 'rtl' });
  const handle = page.getByRole('separator').element();
  const touch = (type: string, x: number, id = 1) => {
    const point = new Touch({ identifier: id, target: handle, clientX: x, clientY: 20 });
    return new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      touches: type === 'touchcancel' ? [] : [point],
      changedTouches: [point],
    });
  };
  const value = () => Number(handle.getAttribute('aria-valuenow'));
  await expect.poll(value).toBe(50);
  handle.dispatchEvent(touch('touchstart', 180));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  document.body.dispatchEvent(touch('touchmove', 160));
  await expect.poll(value).toBeGreaterThan(50);
  const before = value();
  handle.dispatchEvent(touch('touchstart', 200, 2));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  window.dispatchEvent(touch('touchend', 200, 2));
  document.body.dispatchEvent(touch('touchmove', 140));
  await expect.poll(value).toBeGreaterThan(before);
  expect(value() - before).toBeLessThan(10);
  window.dispatchEvent(touch('touchcancel', 140));
  const cancelled = value();
  document.body.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 20 }));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  expect(value()).toBe(cancelled);
});
