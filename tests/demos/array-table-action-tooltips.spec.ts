import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';

demoTest(
  'array table action focus hints',
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
      `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const panel = page.getByRole('tabpanel', {
      name: translations[locale]['tableTab.label'],
      exact: true,
    });
    await panel.getByRole('table').getByRole('textbox').first().waitFor();
    await panel.getByRole('checkbox').first().check();
    const addPrefix = messages[locale]['array.addAriaLabelWithLabel'].split('{label}')[0];
    const actions = [
      panel.locator(`button[aria-label^="${addPrefix}"]:not([disabled])`).first(),
      panel
        .locator(
          `button[aria-label=${JSON.stringify(messages[locale]['array.upAriaLabel'])}]:not([disabled])`,
        )
        .first(),
      panel
        .locator(
          `button[aria-label=${JSON.stringify(messages[locale]['array.downAriaLabel'])}]:not([disabled])`,
        )
        .first(),
      panel.locator('[data-delete-selected]'),
    ];
    for (const action of actions) {
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
  { families: ['flowbite', 'shadcn', 'skeleton'] },
);
