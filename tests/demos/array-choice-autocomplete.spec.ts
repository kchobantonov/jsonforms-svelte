import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-choices/translations.json';
import supplements from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-choices/supplemental-translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'array-choice-autocomplete',
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
      `${base}/${family}/#/examples/spec-array-choices?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const showDemo = async () => {
      await page
        .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
        .click();
      await page
        .getByRole('tab', { name: translations[locale]['featureNavigation.section1.label'] })
        .click();
    };
    const label = supplements[locale]['alerts.label'];
    const trigger = () =>
      family === 'flowbite'
        ? page.getByRole('listbox', { name: label, exact: true })
        : page.locator('[id*="/properties/alerts-input"]:visible');
    const searchLabel = messages[locale]['arrayChoices.search'];

    await applyDemoEditor(page, locale, 'Config', { autocomplete: false });
    await showDemo();
    if (family === 'flowbite') {
      await expect.poll(() => page.getByRole('textbox', { name: searchLabel }).count()).toBe(0);
    } else if (family === 'skeleton') {
      await expect
        .poll(() => trigger().evaluate((element) => (element as HTMLInputElement).readOnly))
        .toBe(true);
    }
    await trigger().click();
    if (family === 'shadcn')
      await expect.poll(() => page.getByRole('combobox', { name: searchLabel }).count()).toBe(0);
    if (family === 'flowbite') {
      await trigger()
        .locator(':scope > [role="presentation"] > [role="presentation"]')
        .filter({ hasText: 'SMS' })
        .click();
    } else {
      await page.getByRole('option', { name: 'SMS', exact: true }).click();
      await page.keyboard.press('Escape');
    }
    await page
      .getByRole('button', {
        name: messages[locale]['arrayChoices.remove'].replace('{label}', 'SMS'),
        exact: true,
      })
      .waitFor();

    await applyDemoEditor(page, locale, 'Config', { autocomplete: true });
    await showDemo();
    if (family === 'flowbite') {
      await expect.poll(() => page.getByRole('textbox', { name: searchLabel }).count()).toBe(2);
    } else if (family === 'skeleton') {
      await expect
        .poll(() => trigger().evaluate((element) => (element as HTMLInputElement).readOnly))
        .toBe(false);
    } else {
      await trigger().click();
      await page.getByRole('combobox', { name: searchLabel }).waitFor();
    }
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
