import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'color-clear-panel',
  async ({ page, webcomponent, base }) => {
    await page.goto(
      `${base}/shadcn/#/examples/spec-color-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const field = page.getByRole('textbox', { name: 'Brand primary', exact: true });
    await field.waitFor();
    const trigger = page.locator('[data-color-trigger]').first();
    await trigger.click();
    const panel = page.locator('[data-slot="popover-content"]:visible').filter({
      has: page.locator('[data-slot="color-picker"]'),
    });
    const color = panel.locator('[data-slot="color-picker-input"]');
    const alpha = panel.locator('[data-slot="color-picker-alpha-input"]');
    await expect.poll(() => color.inputValue()).not.toBe('');
    await panel.getByRole('button', { name: 'Clear value', exact: true }).click();
    await expect.poll(() => field.inputValue()).toBe('');
    await expect.poll(() => color.inputValue()).toBe('');
    await expect.poll(() => alpha.inputValue()).toBe('');
  },
  { families: ['shadcn'], locales: ['en'], timeout: 20_000 },
);
