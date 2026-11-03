import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/translations.json';
import supplements from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/supplemental-translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'choice card dialog native and Web Component styles',
  async ({ page, family, locale, base }) => {
    await page.setViewportSize({ width: 390, height: 600 });
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/spec-choice-controls?drawer=false`);
    const dialogStyle = async (webcomponent: boolean) => {
      await page.goto(
        `${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=${webcomponent}&drawer=false`,
      );
      await page
        .getByRole('tab', { name: translations[locale]['cards.detailModes.label'], exact: true })
        .click();
      const postal = page.getByRole('radio', {
        name: supplements[locale]['cardContact.choices.1.label'],
        exact: true,
      });
      await postal.first().scrollIntoViewIfNeeded();
      await postal.first().focus();
      await postal.first().press('Space');
      const dialog = page
        .getByRole('dialog')
        .filter({ hasText: messages[locale]['confirm.branchChange.title'] });
      await dialog.waitFor();
      const bounds = await dialog.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(-1);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(391);
      return dialog.evaluate((element) => {
        const root = element.getRootNode() as Document | ShadowRoot;
        const computed = getComputedStyle(element);
        return {
          root: root instanceof ShadowRoot,
          focused: element.contains(root.activeElement),
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
      const native = await dialogStyle(false);
      const webcomponent = await dialogStyle(true);
      expect(native.root).toBe(false);
      expect(native.focused).toBe(true);
      expect(native.background).not.toBe('rgba(0, 0, 0, 0)');
      expect(webcomponent).toEqual({ ...native, root: true });
    }
  },
  { hosts: ['native'], timeout: 60_000 },
);
