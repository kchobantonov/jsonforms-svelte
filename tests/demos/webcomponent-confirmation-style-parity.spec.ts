import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/destructive-confirmation/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'confirmation dialog native and Web Component styles',
  async ({ page, family, locale, base }) => {
    const url = (webcomponent: boolean) =>
      `${base}/${family}/#/examples/spec-destructive-confirmation?use-webcomponent=${webcomponent}&drawer=false`;
    await page.setViewportSize({ width: 390, height: 600 });
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
      await page.goto('about:blank');
      await page.goto(url(webcomponent));
      const remove = page
        .getByRole('tabpanel', {
          name: translations[locale]['featureNavigation.section1.label'],
          exact: true,
        })
        .locator('[data-additional-properties]')
        .first()
        .getByRole('button', {
          name: new RegExp(
            '^' + messages[locale]['additionalProperties.deleteNamed'].split('{name}')[0],
          ),
        })
        .first();
      await remove.click();
      const dialog = page.getByRole('dialog', {
        name: translations[locale]['confirm.delete.title'],
        exact: true,
      });
      await dialog.waitFor();
      const bounds = await dialog.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
      return dialog.evaluate((element) => {
        const root = element.getRootNode() as Document | ShadowRoot;
        const panel = [element, ...element.querySelectorAll('*')].find((candidate) => {
          const background = getComputedStyle(candidate).backgroundColor;
          const bounds = candidate.getBoundingClientRect();
          return background !== 'rgba(0, 0, 0, 0)' && bounds.width > 100 && bounds.height > 50;
        });
        if (!panel) return null;
        const computed = getComputedStyle(panel);
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
      const native = await style(false);
      const webcomponent = await style(true);
      expect(native).not.toBeNull();
      expect(native!.root).toBe(false);
      expect(native!.focused).toBe(true);
      expect(webcomponent).toEqual({ ...native, root: true });
    }
  },
  { hosts: ['native'], timeout: 60_000 },
);
