import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'dynamic advanced catalog text follows locale changes',
  async ({ page, base }) => {
    await page.goto(`${base}/flowbite/#/examples/spec-dynamic-playground?drawer=false`);
    await expect.poll(() => page.getByText('No core errors', { exact: true }).count()).toBe(1);
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('A');
    await expect.poll(() => page.getByText('Core errors present', { exact: true }).count()).toBe(1);
    await page.getByRole('button', { name: 'Open settings' }).click();
    await page.locator('#locale').selectOption('bg');
    await page.getByRole('button', { name: 'Затваряне на настройките' }).last().click();
    await expect
      .poll(() => page.getByText('Има грешки в схемата', { exact: true }).count())
      .toBe(1);
    await expect.poll(() => page.getByText('Configuration', { exact: true }).count()).toBe(0);
    await expect
      .poll(() => page.getByRole('textbox', { name: 'Име', exact: true }).count())
      .toBe(1);
    await expect
      .poll(() => page.getByRole('checkbox', { name: 'Използвай плъзгач' }).count())
      .toBe(1);
  },
  { families: ['flowbite'], locales: ['en'], hosts: ['native'], timeout: 30_000 },
);

demoTest(
  'dynamic advanced renderer and structural overlays',
  async ({ page, family, webcomponent, base }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-dynamic-playground?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const settings = page.getByTestId('dynamic-playground-configuration');
    await expect.poll(() => settings.isVisible()).toBe(true);
    const sliderSetting = settings.getByRole('checkbox', { name: 'Use slider editor' });
    await expect.poll(() => sliderSetting.isVisible()).toBe(true);
    await expect
      .poll(() => page.getByText('Member name', { exact: true }).count())
      .toBeGreaterThan(0);
    if (family === 'flowbite') await page.getByText('Grace', { exact: true }).click();
    await expect
      .poll(() => page.getByText('Member name', { exact: true }).count())
      .toBeGreaterThan(0);
    await expect.poll(() => page.getByRole('spinbutton', { name: 'Amount' }).count()).toBe(1);
    await sliderSetting.click();
    await expect.poll(() => page.getByRole('slider').count()).toBe(1);
    await expect.poll(() => page.getByRole('spinbutton', { name: 'Amount' }).count()).toBe(0);
    await sliderSetting.click();
    await expect.poll(() => page.getByRole('spinbutton', { name: 'Amount' }).count()).toBe(1);

    await settings.getByRole('checkbox', { name: 'Show extra field' }).click();
    await expect.poll(() => page.getByText('Extra field is available').count()).toBe(1);
    await expect.poll(() => page.getByText('Extra name').count()).toBe(1);
    await settings.getByRole('checkbox', { name: 'Show extra field' }).click();
    await expect.poll(() => page.getByText('Extra field is available').count()).toBe(0);
    expect(pageErrors).toEqual([]);
  },
  { locales: ['en'], timeout: 45_000 },
);

