import assert from 'node:assert/strict';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-combinators/supplemental-translations.json';
import { expect } from 'vite-plus/test';

demoTest(
  'combinators',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const catalog = translations[locale];
    await page.goto(
      `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-combinators?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const email = page.locator('input[id*="/properties/email-input"]');
    await email.waitFor();
    assert.equal(await email.inputValue(), 'alex.moreau@example.com');
    await page.getByRole('tab', { name: 'anyOf', exact: true }).click();
    const room = page.locator('input[id*="/properties/room-input"]');
    await room.waitFor();
    assert.equal(await room.inputValue(), 'Willow Room');
    await page.getByRole('tab', { name: catalog.Online, exact: true }).click();
    await page.locator('input[id*="/properties/joinUrl-input"]').waitFor();
    await page.getByRole('tab', { name: catalog['On site'], exact: true }).click();
    assert.equal(await room.inputValue(), 'Willow Room');
    await page.getByRole('tab', { name: 'allOf', exact: true }).click();
    assert.equal(
      await page.locator('input[id*="/properties/assetTag-input"]').inputValue(),
      'AB1234',
    );
    await page
      .getByRole('tab', {
        name: catalog['specCombinators.ui/elements/1/elements/3.label'],
        exact: true,
      })
      .click();
    assert.equal(
      await page
        .getByLabel(catalog['specCombinators.schema/properties/attendees.label'], { exact: true })
        .inputValue(),
      '8',
    );
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const editor = page.locator(
      '.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context',
    );
    await editor.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('ControlOrMeta+C');
    const data = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    assert.deepEqual(data.location, { room: 'Willow Room' });
    assert.deepEqual(errors, []);
  },
  { timeout: 30_000 },
);

demoTest(
  'combinators schema condition and discriminator',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const labels = translations[locale];
    await page.goto(
      `${base}/${family}/#/examples/spec-combinators?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', {
        name: labels['specCombinators.ui/elements/1/elements/4.label'],
        exact: true,
      })
      .click();
    const neededBy = page.locator('input[id^="#/properties/neededBy"][id$="-input"]:visible');
    await expect.poll(() => neededBy.count()).toBe(1);
    expect(await neededBy.first().getAttribute('required')).toBeNull();
    await page
      .getByRole('checkbox', { name: labels['specCombinators.schema/properties/urgent.label'] })
      .check();
    await expect.poll(() => neededBy.count()).toBe(2);
    await expect.poll(() => page.getByTestId('form-validation-errors').count()).toBe(1);
    expect(await neededBy.first().getAttribute('required')).toBeNull();
    await page
      .getByRole('checkbox', { name: labels['specCombinators.schema/properties/urgent.label'] })
      .uncheck();
    await expect.poll(() => neededBy.count()).toBe(1);
    await expect.poll(() => page.getByTestId('form-validation-errors').count()).toBe(0);

    await page
      .getByRole('tab', {
        name: labels['specCombinators.ui/elements/1/elements/5.label'],
        exact: true,
      })
      .click();
    const collectionPoint = page.locator('input[id*="/properties/collectionPoint-input"]:visible');
    const postcode = page.locator('input[id*="/properties/postcode-input"]:visible');
    const address = page.locator('input[id*="/properties/addressLine-input"]:visible');
    await expect.poll(() => collectionPoint.count()).toBe(1);
    const chooseMethod = async (option: 'post' | 'none') => {
      if (family === 'flowbite') {
        await page.locator('select[id*="/properties/method"]:visible').selectOption(option);
      } else {
        const trigger =
          family === 'shadcn'
            ? page.locator('button[id*="/properties/method"][aria-haspopup="listbox"]:visible')
            : page
                .locator('input[id*="/properties/method"]:visible')
                .locator('..')
                .locator('button[aria-haspopup="listbox"]');
        await trigger.click();
        await page.getByRole('option', { name: option, exact: true }).click();
      }
    };
    await chooseMethod('post');
    await expect.poll(() => collectionPoint.count()).toBe(0);
    await expect.poll(() => postcode.count()).toBe(1);
    await expect.poll(() => address.count()).toBe(1);
    await chooseMethod('none');
    await expect.poll(() => postcode.count()).toBe(0);
    await expect.poll(() => address.count()).toBe(0);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const lines = page.locator('.monaco-editor:visible .view-lines');
    await lines.waitFor();
    const data = JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' '));
    expect(data.appointment).toEqual({ method: 'none', collectionPoint: 'Main reception' });
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
