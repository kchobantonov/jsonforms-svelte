import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'dynamic playground layout expression',
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
      `${base}/${family}/#/examples/spec-dynamic-playground?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const config = page.getByTestId('dynamic-playground-configuration');
    const compact = config.getByRole('checkbox', {
      name: locale === 'bg' ? 'Компактно разстояние в прегледа' : 'Compact preview spacing',
    });
    const name = page
      .locator('label')
      .filter({ hasText: locale === 'bg' ? /^Име/ : /^Name/ })
      .first();
    const plan = page
      .locator('label')
      .filter({ hasText: locale === 'bg' ? /^План/ : /^Plan/ })
      .first();
    const previewLayout = webcomponent
      ? page
          .locator(`jsonforms-svelte-${family}`)
          .first()
          .locator('[data-layout][data-layout-mode="portable"]')
          .first()
      : page.locator('[data-layout][data-layout-mode="portable"]').first();
    await expect.poll(() => compact.isVisible()).toBe(true);
    await expect.poll(() => plan.isVisible()).toBe(true);
    const initialGap = (await plan.boundingBox())!.y - (await name.boundingBox())!.y;
    expect(await previewLayout.evaluate((element) => (element as HTMLElement).style.gap)).toBe(
      '24px',
    );
    await compact.click();
    await expect.poll(() => compact.isChecked()).toBe(true);
    await expect
      .poll(() => previewLayout.evaluate((element) => (element as HTMLElement).style.gap))
      .toBe('8px');
    await expect
      .poll(async () => (await plan.boundingBox())!.y - (await name.boundingBox())!.y)
      .toBeLessThan(initialGap - 8);
    await compact.click();
    await expect
      .poll(async () => (await plan.boundingBox())!.y - (await name.boundingBox())!.y)
      .toBeGreaterThan(initialGap - 3);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);

demoTest(
  'dynamic playground presentation selection',
  async ({ page, family, webcomponent, base }) => {
    await page.goto(
      `${base}/${family}/#/examples/spec-dynamic-playground?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const configuration = page.getByTestId('dynamic-playground-configuration');
    await expect.poll(() => configuration.isVisible()).toBe(true);
    const name = page.getByRole('textbox', { name: /^Name/ }).first();
    await expect.poll(() => name.inputValue()).toBe('Ada');
    await configuration.getByRole('textbox', { name: 'Preview label' }).fill('Choose a plan');
    await expect
      .poll(() =>
        page
          .locator('label')
          .filter({ hasText: /^Choose a plan/ })
          .count(),
      )
      .toBe(1);
    const presentation = configuration.getByRole(family === 'shadcn' ? 'button' : 'combobox', {
      name: 'Preview presentation',
    });
    await expect.poll(() => presentation.isVisible()).toBe(true);
    const choose = async (value: string) => {
      if (family === 'flowbite') await presentation.selectOption(value);
      else {
        await presentation.click();
        await page.getByRole('option', { name: value, exact: true }).click();
      }
    };
    await choose('radio');
    await expect.poll(() => page.getByRole('radio').count()).toBeGreaterThan(0);
    expect(await name.inputValue()).toBe('Ada');
    await choose('automatic');
    await expect.poll(() => page.getByRole('radio').count()).toBe(0);
    expect(await name.inputValue()).toBe('Ada');
  },
  { timeout: 30_000 },
);

demoTest(
  'dynamic playground localized default and custom label reset',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/spec-dynamic-playground?drawer=false`);
    const configuration = page.getByTestId('dynamic-playground-configuration');
    const input = configuration.getByRole('textbox', {
      name: locale === 'bg' ? 'Етикет на прегледа' : 'Preview label',
      exact: true,
    });
    const translated = locale === 'bg' ? 'План' : 'Plan';
    const labels = page.locator('label');
    await expect
      .poll(() => labels.filter({ hasText: new RegExp(`^${translated}\\s*\\*?$`) }).count())
      .toBe(1);
    await input.fill('Custom subscription');
    await expect.poll(() => labels.filter({ hasText: /^Custom subscription/ }).count()).toBe(1);
    await input.fill('');
    await expect
      .poll(() => labels.filter({ hasText: new RegExp(`^${translated}\\s*\\*?$`) }).count())
      .toBe(1);
    const amountInput = configuration.getByRole('textbox', {
      name: locale === 'bg' ? 'Етикет за сумата' : 'Amount label',
      exact: true,
    });
    const amount = locale === 'bg' ? 'Сума' : 'Amount';
    await expect
      .poll(() => page.getByRole('spinbutton', { name: amount, exact: true }).count())
      .toBe(1);
    await amountInput.fill('Custom budget');
    await expect
      .poll(() => page.getByRole('spinbutton', { name: 'Custom budget', exact: true }).count())
      .toBe(1);
    await amountInput.fill('');
    await expect
      .poll(() => page.getByRole('spinbutton', { name: amount, exact: true }).count())
      .toBe(1);
  },
  { hosts: ['native'], timeout: 30_000 },
);
