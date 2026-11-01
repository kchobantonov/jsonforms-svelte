import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'array-controls-staff-date-picker',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
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
    const trigger = row.getByRole('button', {
      name: messages[locale][family === 'flowbite' ? 'temporal.openDate' : 'temporal.chooseDate'],
      exact: true,
    });
    await trigger.click();
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
      const apply = page.getByRole('button', {
        name: messages[locale]['temporal.ok'],
        exact: true,
      });
      if (await apply.isVisible()) await apply.click();
    }

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
        return data.staff;
      })
      .toEqual([{ ...original.staff[0], date: '2026-10-15' }, original.staff[1]]);
    expect(pageErrors).toEqual([]);
  },
  { timeout: 20_000 },
);
