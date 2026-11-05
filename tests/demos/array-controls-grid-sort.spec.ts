import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '@chobantonov/jsonforms-extended-spec/examples/array-controls/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';

demoTest('array-controls-grid-sort', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) =>
      localStorage.setItem(
        `${family}-example-locale`,
        JSON.stringify({ version: 1, value: locale }),
      ),
    { family, locale },
  );
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const tabLabel = translations[locale]['gridTab.label'];
  await page.getByRole('tab', { name: tabLabel, exact: true }).click();
  const grid = page.getByRole('tabpanel', { name: tabLabel, exact: true }).locator('.ag-root');
  const firstCode = grid.locator('.ag-row[row-index="0"] .ag-cell[col-id="code"] input');
  const header = grid.locator('.ag-header-cell[col-id="code"] .ag-header-cell-text');
  await expect.poll(() => firstCode.inputValue()).toBe('EARLY-1');
  await expect.poll(() => grid.locator('.ag-drag-handle').count()).toBe(2);

  await header.click();
  await header.click();
  await expect.poll(() => firstCode.inputValue()).toBe('EARLY-2');
  const handle = grid.locator('.ag-row[row-index="0"] .ag-drag-handle');
  await expect.poll(() => handle.isVisible()).toBe(false);

  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await expect
    .poll(async () => {
      await page
        .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
        .focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      const data = JSON.parse(
        await page.evaluate(() => navigator.clipboard.readText()),
      ) as typeof original;
      return data.tickets;
    })
    .toEqual(original.tickets);

  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await page.getByRole('tab', { name: tabLabel, exact: true }).click();
  await header.click();
  await expect.poll(() => firstCode.inputValue()).toBe('EARLY-1');
  const sortHeader = grid.locator('.ag-header-cell[col-id="code"]');
  const isSorted = async () =>
    ['ascending', 'descending'].includes((await sortHeader.getAttribute('aria-sort')) ?? '');
  for (let attempt = 0; attempt < 3 && (await isSorted()); attempt++) await header.click();
  await expect.poll(isSorted).toBe(false);
  await expect.poll(() => handle.isVisible()).toBe(true);

  const filterButton = grid.locator('.ag-header-cell[col-id="code"] .ag-header-cell-filter-button');
  await filterButton.click();
  const filterInput = page.locator('.ag-popup input.ag-text-field-input').first();
  await filterInput.waitFor();
  const gridElement = await grid.elementHandle();
  if (!gridElement) throw new Error('Missing AG Grid element');
  expect(
    await filterInput.evaluate(
      (input, target) => input.getRootNode() === target.getRootNode(),
      gridElement,
    ),
  ).toBe(true);
  expect(await filterInput.evaluate((input) => input.getRootNode() instanceof ShadowRoot)).toBe(
    webcomponent,
  );
  const filterSurface = filterInput.locator('xpath=ancestor::*[contains(@class,"ag-menu")][1]');
  const filterBackground = await filterSurface.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  expect(filterBackground).not.toBe('rgba(0, 0, 0, 0)');
  if (family === 'flowbite' && locale === 'en') {
    const setMode = async (mode: 'light' | 'dark') => {
      if (webcomponent) {
        await page.locator('jsonforms-svelte-flowbite').evaluate((element, next) => {
          element.setAttribute('mode', next);
        }, mode);
      } else {
        await page.evaluate((next) => {
          document.documentElement.classList.toggle('dark', next === 'dark');
        }, mode);
      }
    };
    await setMode('dark');
    await expect
      .poll(() => filterSurface.evaluate((element) => getComputedStyle(element).backgroundColor))
      .not.toBe(filterBackground);
    await setMode('light');
    await expect
      .poll(() => filterSurface.evaluate((element) => getComputedStyle(element).backgroundColor))
      .toBe(filterBackground);
  }
  const popupBox = await filterInput.boundingBox();
  const viewport = page.viewportSize();
  expect(popupBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(popupBox!.x).toBeGreaterThanOrEqual(-1);
  expect(popupBox!.y).toBeGreaterThanOrEqual(-1);
  expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(popupBox!.y + popupBox!.height).toBeLessThanOrEqual(viewport!.height + 1);
  await filterInput.fill('EARLY-2');
  await filterInput.press('Escape');
  await expect.poll(() => grid.locator('.ag-row[row-index]').count()).toBe(1);
  await expect.poll(() => firstCode.inputValue()).toBe('EARLY-2');
  await expect.poll(() => handle.isVisible()).toBe(false);
  await filterButton.click();
  await filterInput.fill('');
  await filterInput.press('Escape');
  await expect.poll(() => grid.locator('.ag-row[row-index]').count()).toBe(2);
  await expect.poll(() => firstCode.inputValue()).toBe('EARLY-1');
  await expect.poll(() => handle.isVisible()).toBe(true);

  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  await expect
    .poll(async () => {
      await page
        .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
        .focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      const data = JSON.parse(
        await page.evaluate(() => navigator.clipboard.readText()),
      ) as typeof original;
      return data.tickets;
    })
    .toEqual(original.tickets);
  expect(pageErrors).toEqual([]);
});
