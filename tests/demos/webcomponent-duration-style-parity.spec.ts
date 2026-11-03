import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/translations.supplement.json';

demoTest(
  'duration picker native and Web Component styles',
  async ({ page, family, locale, base }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/spec-temporal-controls?drawer=false`);
    const popupStyle = async (webcomponent: boolean) => {
      await page.goto(
        `${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=${webcomponent}&drawer=false`,
      );
      await page.reload();
      const duration = page.getByRole('combobox', {
        name: fields[locale][
          'specTemporalControls.schema.properties.schemaBased.properties.duration.label'
        ],
        exact: true,
      });
      const control = page.locator(
        `[id=${JSON.stringify((await duration.getAttribute('id'))!.replace(/-input$/, ''))}]`,
      );
      const trigger = control.getByRole('button', {
        name: messages[locale]['duration.open'],
        exact: true,
      });
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      const minutes = page.getByRole('spinbutton', {
        name: messages[locale]['duration.minutes'],
        exact: true,
      });
      const popup = minutes.locator(
        'xpath=ancestor::*[@role="dialog" or @role="tooltip" or @data-slot="popover-content" or (@data-scope="popover" and @data-part="content")][1]',
      );
      await popup.waitFor();
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
      const native = await popupStyle(false);
      const webcomponent = await popupStyle(true);
      expect(native.root).toBe(false);
      expect(native.background).not.toBe('rgba(0, 0, 0, 0)');
      expect(webcomponent).toEqual({ ...native, root: true });
    }
  },
  { hosts: ['native'], timeout: 60_000 },
);
