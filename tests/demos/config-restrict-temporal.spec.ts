import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/data.json';

demoTest('config-restrict-temporal', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const configLabel = demoEditorLabel(locale, 'Config');
  await page.getByRole('tab', { name: configLabel, exact: true }).click();
  const toolbar = page.getByRole('heading', { name: configLabel, exact: true }).locator('..');
  const editor = toolbar.locator('..').locator('.inputarea, .native-edit-context');
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await editor.evaluate((element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', JSON.stringify({ restrict: false }));
    element.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
    );
  });
  await toolbar.getByRole('button').nth(1).click();
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await page
    .getByRole('tab', {
      name: fields[locale]['specTemporalControls.ui.elements.1.elements.2.label'],
      exact: true,
    })
    .click();

  const control = page.locator('[id="#/properties/bounded/properties/bookingDate"]');
  await control
    .getByRole('button', {
      name: messages[locale][family === 'flowbite' ? 'temporal.openDate' : 'temporal.chooseDate'],
      exact: true,
    })
    .click();
  const calendar = page.getByRole(family === 'flowbite' ? 'dialog' : 'application', {
    name: new RegExp(messages[locale]['calendar.name']),
  });
  await calendar.getByRole('button', { name: messages[locale]['calendar.nextMonth'] }).click();
  if (family === 'flowbite') {
    const label = await calendar
      .locator('[role="gridcell"][aria-label]')
      .evaluateAll((nodes) =>
        nodes.find((node) => node.textContent?.trim() === '1')?.getAttribute('aria-label'),
      );
    expect(label).toBeTruthy();
    await calendar.getByRole('gridcell', { name: label!, exact: true }).click();
  } else {
    await calendar.locator('[aria-label]').filter({ hasText: /^1$/ }).first().click();
  }

  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const expected = structuredClone(original) as typeof original;
  expected.bounded.bookingDate = '2026-11-01';
  await expect
    .poll(async () => {
      await page
        .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
        .focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    })
    .toEqual(expected);
  expect(errors).toEqual([]);
});

demoTest(
  'local-restrict-temporal',
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
      `${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', {
        name: fields[locale]['specTemporalControls.ui.elements.1.elements.2.label'],
        exact: true,
      })
      .click();

    const control = page.locator('[id="#/properties/bounded/properties/unrestricted"]');
    await control
      .getByRole('button', {
        name: messages[locale][family === 'flowbite' ? 'temporal.openDate' : 'temporal.chooseDate'],
        exact: true,
      })
      .click();
    const calendar = page.getByRole(family === 'flowbite' ? 'dialog' : 'application', {
      name: new RegExp(messages[locale]['calendar.name']),
    });
    if (family === 'shadcn') {
      await calendar.locator('[data-calendar-day][data-value="2026-12-25"]').click();
    } else {
      await calendar.getByText('25', { exact: true }).first().click();
    }
    await expect.poll(() => control.getByText('must be <= 2026-10-31').isVisible()).toBe(true);

    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const expected = structuredClone(original) as typeof original;
    expected.bounded.unrestricted = '2026-12-25';
    await expect
      .poll(async () => {
        await page
          .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
          .focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual(expected);
    expect(errors).toEqual([]);
  },
  { locales: ['en'] },
);
