import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '@chobantonov/jsonforms-extended-spec/examples/collection-pagination/data.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'collection-pagination-actions',
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
      `${base}/${family}/#/examples/spec-collection-pagination?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const rows = page.locator('tbody [data-array-row-index]');
    await expect.poll(() => rows.count()).toBe(5);
    const size = page.getByRole('button', {
      name: messages[locale]['collection.pageSize'],
      exact: true,
    });
    let checkedSizePopup = false;
    const setSize = async (value: '5' | '10') => {
      if (family === 'shadcn') {
        await size.click({ timeout: 3000 });
        if (!checkedSizePopup) {
          const popup = page
            .getByRole('option', { name: value, exact: true })
            .locator('xpath=ancestor::*[@role="listbox"][1]');
          expect(
            await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
          ).toBe(webcomponent);
          expect(
            await popup.evaluate((element) => getComputedStyle(element).backgroundColor),
          ).not.toBe('rgba(0, 0, 0, 0)');
          await page.keyboard.press('Escape');
          await expect.poll(() => popup.isVisible()).toBe(false);
          await expect.poll(() => size.evaluate((element) => element.matches(':focus'))).toBe(true);
          checkedSizePopup = true;
          await size.click({ timeout: 3000 });
        }
        await page.getByRole('option', { name: value, exact: true }).click({ timeout: 3000 });
      } else {
        await page
          .getByRole('combobox', {
            name: messages[locale]['collection.pageSize'],
            exact: true,
          })
          .selectOption(value);
      }
      await expect.poll(() => rows.count()).toBe(Number(value));
    };
    await setSize('10');
    await setSize('5');

    const add = page.locator('[data-array-actions]').getByRole('button', {
      name: new RegExp('^' + messages[locale]['array.addAriaLabelWithLabel'].split('{label}')[0]),
    });
    await add.click({ timeout: 3000 });
    const added = page.locator('tbody [data-array-row-index="12"]');
    await added.waitFor({ timeout: 3000 });
    await added.getByRole('textbox').first().fill('New applicant');
    const remove = async (index: number) => {
      const row = page.locator(`tbody [data-array-row-index="${index}"]`);
      await row.getByRole('checkbox').click();
      await page.locator('[data-delete-selected]').click({ timeout: 3000 });
      const dialog = page.getByRole('dialog', {
        name: messages[locale]['collection.deleteSelected'],
        exact: true,
      });
      if (await dialog.count()) {
        await dialog
          .getByText(messages[locale]['collection.deleteSelectedMessage'], { exact: true })
          .waitFor();
        await dialog
          .getByRole('button', {
            name: messages[locale]['collection.deleteSelected'],
            exact: true,
          })
          .click();
      }
      await expect.poll(() => row.count()).toBe(0);
    };
    await remove(12);
    await remove(11);
    await remove(10);
    await expect.poll(() => page.locator('tbody [data-array-row-index="5"]').count()).toBe(1);
    await expect.poll(() => rows.count()).toBe(5);

    let data: typeof original;
    if (webcomponent) {
      data = await page.locator(`jsonforms-svelte-${family}`).evaluate((element) => {
        const value = (element as HTMLElement & { data: string | typeof original }).data;
        return typeof value === 'string' ? JSON.parse(value) : value;
      });
    } else {
      const dataLabel = demoEditorLabel(locale, 'Data');
      await page.getByRole('tab', { name: dataLabel, exact: true }).click();
      const toolbar = page.getByRole('heading', { name: dataLabel, exact: true }).locator('..');
      await toolbar
        .locator('..')
        .locator('.monaco-editor')
        .click({ position: { x: 80, y: 20 } });
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      data = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    }
    assert.deepEqual(data.applicants, original.applicants.slice(0, 10));
    assert.deepEqual(errors, []);
  },
  { timeout: 30_000 },
);
