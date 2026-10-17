import { afterEach, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import { rendererMessage } from '@chobantonov/jsonforms-svelte';
import SplitPaneHarness from '../fixtures/SplitPaneHarness.svelte';
import '../test.css';

afterEach(cleanup);
const handles = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[role="separator"]'));
const value = (handle: HTMLElement) => Number(handle.getAttribute('aria-valuenow'));
const settled = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
const touchEvent = (type: string, target: EventTarget, x: number, y = 20, id = 1) => {
  const touch = new Touch({ identifier: id, target, clientX: x, clientY: y });
  const ended = type === 'touchend' || type === 'touchcancel';
  return new TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches: ended ? [] : [touch],
    changedTouches: [touch],
    targetTouches: ended ? [] : [touch],
  });
};

it.each(['en', 'bg'])(
  'uses localized native handles and live LTR/RTL keyboard behavior in %s',
  async (locale) => {
    const label = rendererMessage(locale, 'splitLayout.resize');
    const view = render(SplitPaneHarness, { label });
    const handle = handles(view.container)[0];
    await settled();
    expect(handle.getAttribute('aria-label')).toBe(label);
    expect(handle.getAttribute('aria-orientation')).toBe('vertical');
    handle.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect.poll(() => value(handle)).toBeGreaterThan(50);
    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(() => value(handle)).toBe(50);
    const input = view.container.querySelector('input');
    await view.rerender({ dir: 'ltr' });
    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(() => value(handle)).toBeGreaterThan(50);
    expect(view.container.querySelector('input')).toBe(input);
  },
);

it.each(['ltr', 'rtl'] as const)('uses real mouse dragging in horizontal %s', async (dir) => {
  const view = render(SplitPaneHarness, { dir });
  const handle = handles(view.container)[0];
  await settled();
  // The second pane is on the left in RTL and on the right in LTR. Dragging
  // toward it must grow the first pane in either writing direction.
  await userEvent.dragAndDrop(handle, view.getByRole('textbox', { name: 'Second', exact: true }));

  await expect.poll(() => value(handle)).toBeGreaterThan(50);
  expect(value(handle)).toBeLessThanOrEqual(100);
});

it.each(['ltr', 'rtl'] as const)(
  'preserves vertical keyboard and mouse resizing in %s',
  async (dir) => {
    const view = render(SplitPaneHarness, { dir, direction: 'vertical' });
    const handle = handles(view.container)[0];
    await settled();
    expect(handle.getAttribute('aria-orientation')).toBe('horizontal');
    handle.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.poll(() => value(handle)).toBeGreaterThan(50);
    await userEvent.keyboard('{ArrowUp}');
    await expect.poll(() => value(handle)).toBe(50);
    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientY: 200 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: 250 }));
    window.dispatchEvent(new MouseEvent('mouseup'));
    await expect.poll(() => value(handle)).toBeGreaterThan(50);
  },
);

it('resizes with RTL touch input and ignores another finger ending', async () => {
  const view = render(SplitPaneHarness);
  const handle = handles(view.container)[0];
  await settled();
  handle.dispatchEvent(touchEvent('touchstart', handle, 400));
  window.dispatchEvent(touchEvent('touchmove', handle, 320));
  await expect.poll(() => value(handle)).toBeGreaterThan(50);
  const before = value(handle);
  window.dispatchEvent(touchEvent('touchend', handle, 320, 20, 2));
  window.dispatchEvent(touchEvent('touchmove', handle, 240));
  await expect.poll(() => value(handle)).toBeGreaterThan(before);
  window.dispatchEvent(touchEvent('touchcancel', handle, 240));
  const stopped = value(handle);
  window.dispatchEvent(touchEvent('touchmove', handle, 100));
  await settled();
  expect(value(handle)).toBe(stopped);
  expect(document.body.style.userSelect).not.toBe('none');
});

it('resizes only the nested RTL group and preserves disabled boundaries', async () => {
  const view = render(SplitPaneHarness, { nested: true });
  await settled();
  const inner = view.container.querySelector<HTMLElement>(
    '[data-testid="inner"] [role="separator"]',
  )!;
  const outer = handles(view.container).find((handle) => handle !== inner)!;
  inner.focus();
  await userEvent.keyboard('{ArrowLeft}');
  await expect.poll(() => value(inner)).toBeGreaterThan(50);
  expect(value(outer)).toBe(50);
  await view.rerender({ resizable: false });
  expect(inner.tabIndex).toBe(-1);
  const before = value(inner);
  inner.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  inner.dispatchEvent(new MouseEvent('mousedown', { clientX: 200, bubbles: true }));
  window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 }));
  window.dispatchEvent(new MouseEvent('mouseup'));
  await settled();
  expect(value(inner)).toBe(before);
  expect(value(outer)).toBe(50);
});

it.each(['disable', 'remove', 'blur'] as const)(
  'cleans up an RTL touch drag on %s',
  async (operation) => {
    const view = render(SplitPaneHarness);
    await settled();
    const handle = handles(view.container)[0];
    const oldCursor = document.body.style.cursor;
    const oldSelect = document.body.style.userSelect;
    document.body.style.cursor = 'crosshair';
    document.body.style.userSelect = 'text';
    try {
      handle.dispatchEvent(touchEvent('touchstart', handle, 400));
      expect(document.body.style.userSelect).toBe('none');
      if (operation === 'disable') await view.rerender({ resizable: false });
      else if (operation === 'remove') await view.rerender({ visible: false });
      else window.dispatchEvent(new Event('blur'));
      await settled();
      expect(document.body.style.cursor).toBe('crosshair');
      expect(document.body.style.userSelect).toBe('text');
      const before = value(handle);
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: -700 }));
      await settled();
      expect(value(handle)).toBe(before);
    } finally {
      document.body.style.cursor = oldCursor;
      document.body.style.userSelect = oldSelect;
    }
  },
);
