import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/translations.json';
import initialData from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/data.json';

demoTest(
  'choice-card-validation',
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
      `${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const labels = translations[locale];
    await page.getByRole('tab', { name: labels['cards.validation.label'], exact: true }).click();
    const required = page.getByRole('radiogroup', {
      name: labels['cards.requiredDecision.label'],
      exact: true,
    });
    const imported = page.getByRole('radiogroup', {
      name: labels['cards.invalidDecision.label'],
      exact: true,
    });
    await expect.poll(() => required.getAttribute('aria-invalid')).toBe('true');
    await expect.poll(() => required.getByRole('radio', { checked: true }).count()).toBe(0);
    await expect.poll(() => imported.getAttribute('aria-invalid')).toBe('true');
    await expect.poll(() => imported.getByRole('radio', { checked: true }).count()).toBe(0);
    const invalidValue = page.locator(
      '[id$="/properties/invalidCardDecision-invalid-value"]:visible',
    );
    await expect.poll(() => invalidValue.textContent()).toContain('"legacy"');
    const description = await imported.getAttribute('aria-describedby');
    expect(description?.split(' ')).toContain(await invalidValue.getAttribute('id'));

    await required.getByText(labels['cards.approve.label'], { exact: true }).click();
    await imported.getByText(labels['cards.decline.label'], { exact: true }).click();
    await expect.poll(() => invalidValue.count()).toBe(0);
    await expect.poll(() => required.getAttribute('aria-invalid')).not.toBe('true');
    await expect.poll(() => imported.getAttribute('aria-invalid')).not.toBe('true');
    const address = page.getByRole('textbox', {
      name: labels['cards.invalidAddress.label'],
      exact: true,
    });
    await expect.poll(() => address.getAttribute('aria-invalid')).toBe('true');
    await address.fill('repaired@example.com');
    await address.blur();
    await expect.poll(() => address.getAttribute('aria-invalid')).not.toBe('true');

    const dataLabel = demoEditorLabel(locale, 'Data');
    await page.getByRole('tab', { name: dataLabel, exact: true }).click();
    const editor = page
      .getByRole('heading', { name: dataLabel, exact: true })
      .locator('..')
      .locator('..')
      .locator('.monaco-editor');
    await editor.click({ position: { x: 80, y: 20 } });
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const expected = { ...structuredClone(initialData), requiredCardDecision: 'approve' };
    expected.invalidCardDecision = 'decline';
    expected.invalidCardContact.address = 'repaired@example.com';
    await expect
      .poll(async () => {
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual(expected);
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);
