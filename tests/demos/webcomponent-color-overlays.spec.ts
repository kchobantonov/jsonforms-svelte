import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'webcomponent-color-overlays',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-color-control?use-webcomponent=true&drawer=false`,
    );
    await page
      .getByRole('tab', {
        name: locale === 'bg' ? 'Настройки на избора' : 'Picker options',
        exact: true,
      })
      .click();
    const trigger = page.locator('[id="#/properties/statusDot-picker"]');
    await trigger.click();
    const slider = page.getByRole('slider', {
      name: locale === 'bg' ? 'Наситеност и яркост' : 'Saturation and brightness',
      exact: true,
    });
    await slider.waitFor();
    expect(await slider.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      true,
    );
    const box = await slider.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(1440);
    await page.keyboard.press('Escape');
    await slider.waitFor({ state: 'hidden' });
    await expect.poll(() => trigger.evaluate((element) => element.matches(':focus'))).toBe(true);
    expect(errors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 45_000 },
);
