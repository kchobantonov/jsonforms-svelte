import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'search choice native and Web Component styles',
  async ({ page, family, locale, base }) => {
    const url = (webcomponent: boolean) =>
      `${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=${webcomponent}&drawer=false`;
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(url(false));
    await page.evaluate(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    const style = async (webcomponent: boolean) => {
      await page.goto(url(webcomponent));
      await page.reload();
      await page
        .getByRole('tab', {
          name: translations[locale]['featureNavigation.section5.label'],
          exact: true,
        })
        .click();
      const trigger = page.locator('[id*="/properties/origin-input"]').first();
      if (family === 'skeleton') await trigger.fill('Se');
      else {
        await trigger.click();
        await page
          .getByPlaceholder(messages[locale]['arrayChoices.search'], { exact: true })
          .filter({ visible: true })
          .fill('Se');
      }
      const option = page
        .getByRole('option', { name: 'Seattle', exact: true })
        .and(page.locator('[role=option]'));
      await option.waitFor();
      const popup = option.locator(
        'xpath=ancestor::*[@role="dialog" or @data-slot="popover-content" or (@data-scope="combobox" and @data-part="content")][1]',
      );
      return popup.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          root: element.getRootNode() instanceof ShadowRoot,
          background: computed.backgroundColor,
          foreground: computed.color,
          radius: computed.borderRadius,
        };
      });
    };
    for (const mode of ['light', 'dark'] as const) {
      await page.evaluate(
        ({ family, mode }) =>
          localStorage.setItem(
            `${family}-example-mode`,
            JSON.stringify({ version: 1, value: mode }),
          ),
        { family, mode },
      );
      const native = await style(false);
      const webcomponent = await style(true);
      expect(native.root).toBe(false);
      expect(webcomponent).toEqual({ ...native, root: true });
    }
  },
  { hosts: ['native'], timeout: 60_000 },
);
