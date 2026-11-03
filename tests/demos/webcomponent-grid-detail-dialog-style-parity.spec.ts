import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-ag-grid/translations.supplement.json';
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
      await page.goto(
        `${base}/${family}/#/examples/spec-ag-grid?use-webcomponent=${webcomponent}&drawer=false`,
      );
      await page.reload();
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
  { locales: ['en'], hosts: ['native'], timeout: 60_000 },
);
