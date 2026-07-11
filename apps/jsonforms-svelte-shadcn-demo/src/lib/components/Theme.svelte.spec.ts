import { defaultShadcnDesignSystem } from '@chobantonov/jsonforms-svelte-shadcn';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import '../../app.css';
import { useAppStore } from '../store/index.svelte';
import Theme from './Theme.svelte';

describe('Theme customizer', () => {
  const appStore = useAppStore();

  afterEach(() => {
    cleanup();
    appStore.designSystem.value = { ...defaultShadcnDesignSystem };
    appStore.mode.value = 'system';
  });

  it('opens the complete design-system panel and resets its settings', async () => {
    const view = render(Theme);
    view.container.querySelector<HTMLButtonElement>('[aria-label="Customize theme"]')!.click();

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Base Color');
    });

    for (const label of [
      'Style',
      'Base Color',
      'Theme',
      'Chart Color',
      'Icon Library',
      'Heading',
      'Font',
      'Radius',
      'Menu',
      'Menu Accent',
      'Shuffle',
      'Reset',
      'Mode',
    ]) {
      expect(document.body.textContent).toContain(label);
    }

    document.body
      .querySelector<HTMLButtonElement>('[aria-label="Style"]')!
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Maia');
    });
    const maia = Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (item) => item.textContent?.trim() === 'Maia',
    );
    expect(maia).toBeTruthy();
    maia!.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }));
    await vi.waitFor(() => {
      expect(appStore.designSystem.value.style).toBe('maia');
      expect(document.body.textContent).toContain('Start Over');
    });

    const reset = Array.from(document.body.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.includes('Start Over'),
    );
    expect(reset).toBeTruthy();
    reset!.click();

    await vi.waitFor(() => {
      expect(appStore.designSystem.value).toEqual(defaultShadcnDesignSystem);
    });
  });
});
