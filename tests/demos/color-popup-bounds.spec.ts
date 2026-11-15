import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'color picker short-viewport popup',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 450 });
    await page.goto(
      `${base}/${family}/#/examples/spec-color-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', {
        name: locale === 'bg' ? 'Настройки на избора' : 'Picker options',
        exact: true,
      })
      .click();
    const trigger = page.locator('[id="#/properties/statusDot-picker"]');
    await trigger.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await trigger.click();
    const slider = page.getByRole('slider', {
      name: locale === 'bg' ? 'Наситеност и яркост' : 'Saturation and brightness',
      exact: true,
    });
    const popup = slider.locator(
      'xpath=ancestor::*[@role="dialog" or @role="tooltip" or @data-slot="popover-content" or (@data-scope="popover" and @data-part="content")][1]',
    );
    await popup.waitFor();
    const state = await popup.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        top: bounds.top,
        bottom: bounds.bottom,
        hasScroller: [element, ...element.querySelectorAll('*')].some(
          (node) =>
            getComputedStyle(node).overflowY === 'auto' && node.scrollHeight > node.clientHeight,
        ),
        rootIsShadow: element.getRootNode() instanceof ShadowRoot,
      };
    });
    expect(state.rootIsShadow).toBe(webcomponent);
    expect(state.top).toBeGreaterThanOrEqual(0);
    expect(state.bottom).toBeLessThanOrEqual(450);
    expect(state.hasScroller).toBe(true);
    const blue = page.getByRole('spinbutton', { name: locale === 'bg' ? 'Синьо' : 'Blue' });
    await blue.focus();
    await expect
      .poll(() =>
        blue.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.top >= 0 && bounds.bottom <= 450;
        }),
      )
      .toBe(true);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
