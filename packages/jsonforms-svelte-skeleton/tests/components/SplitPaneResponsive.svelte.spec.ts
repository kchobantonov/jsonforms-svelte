import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import SplitPaneHarness from '../fixtures/SplitPaneHarness.svelte';
import '../test.css';
afterEach(cleanup);

it('reports invalid shared sizing options and uses safe keyboard defaults', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const view = await render(SplitPaneHarness, {
      size: 360,
      minSize: 0,
      keyboardStep: 0,
    });
    await expect
      .poll(() => warning.mock.calls.map((call) => call[0]))
      .toContain('splitPane.invalidMinSize');
    expect(warning.mock.calls.map((call) => call[0])).toContain('splitPane.invalidKeyboardStep');
    const handle = view.container.querySelector<HTMLElement>('[role="separator"]')!;
    await expect.poll(() => handle.getAttribute('aria-valuenow')).toBe('50');
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await expect.poll(() => handle.getAttribute('aria-valuenow')).toBe('52');
  } finally {
    warning.mockRestore();
  }
});

it('reports each invalid sizing option only when that option changes', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const view = await render(SplitPaneHarness, { minSize: 0, keyboardStep: 0 });
    await expect.poll(() => warning.mock.calls.length).toBe(2);
    await view.rerender({ minSize: 0, keyboardStep: 1 });
    expect(warning.mock.calls.length).toBe(2);
    await view.rerender({ minSize: 1, keyboardStep: 0 });
    await expect.poll(() => warning.mock.calls.length).toBe(3);
    expect(warning.mock.calls[2]?.[0]).toBe('splitPane.invalidKeyboardStep');
    await view.rerender({ minSize: 0, keyboardStep: 0 });
    await expect.poll(() => warning.mock.calls.length).toBe(4);
    expect(warning.mock.calls[3]?.[0]).toBe('splitPane.invalidMinSize');
  } finally {
    warning.mockRestore();
  }
});

it('stacks existing panes responsively and restores their resized shares', async () => {
  const view = await render(SplitPaneHarness, { size: 360, responsive: true, breakpoint: 200 });
  const first = view.container.querySelector('input')!;
  const handle = () => view.container.querySelector<HTMLElement>('[role="separator"]');
  await expect.poll(() => handle()?.getAttribute('aria-valuenow')).toBe('50');
  handle()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await expect.poll(() => Number(handle()?.getAttribute('aria-valuenow'))).toBeGreaterThan(50);
  const resized = handle()!.getAttribute('aria-valuenow');
  await view.rerender({ breakpoint: 1000 });
  await expect.poll(handle).toBeNull();
  expect(view.container.querySelector('input')).toBe(first);
  expect(first.parentElement!.getBoundingClientRect().width).toBeGreaterThan(300);
  expect(first.parentElement!.getBoundingClientRect().height).toBeGreaterThan(0);
  await view.rerender({ breakpoint: 200 });
  await expect.poll(() => handle()?.getAttribute('aria-valuenow')).toBe(resized);
  expect(view.container.querySelector('input')).toBe(first);
});

it('accepts pane removal while stacked without restoring obsolete shares', async () => {
  const view = await render(SplitPaneHarness, { size: 360, responsive: true, breakpoint: 200 });
  const first = view.container.querySelector('input')!;
  await view.rerender({ breakpoint: 1000 });
  await view.rerender({ showSecond: false });
  await view.rerender({ breakpoint: 200 });
  await expect.poll(() => view.container.querySelectorAll('[role="separator"]').length).toBe(0);
  await expect.poll(() => first.parentElement!.getBoundingClientRect().width).toBeGreaterThan(350);
  expect(view.container.querySelector('input')).toBe(first);
});
