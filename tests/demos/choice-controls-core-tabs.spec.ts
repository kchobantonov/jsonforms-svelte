import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/translations.json';

demoTest(
  'choice-controls-core-tabs',
  async ({ page, family, locale, webcomponent, base }) => {
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
      `${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const catalog = translations[locale];
    const tabNames = [
      catalog['featureNavigation.section1.label'],
      catalog['featureNavigation.section2.label'],
      catalog['featureNavigation.section3.label'],
      catalog['featureNavigation.section4.label'],
    ];
    const selectTab = (index: number) =>
      page.getByRole('tab', { name: tabNames[index - 1], exact: true }).click();

    await selectTab(1);
    await expect
      .poll(() =>
        page
          .locator('[data-radio-orientation]:visible')
          .first()
          .getAttribute('data-radio-orientation'),
      )
      .toBe('horizontal');
    await selectTab(2);
    await expect
      .poll(() =>
        page
          .locator('[data-radio-orientation]:visible')
          .first()
          .getAttribute('data-radio-orientation'),
      )
      .toBe('vertical');
    await selectTab(3);
    await expect
      .poll(() =>
        page
          .locator('[data-radio-orientation]:visible')
          .first()
          .getAttribute('data-radio-orientation'),
      )
      .toBe('vertical');
    await expect
      .poll(() => page.locator('[data-radio-orientation]:visible').first().textContent())
      .toContain(catalog['department.fin']);

    await selectTab(4);
    const groups = page.locator('[data-radio-orientation]:visible');
    await expect.poll(() => groups.count()).toBe(3);
    const priority = groups.nth(0);
    const region = groups.nth(1);
    const supplier = groups.nth(2);
    await expect
      .poll(() => priority.locator('input:checked, [role="radio"][aria-checked="true"]').count())
      .toBe(1);
    await expect
      .poll(() => region.locator('input:checked, [role="radio"][aria-checked="true"]').count())
      .toBe(0);
    await expect
      .poll(() => supplier.locator('input:checked, [role="radio"][aria-checked="true"]').count())
      .toBe(0);
    const invalid = page.locator('[id$="/properties/supplier-invalid-value"]:visible');
    await invalid.waitFor();
    expect(await invalid.textContent()).toContain('"Legacy"');
    await supplier.getByText('Internal', { exact: true }).click();
    await expect
      .poll(() => supplier.locator('input:checked, [role="radio"][aria-checked="true"]').count())
      .toBe(1);
    await expect.poll(() => invalid.count()).toBe(0);

    const dataLabel = demoEditorLabel(locale, 'Data');
    await page.getByRole('tab', { name: dataLabel, exact: true }).click();
    const toolbar = page.getByRole('heading', { name: dataLabel, exact: true }).locator('..');
    const editor = toolbar.locator('..').locator('.monaco-editor');
    await editor.click({ position: { x: 80, y: 20 } });
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await expect
      .poll(async () => {
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        const data = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
        return {
          priority: data.priority,
          region: data.region,
          supplier: data.supplier,
          department: data.department,
        };
      })
      .toEqual({ priority: 2, region: undefined, supplier: 'Internal', department: 'fin' });
    expect(pageErrors).toEqual([]);
  },
  { timeout: 45_000 },
);
