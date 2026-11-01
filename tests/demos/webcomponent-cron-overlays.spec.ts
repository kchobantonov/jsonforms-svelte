import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'webcomponent-cron-overlays',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-cron-control?use-webcomponent=true&drawer=false`,
    );
    const trigger = page
      .getByRole('button', { name: messages[locale]['cron.choose'], exact: true })
      .first();
    await trigger.click();
    const panel = page.locator('[data-cron-picker]:visible');
    await panel.waitFor();
    expect(await panel.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      true,
    );
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(1440);
    await page.keyboard.press('Escape');
    await panel.waitFor({ state: 'hidden' });
    await expect.poll(() => trigger.evaluate((element) => element.matches(':focus'))).toBe(true);
    expect(errors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 45_000 },
);
