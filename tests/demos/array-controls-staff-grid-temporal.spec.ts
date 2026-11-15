import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '@chobantonov/jsonforms-extended-spec/examples/array-controls/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'array-controls-staff-grid-temporal',
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
    const grid = page
      .getByRole('tabpanel', { name: tabLabel, exact: true })
      .locator('.ag-root-wrapper');
    const cell = (field: string) =>
      grid.locator(`.ag-row[row-index="0"] .ag-cell[col-id="${field}"]`);
    const selectNextDay = async (field: 'date' | 'dateTime') => {
      const triggerKey =
        field === 'date'
          ? family === 'flowbite'
            ? 'temporal.openDate'
            : 'temporal.chooseDate'
          : family === 'flowbite'
            ? 'temporal.openDateTime'
            : 'temporal.chooseDateTime';
      await cell(field)
        .getByRole('button', { name: messages[locale][triggerKey], exact: true })
        .click();
      const calendar = page.getByRole(family === 'flowbite' ? 'dialog' : 'application', {
        name: new RegExp(messages[locale]['calendar.name']),
      });
      await expect.poll(() => calendar.isVisible()).toBe(true);
      if (webcomponent) {
        expect(
          await calendar.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
        ).toBe(true);
      }
      if (family === 'flowbite') {
        const label = await calendar
          .locator('[role="gridcell"][aria-label]')
          .evaluateAll((nodes) =>
            nodes.find((node) => node.textContent?.trim() === '15')?.getAttribute('aria-label'),
          );
        expect(label).toBeTruthy();
        await calendar.getByRole('gridcell', { name: label!, exact: true }).click();
      } else if (family === 'skeleton') {
        await calendar
          .getByRole('gridcell')
          .filter({ hasText: /^15$/ })
          .first()
          .getByRole('button')
          .click();
      } else {
        await calendar.locator('[data-calendar-day][data-value="2026-10-15"]').click();
      }
      const apply = page.getByRole('button', {
        name: messages[locale]['temporal.ok'],
        exact: true,
      });
      if (await apply.isVisible()) await apply.click();
    };

    await selectNextDay('date');
    await cell('time')
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
    const nextHour = (Number(await hour.inputValue()) + 1) % 24;
    await hour.fill(String(nextHour));
    await expect.poll(async () => Number(await hour.inputValue())).toBe(nextHour);
    await page.keyboard.press('Escape');
    await selectNextDay('dateTime');

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
        return {
          date: data.staff[0].date,
          time: new Date(`2020-01-01T${data.staff[0].time}`).toISOString(),
          dateTime: new Date(data.staff[0].dateTime).toISOString(),
        };
      })
      .toEqual({
        date: '2026-10-15',
        time: '2020-01-01T10:30:00.000Z',
        dateTime: '2026-10-15T09:00:00.000Z',
      });
    expect(pageErrors).toEqual([]);
  },
  { timeout: 25_000 },
);
