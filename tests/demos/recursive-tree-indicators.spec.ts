import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import sourceData from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/translations.json';

demoTest(
  'recursive-tree-indicators',
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
      `${base}/${family}/#/examples/spec-recursive-tree?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const data = structuredClone(sourceData);
    Object.assign(data.populated, { children: [{}] });
    await applyDemoEditor(page, locale, 'Data', data, { verifyVisibleText: false });
    await applyDemoEditor(page, locale, 'Config', {
      jsonformsExtended: { showValidationIndicator: true },
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', { name: translations[locale]['tree.editor.label'], exact: false })
      .click();
    const tree = page.locator('[data-recursive-tree]');
    const navigation = tree.locator('[data-recursive-tree-navigation]');
    const indicators = navigation.locator('[data-container-validation-indicator]');
    await expect.poll(() => indicators.count()).toBeGreaterThanOrEqual(2);

    await applyDemoEditor(page, locale, 'Config', {
      jsonformsExtended: { showValidationIndicator: false },
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', { name: translations[locale]['tree.editor.label'], exact: false })
      .click();
    await expect.poll(() => indicators.count()).toBe(0);
    await expect.poll(() => navigation.locator('[data-recursive-node]').count()).toBe(2);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
