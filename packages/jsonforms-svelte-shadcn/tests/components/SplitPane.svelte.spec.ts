import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { mount, tick, unmount } from 'svelte';
import Harness from './ResizableHarness.svelte';
import '../test.css';

afterEach(cleanup);

const sizesOf = (container: ParentNode) =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-pane]')).map((pane) =>
    Number(pane.style.flexGrow),
  );

const key = (handle: HTMLElement, value: string) => {
  handle.focus();
  handle.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true }));
};

describe('Shadcn Resizable integration', () => {
  it.each([
    [75, 25],
    [25, 75],
  ])('keeps the %s/%s split and allows either pane to become larger', async (first, second) => {
    const onResize = vi.fn();
    const view = render(Harness, { props: { sizes: [first, second], onResize } });
    await vi.waitFor(() => expect(sizesOf(view.container)).toEqual([first, second]));
    const handle = view.container.querySelector<HTMLElement>('[role="separator"]')!;
    expect(handle.dataset.slot).toBe('resizable-handle');
    handle.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    await vi.waitFor(() => {
      const bounds = handle.getBoundingClientRect();
      expect(
        handle.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + 5)),
      ).toBe(true);
    });
    key(handle, 'Home');
    await vi.waitFor(() => expect(sizesOf(view.container)[0]).toBeCloseTo(12.5));
    key(handle, 'End');
    await vi.waitFor(() => expect(sizesOf(view.container)[1]).toBeCloseTo(12.5));
    expect(onResize).toHaveBeenCalled();
  });

  it('stacks without losing mounted inputs or edited values and restores resizing', async () => {
    const view = render(Harness);
    const input = view.container.querySelector<HTMLInputElement>('input')!;
    input.value = 'Unsaved edit';
    await view.rerender({ breakpoint: 10000 });
    await vi.waitFor(() => expect(view.container.querySelector('[role="separator"]')).toBeNull());
    const panes = view.container.querySelectorAll<HTMLElement>('[data-pane]');
    expect(panes[1].getBoundingClientRect().top).toBeGreaterThanOrEqual(
      panes[0].getBoundingClientRect().bottom,
    );
    expect(view.container.querySelector('input')).toBe(input);
    expect(input.value).toBe('Unsaved edit');
    await view.rerender({ breakpoint: 0 });
    await vi.waitFor(() => expect(view.container.querySelector('[role="separator"]')).toBeTruthy());
    expect(view.container.querySelector('input')).toBe(input);
  });

  it('resizes inside a ShadowRoot with mouse and keyboard input', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = host.attachShadow({ mode: 'open' });
    const component = mount(Harness, { target: root });
    try {
      await vi.waitFor(() => expect(sizesOf(root)).toEqual([75, 25]));
      const handle = root.querySelector<HTMLElement>('[role="separator"]')!;
      const bounds = handle.getBoundingClientRect();
      handle.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, clientX: bounds.x, clientY: bounds.y }),
      );
      await tick();
      document.body.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, clientX: bounds.x - 200, clientY: bounds.y }),
      );
      window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await vi.waitFor(() => expect(sizesOf(root)[0]).toBeLessThan(60));
      key(handle, 'End');
      await vi.waitFor(() => expect(sizesOf(root)[1]).toBeCloseTo(12.5));
    } finally {
      await unmount(component);
      host.remove();
    }
  });

  it('keeps explicit vertical splits resizable on narrow screens', async () => {
    const view = render(Harness, { props: { direction: 'vertical', breakpoint: 10000 } });
    await vi.waitFor(() => expect(sizesOf(view.container)).toEqual([75, 25]));
    const handle = view.container.querySelector<HTMLElement>('[role="separator"]')!;
    expect(handle.dataset.direction).toBe('vertical');
    key(handle, 'Home');
    await vi.waitFor(() => expect(sizesOf(view.container)[0]).toBeCloseTo(25));
  });
});
