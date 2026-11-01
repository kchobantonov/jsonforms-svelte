import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';

demoTest(
  'RTL places settings at inline end and narrow examples at inline start',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/spec-presentation?drawer=false`);
    const labels = messages[locale];
    await page.getByRole('button', { name: labels['nav.openSettings'] }).click();
    const settings = page.getByRole('dialog');
    await expect.poll(() => settings.isVisible()).toBe(true);
    await page.getByText('RTL', { exact: true }).click();
    await page.keyboard.press('Escape');
    await expect.poll(() => settings.isVisible()).toBe(false);
    await page.getByRole('button', { name: labels['nav.openSettings'] }).click();
    await expect.poll(() => settings.isVisible()).toBe(true);
    await expect.poll(async () => (await settings.boundingBox())!.x).toBeLessThan(12);
    await page.keyboard.press('Escape');
    await expect.poll(() => settings.isVisible()).toBe(false);

    await page.setViewportSize({ width: 390, height: 844 });
    const menu = page.getByRole('button', { name: labels['nav.showExamples'], exact: true });
    await menu.click();
    const examples = page.locator('aside').first();
    await expect.poll(() => examples.isVisible()).toBe(true);
    await expect
      .poll(async () => {
        const box = (await examples.boundingBox())!;
        return box.x + box.width;
      })
      .toBeGreaterThanOrEqual(388);
  },
  { hosts: ['native'], timeout: 45_000 },
);
