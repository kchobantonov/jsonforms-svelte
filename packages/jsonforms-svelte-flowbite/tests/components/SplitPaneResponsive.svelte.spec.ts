import { afterEach, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import SplitPaneHarness from '../fixtures/ControlledSplitPaneHarness.svelte';
import '../test.css';
afterEach(cleanup);

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
