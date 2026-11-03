import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import uiSchema from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-container-validation-indicator/uischema.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-container-validation-indicator/translations.json';

demoTest(
  'array validation summary native and Web Component styles',
  async ({ page, family, locale, base }) => {
    const url = (webcomponent: boolean) =>
      `${base}/${family}/#/examples/spec-container-validation-indicator?use-webcomponent=${webcomponent}&drawer=false`;
    await page.goto(url(false));
    const style = async (webcomponent: boolean) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(url(webcomponent));
      await page.reload();
      const enabled = structuredClone(uiSchema);
      const certifications = enabled.elements[1]?.elements?.[1]?.elements?.[0] as
        | { options?: Record<string, unknown> }
        | undefined;
      if (!certifications?.options) throw new Error('Certifications control is missing');
      certifications.options.showValidationIndicator = true;
      await applyDemoEditor(page, locale, 'UI Schema', enabled, { verifyVisibleText: false });
      await page
        .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
        .click();
      await page
        .getByRole('tab', {
          name: translations[locale]['compliance.label'],
          exact: false,
        })
        .or(
          page.getByRole('button', {
            name: translations[locale]['compliance.label'],
            exact: false,
          }),
        )
        .first()
        .click();
      const title = page.getByRole('heading', {
        name: translations[locale]['certifications.label'],
        exact: true,
      });
      const indicator = title.locator('..').locator('[data-container-validation-indicator]');
      await page.setViewportSize({ width: 390, height: 900 });
      await indicator.click();
      const summary = page.locator('[data-error-summary]:visible');
      await summary.waitFor();
      const popup = summary.locator('xpath=ancestor::*[@role="dialog"][1]');
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
        ({ family, locale, mode }) => {
          localStorage.setItem(
            `${family}-example-locale`,
            JSON.stringify({ version: 1, value: locale }),
          );
          localStorage.setItem(
            `${family}-example-mode`,
            JSON.stringify({ version: 1, value: mode }),
          );
        },
        { family, locale, mode },
      );
      const native = await style(false);
      const webcomponent = await style(true);
      expect(native.root).toBe(false);
      expect(webcomponent).toEqual({ ...native, root: true });
    }
  },
  { hosts: ['native'], timeout: 60_000 },
);
