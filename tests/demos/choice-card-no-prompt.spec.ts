import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import data from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/translations.json';

demoTest(
  'choice-card-no-prompt',
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
    await page.getByRole('tab', { name: labels['cards.noPrompt.label'], exact: true }).click();
    const group = page.getByRole('radiogroup', { name: labels['cardContact.label'], exact: true });
    const email = group.getByRole('radio', { name: labels['cards.contact0.label'], exact: true });
    const postal = group.getByRole('radio', { name: labels['cards.contact1.label'], exact: true });
    await expect.poll(() => email.isChecked()).toBe(true);
    await group.getByText(labels['cards.contact1.label'], { exact: true }).click();
    await expect.poll(() => postal.isChecked()).toBe(true);
    expect(await page.getByRole('dialog').count()).toBe(0);
    const street = page.getByRole('textbox', {
      name: labels['cardContact.street.label'],
      exact: true,
    });
    const city = page.getByRole('textbox', { name: labels['cardContact.city.label'], exact: true });
    await street.fill('123 Example Street');
    await city.fill('Boston');
    await city.blur();
    await group.getByText(labels['cards.contact0.label'], { exact: true }).click();
    await expect.poll(() => email.isChecked()).toBe(true);
    expect(await page.getByRole('dialog').count()).toBe(0);
    const address = page.getByRole('textbox', {
      name: labels['cards.address.label'],
      exact: true,
    });
    await address.fill('new@example.com');
    await address.blur();

    const dataLabel = demoEditorLabel(locale, 'Data');
    await page.getByRole('tab', { name: dataLabel, exact: true }).click();
    const editor = page
      .getByRole('heading', { name: dataLabel, exact: true })
      .locator('..')
      .locator('..')
      .locator('.monaco-editor');
    await editor.click({ position: { x: 80, y: 20 } });
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await expect
      .poll(async () => {
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual({ ...data, cardContact: { kind: 'email', address: 'new@example.com' } });
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);
