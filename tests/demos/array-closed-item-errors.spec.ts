import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '@chobantonov/jsonforms-extended-spec/examples/array-controls/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';

demoTest(
  'array-closed-item-errors',
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
      `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const applyData = async (data: unknown) => {
      const label = demoEditorLabel(locale, 'Data');
      await page.getByRole('tab', { name: label, exact: true }).click();
      const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
      const input = toolbar.locator('..').locator('.inputarea, .native-edit-context');
      await input.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await input.evaluate(
        (element, text) => {
          const clipboardData = new DataTransfer();
          clipboardData.setData('text/plain', text);
          element.dispatchEvent(
            new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
          );
        },
        JSON.stringify(data, null, 2),
      );
      await toolbar.getByRole('button').nth(1).click();
    };

    const invalid = structuredClone(original);
    invalid.speakers[1].name = 'x';
    await applyData(invalid);
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    const category = translations[locale]['expandableTab.label'];
    await page.getByRole('tab', { name: category, exact: true }).click();
    const panel = page.getByRole('tabpanel', { name: category, exact: true });
    const indicator = panel.locator('[data-row-summary]');
    await expect.poll(() => indicator.count()).toBe(1);
    const disclosureExpanded = () =>
      indicator.evaluate(
        (node) =>
          node.parentElement?.parentElement?.parentElement
            ?.querySelector('button[aria-expanded]')
            ?.getAttribute('aria-expanded') ?? null,
      );
    expect(await disclosureExpanded()).toBe('false');
    await indicator.hover();
    await expect
      .poll(
        async () =>
          (await page.locator('[data-error-summary]:visible').first().textContent()) ?? '',
      )
      .toMatch(/2/);
    expect(await disclosureExpanded()).toBe('false');

    await applyData(original);
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page.getByRole('tab', { name: category, exact: true }).click();
    await expect
      .poll(() =>
        page
          .getByRole('tabpanel', { name: category, exact: true })
          .locator('[data-row-summary]')
          .count(),
      )
      .toBe(0);
    expect(pageErrors).toEqual([]);
  },
  { timeout: 30_000 },
);
