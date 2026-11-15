import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';

const devFamily = process.env.JSONFORMS_DEMO_FAMILY;
const families =
  devFamily === 'flowbite' || devFamily === 'shadcn' || devFamily === 'skeleton'
    ? ([devFamily] as const)
    : undefined;
const devLocale = process.env.JSONFORMS_DEMO_LOCALE;
const locales = devLocale === 'en' || devLocale === 'bg' ? ([devLocale] as const) : undefined;

demoTest(
  'demo-host-transitions',
  async ({ page, family, locale, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(
      ({ family, locale }) => {
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        );
        localStorage.setItem(
          `${family}-example-mode`,
          JSON.stringify({ version: 1, value: 'dark' }),
        );
        if (family === 'shadcn')
          localStorage.setItem(
            'shadcn-example-theme',
            JSON.stringify({ version: 1, value: 'zinc' }),
          );
        if (family === 'skeleton')
          localStorage.setItem(
            'skeleton-example-theme',
            JSON.stringify({ version: 1, value: 'rose' }),
          );
        if (family === 'flowbite')
          localStorage.setItem(
            'flowbite-example-theme-color',
            JSON.stringify({ version: 1, value: 'ocean' }),
          );
      },
      { family, locale },
    );
    const origin = process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`;
    await page.goto(`${origin}#/examples/spec-cron-control?read-only=false&drawer=true`);
    await page.getByRole('heading', { name: 'Spec: Cron control' }).waitFor();
    const field = page.locator('input[id*="/properties/stockSync"]:visible');
    await field.fill('0 0 9 * * *');

    const switchToWebComponent = messages[locale]['nav.svelte'];
    const switchToNative = messages[locale]['nav.webComponent'];
    await page.getByRole('button', { name: switchToWebComponent }).click();
    const host = page.locator(`jsonforms-svelte-${family}`);
    await host.waitFor();
    const props = await host.evaluate((element) => {
      const component = element as HTMLElement & {
        locale?: string;
        readonly?: boolean;
        config?: string;
        theme?: string;
        mode?: string;
        customStyle?: string;
      };
      return {
        locale: component.locale,
        readonly: component.readonly,
        config: component.config,
        theme: component.theme,
        mode: component.mode,
        customStyle: component.customStyle,
      };
    });
    expect(props.locale).toBe(locale);
    expect(props.readonly).toBe(false);
    expect(JSON.parse(props.config ?? '{}')).toMatchObject({});
    expect(props.mode).toBe('dark');
    if (family === 'shadcn') expect(props.theme).toBe('zinc');
    if (family === 'skeleton') expect(props.theme).toBe('rose');
    if (family === 'flowbite') expect(props.customStyle).toContain('#');
    expect(await field.inputValue()).toBe('0 0 9 * * *');

    const logo = page.locator('nav #webcomponent-logo');
    expect(await logo.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
    await page.getByRole('button', { name: messages[locale]['nav.showFormOnly'] }).click();
    await page.getByRole('button', { name: messages[locale]['nav.showFullUi'] }).waitFor();
    await host.waitFor();
    expect(await page.getByRole('heading', { name: 'Spec: Cron control' }).count()).toBe(0);
    expect(await page.getByText(messages[locale]['sidebar.source'], { exact: true }).count()).toBe(
      0,
    );
    const demoSchemaTabs = await page
      .getByRole('tab', { name: messages[locale]['editor.schema.label'] })
      .evaluateAll((elements) =>
        elements
          .filter((element) => element.getRootNode() === document)
          .map((element) => element.textContent),
      );
    expect(demoSchemaTabs).toEqual([]);
    expect(
      await page.getByRole('button', { name: messages[locale]['nav.openSettings'] }).count(),
    ).toBe(0);
    expect(await host.count()).toBe(1);
    expect(await field.inputValue()).toBe('0 0 9 * * *');
    await page.getByRole('button', { name: messages[locale]['nav.showFullUi'] }).click();
    await page.getByRole('button', { name: switchToNative }).click();
    expect(await host.count()).toBe(0);
    expect(await field.inputValue()).toBe('0 0 9 * * *');
    expect(errors).toEqual([]);
  },
  { families, locales, hosts: ['native'], timeout: 30_000 },
);

demoTest(
  'demo-live-settings-transition',
  async ({ page, family, locale, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    const origin = process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`;
    await page.goto(`${origin}#/examples/spec-cron-control?drawer=true`);
    await page.getByRole('heading', { name: 'Spec: Cron control' }).waitFor();
    const field = page.locator('input[id*="/properties/stockSync"]:visible');
    await field.fill('0 0 8 * * *');

    await page.getByRole('button', { name: messages[locale]['nav.openSettings'] }).click();
    await page.getByText('RTL', { exact: true }).click();
    const pageDirection =
      family === 'flowbite'
        ? await field.evaluate((element) => element.closest('[dir]')?.getAttribute('dir'))
        : await page.locator('html').getAttribute('dir');
    expect(pageDirection).toBe('rtl');
    if (family === 'shadcn') {
      await page.getByText(messages[locale]['settings.light'], { exact: true }).click();
    } else {
      await page
        .getByRole('button', { name: messages[locale]['settings.light'], exact: true })
        .click();
    }
    if (family === 'shadcn') {
      await page.locator('#validation-mode').click();
      await page.getByRole('option', { name: messages[locale]['settings.noValidation'] }).click();
      await page.getByRole('checkbox', { name: messages[locale]['settings.restrict'] }).click();
      await page.getByRole('checkbox', { name: messages[locale]['settings.readonly'] }).click();
    } else {
      await page.locator('#validation-mode').selectOption('NoValidation');
      if (family === 'skeleton') {
        const restrict = page.getByRole('checkbox', {
          name: messages[locale]['settings.restrict'],
        });
        await restrict.uncheck();
        expect(await restrict.isChecked()).toBe(false);
        await page.getByRole('checkbox', { name: messages[locale]['settings.readonly'] }).check();
      } else {
        await page.getByText(messages[locale]['settings.restrict'], { exact: true }).click();
        await page.getByText(messages[locale]['settings.readonly'], { exact: true }).click();
      }
    }
    await page.getByRole('button', { name: messages[locale]['nav.closeSettings'] }).last().click();
    await page.getByRole('button', { name: messages[locale]['nav.svelte'] }).click();
    const host = page.locator(`jsonforms-svelte-${family}`);
    await host.waitFor();
    const state = await host.evaluate((element) => {
      const component = element as HTMLElement & {
        config?: string;
        validationMode?: string;
        mode?: string;
        readonly?: boolean;
      };
      return {
        config: component.config,
        validationMode: component.validationMode,
        mode: component.mode,
        readonly: component.readonly,
        direction: getComputedStyle(element).direction,
      };
    });
    expect(JSON.parse(state.config ?? '{}').restrict).toBe(false);
    expect(state.validationMode).toBe('NoValidation');
    expect(state.mode).toBe('light');
    expect(state.readonly).toBe(true);
    expect(state.direction).toBe('rtl');
    expect(await field.inputValue()).toBe('0 0 8 * * *');
    expect(await field.isEditable()).toBe(false);
    await page.getByRole('button', { name: messages[locale]['nav.showFormOnly'] }).click();
    await host.waitFor();
    const formOnlyState = await host.evaluate((element) => {
      const component = element as HTMLElement & {
        config?: string;
        validationMode?: string;
        mode?: string;
        readonly?: boolean;
      };
      return {
        config: component.config,
        validationMode: component.validationMode,
        mode: component.mode,
        readonly: component.readonly,
        direction: getComputedStyle(element).direction,
      };
    });
    expect(formOnlyState).toEqual(state);
    expect(await field.inputValue()).toBe('0 0 8 * * *');
    expect(await field.isEditable()).toBe(false);
    await page.getByRole('button', { name: messages[locale]['nav.showFullUi'] }).click();
    await page.getByRole('button', { name: messages[locale]['nav.webComponent'] }).click();
    expect(await host.count()).toBe(0);
    expect(await field.inputValue()).toBe('0 0 8 * * *');
    expect(await field.isEditable()).toBe(false);
    expect(errors).toEqual([]);
  },
  { families, locales, hosts: ['native'], timeout: 30_000 },
);
