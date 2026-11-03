import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-ag-grid/translations.supplement.json';

demoTest(
  'performance-editor-grid-lifecycle',
  async ({ page, family, locale, webcomponent, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-ag-grid?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const label = translations[locale]['specAgGrid.ui.elements.1.label'];
    const gridTab = page.getByRole('tab', { name: label, exact: true });
    const demoTab = page.getByRole('tab', { name: /^Demo/ });
    const dataTab = page.getByRole('tab', { name: 'Data', exact: true });
    const grid = page.getByRole('tabpanel', { name: label, exact: true }).locator('.ag-root');
    const first = grid.locator('.ag-row[row-index="0"] [col-id="name"] input');
    const editor = page.locator('.monaco-editor:visible');
    const exampleRoute = `#/examples/spec-ag-grid?use-webcomponent=${webcomponent}&drawer=false`;
    const home = () => page.locator('a[href="#/"]').first().click();
    const openExample = async () => {
      if (family === 'skeleton') {
        const examples = page.locator('[data-demo-examples-trigger]');
        if ((await examples.getAttribute('aria-expanded')) !== 'true') await examples.click();
        await page
          .getByRole('option', {
            name: 'Spec: AG Grid: portable options and native overrides',
            exact: true,
          })
          .click();
      } else {
        await page
          .locator('a[href^="#/examples/spec-ag-grid"]')
          .first()
          .evaluate((element, hash) => {
            const link = element as HTMLAnchorElement;
            link.setAttribute('href', hash);
            link.click();
          }, exampleRoute);
      }
    };
    await gridTab.click();
    await expect.poll(() => first.inputValue()).toBe('Alex Rivera');
    const gridTeardown: number[] = [];
    const gridMount: number[] = [];
    const editorTeardown: number[] = [];
    const editorMount: number[] = [];
    for (let iteration = 0; iteration < 6; iteration++) {
      const oldGrid = await grid.elementHandle();
      expect(oldGrid).not.toBeNull();
      const gridTeardownStart = await page.evaluate(() => performance.now());
      await home();
      await expect.poll(() => oldGrid!.evaluate((element) => element.isConnected)).toBe(false);
      const gridTeardownElapsed =
        (await page.evaluate(() => performance.now())) - gridTeardownStart;
      const gridMountStart = await page.evaluate(() => performance.now());
      await openExample();
      await gridTab.click();
      await expect.poll(() => first.inputValue()).toBe('Alex Rivera');
      await expect
        .poll(() => page.locator(`jsonforms-svelte-${family}`).count())
        .toBe(webcomponent ? 1 : 0);
      const gridMountElapsed = (await page.evaluate(() => performance.now())) - gridMountStart;
      await dataTab.click();
      await editor.waitFor({ state: 'visible' });
      const oldEditor = await editor.elementHandle();
      expect(oldEditor).not.toBeNull();
      const editorTeardownStart = await page.evaluate(() => performance.now());
      await home();
      await expect.poll(() => oldEditor!.evaluate((element) => element.isConnected)).toBe(false);
      const editorTeardownElapsed =
        (await page.evaluate(() => performance.now())) - editorTeardownStart;
      const editorMountStart = await page.evaluate(() => performance.now());
      await openExample();
      await dataTab.click();
      await editor.waitFor({ state: 'visible' });
      const editorMountElapsed = (await page.evaluate(() => performance.now())) - editorMountStart;
      await demoTab.click();
      await gridTab.click();
      await expect.poll(() => first.inputValue()).toBe('Alex Rivera');
      if (iteration > 0) {
        gridTeardown.push(gridTeardownElapsed);
        gridMount.push(gridMountElapsed);
        editorTeardown.push(editorTeardownElapsed);
        editorMount.push(editorMountElapsed);
      }
    }
    for (const samples of [gridTeardown, gridMount, editorTeardown, editorMount]) {
      samples.sort((a, b) => a - b);
      expect(samples[4]).toBeLessThan(3000);
    }
    expect(errors).toEqual([]);
    console.log(
      `performance-editor-grid-lifecycle ${family} ${webcomponent ? 'webcomponent' : 'native'}: grid teardown/mount p95 ${gridTeardown[4]!.toFixed(1)}/${gridMount[4]!.toFixed(1)} ms, Monaco teardown/mount p95 ${editorTeardown[4]!.toFixed(1)}/${editorMount[4]!.toFixed(1)} ms`,
    );
  },
  { locales: ['en'], timeout: 60_000 },
);
