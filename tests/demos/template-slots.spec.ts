import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/template-slots/translations.json';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest(
  'template-slots',
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
      `${base}/${family}/#/examples/spec-template-slots?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const label = (key: keyof typeof translations.en) => translations[locale][key];
    await expect
      .poll(() =>
        page
          .getByText(label('specTemplateSlots.ui.elements.1.elements.0.text'), { exact: true })
          .count(),
      )
      .toBe(1);
    await expect
      .poll(() =>
        page
          .getByText(label('specTemplateSlots.registry.0.elements.0.elements.0.text'), {
            exact: true,
          })
          .count(),
      )
      .toBe(1);
    await expect
      .poll(() =>
        page
          .getByText(label('specTemplateSlots.registry.1.elements.0.elements.0.text'), {
            exact: true,
          })
          .count(),
      )
      .toBe(1);
    await expect
      .poll(() =>
        page
          .getByText(label('specTemplateSlots.ui.elements.3.elements.0.text'), { exact: true })
          .count(),
      )
      .toBe(0);
    const contact = page.getByRole('textbox', {
      name: label('specTemplateSlots.ui.elements.1.elements.1.label'),
      exact: true,
    });
    const fallback = page.getByRole('textbox', {
      name: label('specTemplateSlots.registry.0.elements.1.elements.0.label'),
      exact: true,
    });
    const email = page.getByRole('textbox', {
      name: label('specTemplateSlots.ui.elements.3.elements.1.label'),
      exact: true,
    });
    await expect.poll(() => contact.inputValue()).toBe('Ada');
    await expect.poll(() => fallback.inputValue()).toBe('Ada');
    await expect.poll(() => email.inputValue()).toBe('ada@example.org');
    await contact.fill('Grace');
    await expect.poll(() => fallback.inputValue()).toBe('Grace');
    await fallback.fill('Lin');
    await expect.poll(() => contact.inputValue()).toBe('Lin');
    await email.fill('lin@example.org');
    await expect.poll(() => email.inputValue()).toBe('lin@example.org');
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
      .toEqual({ name: 'Lin', email: 'lin@example.org' });
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);
