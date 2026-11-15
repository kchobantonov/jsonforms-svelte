import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'additional-property action focus hints',
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
    await page.goto(
      `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await expect.poll(() => page.locator('[data-additional-properties]:visible').count()).toBe(3);
    await page
      .locator('[data-additional-properties]:visible')
      .first()
      .getByRole('textbox', {
        name: messages[locale]['additionalProperties.propertyNameLabel'],
        exact: true,
      })
      .fill('tooltip-probe');
    const prefixes = [
      messages[locale]['additionalProperties.addTo'].split('{label}')[0],
      messages[locale]['additionalProperties.renameNamed'].split('{name}')[0],
      messages[locale]['additionalProperties.deleteNamed'].split('{name}')[0],
    ];
    for (const prefix of prefixes) {
      const action = page
        .locator('[data-additional-properties]:visible')
        .locator(`button[aria-label^="${prefix}"]:not([disabled])`)
        .first();
      await expect.poll(() => action.count()).toBe(1);
      const title = await action.getAttribute('title');
      expect(title).toBeTruthy();
      await action.focus();
      const hint = page
        .locator(
          family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible',
        )
        .filter({ hasText: title! })
        .first();
      await expect.poll(() => hint.isVisible()).toBe(true);
      expect(await hint.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
        webcomponent,
      );
      expect(await hint.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
        'rgba(0, 0, 0, 0)',
      );
      await page.keyboard.press('Escape');
      await expect.poll(() => hint.isVisible()).toBe(false);
      await expect.poll(() => action.evaluate((element) => element.matches(':focus'))).toBe(true);
    }
    expect(errors).toEqual([]);
  },
  { families: ['shadcn', 'skeleton'] },
);
