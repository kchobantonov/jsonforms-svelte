import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'array-controls-staff-time-picker',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const tabLabel = translations[locale]['cellsTab.label'];
    await page.getByRole('tab', { name: tabLabel, exact: true }).click();
    const row = page
      .getByRole('tabpanel', { name: tabLabel, exact: true })
      .locator('tbody tr')
      .first();
    await row
      .getByRole('button', {
        name: messages[locale][family === 'flowbite' ? 'temporal.openTime' : 'temporal.chooseTime'],
        exact: true,
      })
      .click();
    const hour = page.getByRole('spinbutton', {
      name: messages[locale]['temporal.hours'],
      exact: true,
    });
    await expect.poll(() => hour.isVisible()).toBe(true);
    if (webcomponent) {
      expect(await hour.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
        true,
      );
    }
    const initialHour = Number(await hour.inputValue());
    const nextHour = (initialHour + 1) % 24;
    await hour.fill(String(nextHour));
    await expect.poll(async () => Number(await hour.inputValue())).toBe(nextHour);

    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await expect
      .poll(async () => {
        await page
          .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
          .focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        const data = JSON.parse(
          await page.evaluate(() => navigator.clipboard.readText()),
        ) as typeof original;
        expect(data.staff[1]).toEqual(original.staff[1]);
        return new Date(`2020-01-01T${data.staff[0].time}`).toISOString();
      })
      .toBe('2020-01-01T10:30:00.000Z');
    expect(pageErrors).toEqual([]);
  },
  { timeout: 20_000 },
);
