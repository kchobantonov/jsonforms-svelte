import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import '../../app.css';
import Navbar from './Navbar.svelte';

describe('Navbar', () => {
  afterEach(() => {
    cleanup();
  });

  it('centers every toolbar icon in a square shadcn icon button', () => {
    const view = render(Navbar);
    const buttons = Array.from(view.container.querySelectorAll<HTMLButtonElement>('header button'));

    expect(buttons).toHaveLength(6);

    for (const button of buttons) {
      const icon = button.querySelector('svg');
      expect(icon).toBeTruthy();

      const buttonRect = button.getBoundingClientRect();
      const iconRect = icon?.getBoundingClientRect() as DOMRect;

      expect(buttonRect.width).toBe(buttonRect.height);
      expect(
        Math.abs(iconRect.left + iconRect.width / 2 - (buttonRect.left + buttonRect.width / 2)),
      ).toBeLessThanOrEqual(0.5);
      expect(
        Math.abs(iconRect.top + iconRect.height / 2 - (buttonRect.top + buttonRect.height / 2)),
      ).toBeLessThanOrEqual(0.5);
    }
  });
});
