import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';

const devFamily = process.env.JSONFORMS_DEMO_FAMILY;
const families =
  devFamily === 'flowbite' || devFamily === 'shadcn' || devFamily === 'skeleton'
    ? ([devFamily] as const)
    : undefined;
const devHost = process.env.JSONFORMS_DEMO_HOST;
const hosts = devHost === 'native' || devHost === 'webcomponent' ? ([devHost] as const) : undefined;
const devLocale = process.env.JSONFORMS_DEMO_LOCALE;
const locales = devLocale === 'en' || devLocale === 'bg' ? ([devLocale] as const) : undefined;

demoTest(
  'demo-url-routing',
  async ({ page, family, locale, webcomponent, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const origin = process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`;
    const hostSetting = webcomponent ? '&use-webcomponent=true' : '';
    await page.goto(
      `${origin}?form-only=true&campaign=spring#/examples/Readonly%20Fields?form-only=false&drawer=true${hostSetting}`,
    );
    await page.getByRole('heading', { name: 'Readonly examples' }).waitFor();
    await page.getByRole('button', { name: messages[locale]['nav.showFormOnly'] }).waitFor();

    const cronHash = `#/examples/spec-cron-control?form-only=false&drawer=true${hostSetting}`;
    if (family === 'skeleton') {
      await page.getByRole('option', { name: 'Spec: Cron control' }).click();
    } else {
      const cronLink = page.getByRole('link', { name: 'Spec: Cron control' });
      expect(await cronLink.getAttribute('href')).toBe(cronHash);
      await cronLink.click();
    }
    await page.getByRole('heading', { name: 'Spec: Cron control' }).waitFor();
    const expression = page.locator('input[id*="/properties/stockSync"]:visible');
    await expression.fill('0 0 9 * * *');
    await page.getByRole('button', { name: messages[locale]['nav.showFormOnly'] }).click();
    expect(await expression.inputValue()).toBe('0 0 9 * * *');
    const url = new URL(page.url());
    expect(url.search).toBe('?campaign=spring');
    expect(url.hash).toBe(`#/examples/spec-cron-control?form-only=true&drawer=true${hostSetting}`);

    await page.evaluate((webcomponent) => {
      history.pushState(
        history.state,
        '',
        `${location.pathname}${location.search}#/examples/spec-cron-control?form-only=false&drawer=true${webcomponent ? '&use-webcomponent=true' : ''}`,
      );
    }, webcomponent);
    await page.goBack();
    await page.getByRole('button', { name: messages[locale]['nav.showFullUi'] }).waitFor();
    expect(await expression.inputValue()).toBe('0 0 9 * * *');
    await page.goForward();
    await page.getByRole('button', { name: messages[locale]['nav.showFormOnly'] }).waitFor();
    expect(await expression.inputValue()).toBe('0 0 9 * * *');

    const nextHash = `#/examples/spec-string-controls?form-only=false&drawer=true${hostSetting}`;
    if (family === 'skeleton') {
      await page.getByRole('option', { name: 'Spec: String controls' }).click();
    } else {
      const nextExample = page.getByRole('link', { name: 'Spec: String controls' });
      expect(await nextExample.getAttribute('href')).toBe(nextHash);
      await nextExample.click();
    }
    await page.getByRole('heading', { name: 'Spec: String controls' }).waitFor();
    expect(new URL(page.url()).hash).toBe(nextHash);
    await page.goBack();
    await page.getByRole('heading', { name: 'Spec: Cron control' }).waitFor();
    expect(new URL(page.url()).hash).toBe(
      `#/examples/spec-cron-control?form-only=false&drawer=true${hostSetting}`,
    );
    expect(await expression.inputValue()).toBe('0 0 9 * * *');
    expect(errors).toEqual([]);
  },
  { families, locales, hosts, timeout: 30_000 },
);

demoTest(
  'demo-url-direct-settings',
  async ({ page, family, locale, webcomponent, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const origin = process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`;
    await page.goto(
      `${origin}?read-only=false&drawer=true&active-tab=data&campaign=spring#/examples/spec-cron-control?read-only=true&drawer=false&active-tab=demo&use-webcomponent=${webcomponent}`,
    );
    await page.getByRole('heading', { name: 'Spec: Cron control' }).waitFor();
    await page.getByRole('button', { name: messages[locale]['nav.showExamples'] }).waitFor();
    const expression = page.locator('input[id*="/properties/stockSync"]:visible');
    await expression.waitFor();
    expect(await expression.isEditable()).toBe(false);
    expect(await page.locator(`jsonforms-svelte-${family}`).count()).toBe(webcomponent ? 1 : 0);
    await page
      .getByRole('tab', { name: messages[locale]['editor.schema.label'], exact: true })
      .click();
    await page
      .getByRole('heading', { name: messages[locale]['editor.schema.label'], exact: true })
      .waitFor();
    const url = new URL(page.url());
    expect(url.search).toBe('?read-only=false&drawer=true&campaign=spring');
    expect(url.hash).toBe(
      `#/examples/spec-cron-control?read-only=true&drawer=false&active-tab=schema&use-webcomponent=${webcomponent}`,
    );
    await page.evaluate((webcomponent) => {
      location.hash = `#/examples/spec-cron-control?read-only=false&drawer=true&active-tab=demo&use-webcomponent=${webcomponent}`;
    }, webcomponent);
    await expression.waitFor();
    await page.goBack();
    await page
      .getByRole('heading', { name: messages[locale]['editor.schema.label'], exact: true })
      .waitFor();
    await page.goForward();
    await expression.waitFor();
    expect(await expression.isEditable()).toBe(true);
    await page.getByRole('button', { name: messages[locale]['nav.hideExamples'] }).waitFor();
    await expression.fill('0 0 9 * * *');
    await page.goBack();
    await page
      .getByRole('heading', { name: messages[locale]['editor.schema.label'], exact: true })
      .waitFor();
    await page.goForward();
    await expression.waitFor();
    expect(await expression.inputValue()).toBe('0 0 9 * * *');
    expect(errors).toEqual([]);
  },
  { families, locales, hosts, timeout: 30_000 },
);
