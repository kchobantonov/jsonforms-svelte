import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import '../../app.css';
import { useAppStore } from '../store/index.svelte';
import Settings from './Settings.svelte';

describe('Settings', () => {
  const appStore = useAppStore();

  afterEach(() => {
    cleanup();
    appStore.settings = false;
    appStore.jsonforms.config.filterErrorKeywordsBeforeTouch = ['required'];
  });

  it('keeps filter error keyword pills inside the input without changing sheet scroll', async () => {
    appStore.settings = true;
    appStore.jsonforms.config.filterErrorKeywordsBeforeTouch = ['required'];
    render(Settings);

    const input = document.querySelector<HTMLInputElement>('#error-keywords')!;
    const inputGroup = input.closest('[data-slot="input-group"]');
    const sheet = document.querySelector<HTMLElement>('[data-slot="sheet-content"]')!;
    const requiredRemoveButton = document.querySelector<HTMLButtonElement>(
      '[aria-label="Remove required"]',
    )!;
    expect(input).toBeTruthy();
    expect(inputGroup).toBeTruthy();
    expect(inputGroup!.contains(requiredRemoveButton)).toBe(true);

    input.value = 'minLength';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await tick();

    expect(appStore.jsonforms.config.filterErrorKeywordsBeforeTouch).toEqual([
      'required',
      'minLength',
    ]);
    expect(document.querySelector('[aria-label="Remove minLength"]')).toBeTruthy();

    sheet.scrollTop = 240;
    requiredRemoveButton.click();
    await tick();

    expect(appStore.jsonforms.config.filterErrorKeywordsBeforeTouch).toEqual(['minLength']);
    expect(sheet.scrollTop).toBe(240);
    expect(document.activeElement).toBe(input);
  });
});
