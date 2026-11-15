import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'cron short-viewport editor panel',
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
      `${base}/${family}/#/examples/spec-cron-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const trigger = page
      .getByRole('button', { name: messages[locale]['cron.choose'], exact: true })
      .first();
    await trigger.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await trigger.click();
    const panel = page.locator('[data-cron-picker]:visible');
    await panel.waitFor();
    const popup = panel.locator(
      'xpath=ancestor::*[@role="dialog" or @role="tooltip" or @data-slot="popover-content" or (@data-scope="popover" and @data-part="content")][1]',
    );
    await popup.waitFor();
    const state = await popup.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        top: bounds.top,
        bottom: bounds.bottom,
        rootIsShadow: element.getRootNode() instanceof ShadowRoot,
      };
    });
    expect(state.rootIsShadow).toBe(webcomponent);
    expect(state.top).toBeGreaterThanOrEqual(0);
    expect(state.bottom).toBeLessThanOrEqual(450);
    const expression = panel.getByRole('textbox', {
      name: messages[locale]['cron.expression'],
      exact: true,
    });
    await expression.focus();
    await expect
      .poll(() =>
        expression.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.top >= 0 && bounds.bottom <= 450;
        }),
      )
      .toBe(true);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
