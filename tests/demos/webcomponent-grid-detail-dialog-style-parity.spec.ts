import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/ag-grid/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'AG Grid detail dialog native and Web Component styles',
  async ({ page, family, base }) => {
    await page.setViewportSize({ width: 390, height: 600 });
    await page.addInitScript((family) => {
      localStorage.setItem(`${family}-example-locale`, JSON.stringify({ version: 1, value: 'en' }));
    }, family);
    await page.goto(`${base}/${family}/#/examples/spec-ag-grid?drawer=false`);
    const dialogStyle = async (webcomponent: boolean) => {
      await page.goto('about:blank');
      await page.goto(
        `${base}/${family}/#/examples/spec-ag-grid?use-webcomponent=${webcomponent}&drawer=false`,
      );
      const tabLabel = translations.en['specAgGrid.ui.elements.1.label'];
      await page.getByRole('tab', { name: tabLabel, exact: true }).click();
      const panel = page.getByRole('tabpanel', { name: tabLabel, exact: true });
      const edit = panel
        .getByRole('button', {
          name: messages.en['collection.editRowDetails'].replace('{index}', '1'),
          exact: true,
        })
        .first();
      await edit.scrollIntoViewIfNeeded();
      await edit.click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      const bounds = await dialog.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(-1);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(391);
      if (family === 'flowbite') {
        for (const name of [messages.en['dialog.maximize'], messages.en['composite.apply']]) {
          const button = dialog.getByRole('button', { name, exact: true });
          await button.hover();
          const hint = button.locator('xpath=../span[@role="tooltip"]');
          await expect.poll(() => hint.isVisible()).toBe(true);
          const hintBounds = (await hint.boundingBox())!;
          expect(hintBounds.x).toBeGreaterThanOrEqual(bounds!.x - 1);
          expect(hintBounds.x + hintBounds.width).toBeLessThanOrEqual(
            bounds!.x + bounds!.width + 1,
          );
          expect(hintBounds.y).toBeGreaterThanOrEqual(bounds!.y - 1);
          expect(hintBounds.y + hintBounds.height).toBeLessThanOrEqual(
            bounds!.y + bounds!.height + 1,
          );
        }
      }
      return dialog.evaluate((element) => {
        const root = element.getRootNode() as Document | ShadowRoot;
        const computed = getComputedStyle(element);
        const firstInput = element.querySelector('input');
        return {
          root: root instanceof ShadowRoot,
          focused: element.contains(root.activeElement),
          background: computed.backgroundColor,
          foreground: computed.color,
          radius: computed.borderRadius,
          firstInputBorderWidth: firstInput ? getComputedStyle(firstInput).borderTopWidth : null,
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
      if (family === 'flowbite')
        expect(parseFloat(native.firstInputBorderWidth ?? '0')).toBeGreaterThan(0);
      expect(webcomponent).toEqual({ ...native, root: true });
    }
  },
  { locales: ['en'], hosts: ['native'], timeout: 60_000 },
);
