import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'temporal-seconds-views',
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
    const url = `${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=${webcomponent}&drawer=false`;
    await page.goto(url);
    await page
      .getByRole('tab', {
        name: fields[locale]['specTemporalControls.ui.elements.1.elements.1.label'],
        exact: true,
      })
      .click();
    const triggerName =
      messages[locale][family === 'flowbite' ? 'temporal.openTime' : 'temporal.chooseTime'];
    const seconds = page.getByRole('spinbutton', {
      name: messages[locale]['temporal.seconds'],
      exact: true,
    });
    const withSeconds = page.locator('[id="#/properties/uiSchemaBased/properties/timeSeconds"]');
    await withSeconds.getByRole('button', { name: triggerName, exact: true }).click();
    await expect.poll(() => seconds.isVisible()).toBe(true);
    await page.goto(url);
    await page
      .getByRole('tab', {
        name: fields[locale]['specTemporalControls.ui.elements.1.elements.1.label'],
        exact: true,
      })
      .click();
    const coarse = page.locator('[id="#/properties/uiSchemaBased/properties/coarseTime"]');
    await coarse.getByRole('button', { name: triggerName, exact: true }).click();
    await expect
      .poll(() =>
        page
          .getByRole('spinbutton', { name: messages[locale]['temporal.hours'], exact: true })
          .isVisible(),
      )
      .toBe(true);
    await expect.poll(() => seconds.count()).toBe(0);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
