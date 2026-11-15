import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';

demoTest(
  'demo common settings override authored config for the session only',
  async ({ page, family, locale, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/spec-categorization?drawer=false`);

    const labels = messages[locale];
    await page.getByRole('button', { name: labels['nav.openSettings'] }).click();
    if (family === 'shadcn') {
      await page.getByText(labels['settings.dark'], { exact: true }).click();
    } else {
      await page.getByRole('button', { name: labels['settings.dark'], exact: true }).click();
    }
    await page.getByText('RTL', { exact: true }).click();
    if (family === 'shadcn') {
      await page.locator('#layout').click();
      await page.getByRole('option', { name: labels['settings.demoAndData'] }).click();
      await page.locator('#validation-mode').click();
      await page.getByRole('option', { name: labels['settings.noValidation'] }).click();
    } else {
      await page.locator('#layout').selectOption('demo-and-data');
      await page.locator('#validation-mode').selectOption('NoValidation');
    }
    for (const key of [
      'settings.hideRequired',
      'settings.showDescription',
      'settings.collapseNew',
      'settings.hideSummary',
      'settings.collapseInitially',
      'settings.hideAvatar',
      'settings.filterErrors',
      'settings.additional',
    ] as const) {
      await page.getByText(labels[key], { exact: true }).click();
    }
    await page.getByRole('button', { name: labels['nav.closeSettings'] }).last().click();
    await page.getByRole('button', { name: labels['nav.svelte'] }).click();

    const host = page.locator(`jsonforms-svelte-${family}`);
    const config = async () =>
      host.evaluate((element) => JSON.parse((element as HTMLElement & { config: string }).config));
    await expect.poll(() => host.count()).toBe(1);
    expect(await host.evaluate((element) => (element as HTMLElement & { mode: string }).mode)).toBe(
      'dark',
    );
    expect(await host.evaluate((element) => getComputedStyle(element).direction)).toBe('rtl');
    expect(
      await host.evaluate(
        (element) => (element as HTMLElement & { validationMode: string }).validationMode,
      ),
    ).toBe('NoValidation');
    expect(
      await page.evaluate(
        (family) => JSON.parse(localStorage.getItem(`${family}-example-mode`) ?? 'null'),
        family,
      ),
    ).toEqual({ version: 1, value: 'dark' });
    expect(
      await page.evaluate(
        (family) => JSON.parse(localStorage.getItem(`${family}-example-layout`) ?? 'null'),
        family,
      ),
    ).toEqual({ version: 1, value: 'demo-and-data' });
    expect(await config()).toMatchObject({
      restrict: true,
      hideRequiredAsterisk: true,
      showUnfocusedDescription: false,
      collapseNewItems: true,
      hideArraySummaryValidation: true,
      hideAvatar: true,
      enableFilterErrorsBeforeTouch: true,
      allowAdditionalPropertiesIfMissing: true,
      jsonformsExtended: {
        array: { collapsed: true },
        showValidationIndicator: true,
        showDataIndicator: true,
      },
    });

    await page.reload();
    await expect.poll(() => host.count()).toBe(1);
    expect(await host.evaluate((element) => (element as HTMLElement & { mode: string }).mode)).toBe(
      'dark',
    );
    expect(await host.evaluate((element) => getComputedStyle(element).direction)).toBe('ltr');
    expect(
      await host.evaluate(
        (element) => (element as HTMLElement & { validationMode: string }).validationMode,
      ),
    ).toBe('ValidateAndShow');
    await page.getByRole('button', { name: labels['nav.openSettings'] }).click();
    if (family === 'shadcn') {
      expect(await page.locator('#layout').textContent()).toContain(labels['settings.demoAndData']);
      await page.locator('#layout').click();
      await page.getByRole('option', { name: labels['settings.defaultLayout'] }).click();
    } else {
      expect(await page.locator('#layout').inputValue()).toBe('demo-and-data');
      await page.locator('#layout').selectOption('default');
    }
    await page.getByRole('button', { name: labels['nav.closeSettings'] }).last().click();
    expect(
      await page.evaluate(
        (family) => JSON.parse(localStorage.getItem(`${family}-example-layout`) ?? 'null'),
        family,
      ),
    ).toEqual({ version: 1, value: 'default' });
    expect(await config()).toMatchObject({
      hideRequiredAsterisk: false,
      showUnfocusedDescription: true,
      collapseNewItems: false,
      hideArraySummaryValidation: false,
      hideAvatar: false,
      enableFilterErrorsBeforeTouch: false,
      allowAdditionalPropertiesIfMissing: false,
      jsonformsExtended: {
        showValidationIndicator: true,
        showDataIndicator: true,
      },
    });
    await page.reload();
    await page.getByRole('button', { name: labels['nav.openSettings'] }).click();
    if (family === 'shadcn') {
      expect(await page.locator('#layout').textContent()).toContain(
        labels['settings.defaultLayout'],
      );
    } else {
      expect(await page.locator('#layout').inputValue()).toBe('default');
    }
    expect(errors).toEqual([]);
  },
  { hosts: ['native'], timeout: 30_000 },
);

demoTest(
  'demo German and browser locale choices preserve the form data',
  async ({ page, family, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/${family}/#/examples/spec-cron-control?drawer=false`);
    const field = page.locator('input[id*="/properties/stockSync"]:visible');
    await field.fill('0 0 8 * * *');
    const chooseLocale = async (value: string, label: string) => {
      await page.getByRole('button', { name: messages.en['nav.openSettings'] }).click();
      if (family === 'shadcn') {
        await page.locator('#locale').click();
        await page.getByRole('option', { name: label }).click();
      } else {
        await page.locator('#locale').selectOption(value);
      }
      await page.getByRole('button', { name: messages.en['nav.closeSettings'] }).last().click();
    };
    await chooseLocale('de', messages.en['settings.german']);
    await page.getByRole('button', { name: messages.en['nav.svelte'] }).click();
    const host = page.locator(`jsonforms-svelte-${family}`);
    await expect
      .poll(() => host.evaluate((element) => (element as HTMLElement & { locale: string }).locale))
      .toBe('de');
    expect(await field.inputValue()).toBe('0 0 8 * * *');

    const browserLocale = await page.evaluate(() => navigator.language);
    await chooseLocale(browserLocale, messages.en['settings.browserLanguage']);
    await expect
      .poll(() => host.evaluate((element) => (element as HTMLElement & { locale: string }).locale))
      .toBe(browserLocale);
    expect(await field.inputValue()).toBe('0 0 8 * * *');
    expect(errors).toEqual([]);
  },
  { hosts: ['native'], locales: ['en'], timeout: 30_000 },
);
