import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import uiSchema from '@chobantonov/jsonforms-extended-spec/examples/container-validation-indicator/uischema.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/container-validation-indicator/translations.json';

demoTest(
  'container-validation-array-summary-enabled',
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
      `${base}/${family}/#/examples/spec-container-validation-indicator?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const enabled = structuredClone(uiSchema);
    const certifications = enabled.elements[1]?.elements?.[1]?.elements?.[0] as
      | { options?: Record<string, unknown> }
      | undefined;
    if (!certifications?.options) throw new Error('Certifications control is missing');
    expect(certifications.options.showValidationIndicator).toBe(false);
    certifications.options.showValidationIndicator = true;
    await applyDemoEditor(page, locale, 'UI Schema', enabled, { verifyVisibleText: false });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    const category = translations[locale]['compliance.label'];
    await page
      .getByRole('tab', { name: category, exact: false })
      .or(page.getByRole('button', { name: category, exact: false }))
      .first()
      .click();
    const title = page.getByRole('heading', {
      name: translations[locale]['certifications.label'],
      exact: true,
    });
    const indicator = title.locator('..').locator('[data-container-validation-indicator]');
    await expect.poll(() => indicator.count()).toBe(1);
    await expect.poll(() => page.locator('[data-array-summary]:visible').count()).toBe(0);
    await indicator.click();
    const summary = page.locator('[data-error-summary]:visible');
    await expect.poll(() => summary.locator('li').count()).toBe(3);
    const popup = summary.locator('xpath=ancestor::*[@role="dialog"][1]');
    expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    expect(await popup.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
      'rgba(0, 0, 0, 0)',
    );
    const more = summary.getByRole('button', {
      name: new RegExp(translations[locale]['validation.showMore'].split('{count}')[0].trim()),
    });
    await more.click();
    await expect.poll(() => summary.locator('li').count()).toBeGreaterThan(3);
    await expect.poll(() => summary.innerText()).toMatch(/ \/ [234] \/ /);
    await expect.poll(() => summary.innerText()).toContain(translations[locale]['error.minLength']);
    await summary
      .getByRole('button', { name: translations[locale]['validation.showLess'], exact: true })
      .click();
    await expect.poll(() => summary.locator('li').count()).toBe(3);
    await page.keyboard.press('Escape');
    await expect.poll(() => summary.count()).toBe(0);
    await expect.poll(() => indicator.evaluate((element) => element.matches(':focus'))).toBe(true);
    expect(errors).toEqual([]);
  },
);
