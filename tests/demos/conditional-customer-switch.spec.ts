import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import data from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-conditional-fields/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-conditional-fields/translations.json';

for (const variant of ['Generated fields', 'Authored placement'] as const) {
  demoTest(
    `conditional-customer-switch-${variant}`,
    async ({ page, family, locale, webcomponent, base }) => {
      await page.addInitScript(
        ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
        { family, locale },
      );
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        `${base}/${family}/#/examples/spec-conditional-fields?use-webcomponent=${webcomponent}&drawer=false`,
      );
      const catalog = translations[locale];
      await page.getByRole('tab', { name: catalog[`${variant}.label`], exact: true }).click();
      const field = (name: string) => page.locator(`input[id*="/properties/${name}"]:visible`);
      await expect.poll(() => field('vatNumber').inputValue()).toBe('VAT123');
      await expect.poll(() => field('nickname').count()).toBe(0);
      const customerType = page
        .locator('[id*="/properties/customerType"][id$="-input"]:visible')
        .first();
      const selectCustomerType = async (kind: 'personal' | 'business') => {
        const label = catalog[`customerType.${kind}`];
        if (family === 'flowbite') {
          await customerType.selectOption({ label });
        } else {
          await customerType.click();
          await page.getByRole('option', { name: label, exact: true }).click();
        }
      };
      await selectCustomerType('personal');
      await expect.poll(() => field('vatNumber').count()).toBe(0);
      await expect.poll(() => field('nickname').count()).toBe(1);
      await field('nickname').fill('Alias');
      await field('nickname').blur();
      await selectCustomerType('business');
      await expect.poll(() => field('vatNumber').inputValue()).toBe('VAT123');
      await expect.poll(() => field('nickname').count()).toBe(0);
      await selectCustomerType('personal');
      await expect.poll(() => field('vatNumber').count()).toBe(0);
      await expect.poll(() => field('nickname').inputValue()).toBe('Alias');
      await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
      const editor = page.locator('.monaco-editor:visible');
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await expect
        .poll(async () => {
          await editor.locator('.inputarea, .native-edit-context').focus();
          await page.keyboard.press('ControlOrMeta+A');
          await page.keyboard.press('ControlOrMeta+C');
          return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
        })
        .toEqual({ ...data, customerType: 'personal', nickname: 'Alias' });
      expect(errors).toEqual([]);
    },
  );
}
