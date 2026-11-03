import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/translations.supplement.json';

demoTest(
  'webcomponent-duration-overlays',
  async ({ page, family, locale, base }) => {
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
      `${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=true&drawer=false`,
    );
    const duration = page.getByRole('combobox', {
      name: fields[locale][
        'specTemporalControls.schema.properties.schemaBased.properties.duration.label'
      ],
      exact: true,
    });
    const control = page.locator(
      `[id=${JSON.stringify((await duration.getAttribute('id'))!.replace(/-input$/, ''))}]`,
    );
    const trigger = control.getByRole('button', {
      name: messages[locale]['duration.open'],
      exact: true,
    });
    await trigger.click();
    const minutes = page.getByRole('spinbutton', {
      name: messages[locale]['duration.minutes'],
      exact: true,
    });
    await minutes.waitFor();
    expect(await minutes.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      true,
    );
    const popup = minutes.locator(
      'xpath=ancestor::*[@role="dialog" or @role="tooltip" or @data-slot="popover-content" or (@data-scope="popover" and @data-part="content")][1]',
    );
    await popup.waitFor();
    expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      true,
    );
    expect(await popup.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
      'rgba(0, 0, 0, 0)',
    );
    const bounds = await minutes.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1440);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(1000);
    if (family === 'shadcn') {
      await page
        .getByRole('button', { name: messages[locale]['duration.addUnit'], exact: true })
        .click();
      const day = page.getByRole('option', {
        name: messages[locale]['duration.days'],
        exact: true,
      });
      await day.waitFor();
      expect(await day.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
        true,
      );
      const optionBounds = await day.boundingBox();
      expect(optionBounds).not.toBeNull();
      expect(optionBounds!.x).toBeGreaterThanOrEqual(0);
      expect(optionBounds!.x + optionBounds!.width).toBeLessThanOrEqual(1440);
      await day.click();
      await page.getByRole('spinbutton', { name: messages[locale]['duration.days'] }).waitFor();
    }
    await page.keyboard.press('Escape');
    if (family === 'flowbite')
      await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false');
    await minutes.waitFor({ state: 'hidden' });
    await expect.poll(() => trigger.evaluate((element) => element.matches(':focus'))).toBe(true);
    expect(errors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 45_000 },
);