demoTest(
  'dynamic advanced scope and fallback',
  async ({ page, family, webcomponent, base }) => {
    await page.goto(
      `${base}/${family}/#/examples/spec-dynamic-playground?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const settings = page.getByTestId('dynamic-playground-configuration');
    await expect.poll(() => settings.isVisible()).toBe(true);
    await settings.getByRole('textbox', { name: 'Amount label' }).fill('Budget');
    await expect.poll(() => page.getByRole('spinbutton', { name: 'Budget' }).count()).toBe(1);
    await settings.getByRole('checkbox', { name: 'Try invalid label binding' }).click();
    await expect.poll(() => page.getByRole('spinbutton', { name: 'Budget' }).count()).toBe(1);

    const alternate = settings.getByRole('checkbox', { name: 'Edit alternate name' });
    const nameEditor = page.getByRole('textbox', { name: 'Edit name' });
    await expect.poll(() => nameEditor.inputValue()).toBe('Ada');
    await alternate.click();
    await expect
      .poll(() => page.getByRole('textbox', { name: 'Edit alternate name' }).inputValue())
      .toBe('Grace');
    await alternate.click();
    await expect.poll(() => nameEditor.inputValue()).toBe('Ada');
  },
  { locales: ['en'], timeout: 45_000 },
);

demoTest(
  'dynamic advanced discards a numeric draft on editor replacement',
  async ({ page, family, base }) => {
    await page.goto(`${base}/${family}/#/examples/spec-dynamic-playground?drawer=false`);
    const settings = page.getByTestId('dynamic-playground-configuration');
    const number = page.getByRole('spinbutton', { name: 'Amount' });
    await expect.poll(() => number.inputValue()).toBe('25');
    await number.focus();
    await number.press('ControlOrMeta+A');
    await number.pressSequentially('1e');
    await expect
      .poll(() => number.evaluate((element) => (element as HTMLInputElement).validity.badInput))
      .toBe(true);
    await settings
      .getByRole('checkbox', { name: 'Use slider editor' })
      .evaluate((element) => (element as HTMLElement).click());
    await expect.poll(() => page.getByRole('slider').count()).toBe(1);
    await expect
      .poll(() =>
        page.getByRole('slider').evaluate((element) => document.activeElement === element),
      )
      .toBe(true);
    await settings.getByRole('checkbox', { name: 'Use slider editor' }).click();
    await expect
      .poll(() => page.getByRole('spinbutton', { name: 'Amount' }).inputValue())
      .toBe('1');
  },
  { locales: ['en'], hosts: ['native'], timeout: 30_000 },
);

demoTest(
  'dynamic advanced type and rule overlays',
  async ({ page, family, base }) => {
    await page.goto(`${base}/${family}/#/examples/spec-dynamic-playground?drawer=false`);
    const settings = page.getByTestId('dynamic-playground-configuration');
    const group = page.getByText('Extra fields', { exact: true });
    await expect.poll(() => group.count()).toBe(1);
    await settings.getByRole('checkbox', { name: 'Use flat extra layout' }).click();
    await expect.poll(() => group.count()).toBe(0);
    await settings.getByRole('checkbox', { name: 'Use flat extra layout' }).click();
    await expect.poll(() => group.count()).toBe(1);

    const name = page.getByRole('textbox', { name: 'Name', exact: true });
    await expect.poll(() => name.count()).toBe(1);
    await expect
      .poll(() => page.getByText('Configuration', { exact: true }).count())
      .toBeGreaterThan(0);
    await name.fill('');
    await expect.poll(() => page.getByText('Core errors present', { exact: true }).count()).toBe(1);
    await page.getByRole('textbox', { name: 'Name (empty)', exact: true }).fill('Ada');
    await expect.poll(() => page.getByText('No core errors', { exact: true }).count()).toBe(1);
    await settings.getByRole('checkbox', { name: 'Hide name when mode is hide' }).click();
    await page.getByRole('combobox', { name: 'Mode' }).selectOption('hide');
    await expect.poll(() => name.count()).toBe(0);
    await settings.getByRole('checkbox', { name: 'Hide name when mode is hide' }).click();
    await expect.poll(() => name.count()).toBe(1);
  },
  { families: ['flowbite'], locales: ['en'], hosts: ['native'], timeout: 30_000 },
);

demoTest(
  'dynamic detail patch versus complete descriptor value',
  async ({ page, family, base }) => {
    await page.goto(`${base}/${family}/#/examples/spec-dynamic-playground?drawer=false`);
    const settings = page.getByTestId('dynamic-playground-configuration');
    const heading = page.getByText('Member detail', { exact: true });
    const toggle = settings.getByRole('checkbox', { name: 'Replace whole member detail' });
    await expect.poll(() => heading.count()).toBeGreaterThan(0);
    const name = page.getByRole('textbox', { name: 'Member name', exact: true }).first();
    await name.fill('Grace');
    await toggle.click();
    await expect.poll(() => heading.count()).toBe(0);
    await expect.poll(() => name.inputValue()).toBe('Grace');
    await toggle.click();
    await expect.poll(() => heading.count()).toBeGreaterThan(0);
    await expect.poll(() => name.inputValue()).toBe('Grace');
  },
  { locales: ['en'], hosts: ['native'], timeout: 30_000 },
);
