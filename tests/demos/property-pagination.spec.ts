import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import propertyUiSchema from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-property-pagination/uischema.json';

demoTest(
  'property-pagination-commands',
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
      `${base}/${family}/#/examples/spec-property-pagination?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const card = page.locator('[data-additional-properties]:visible');
    await expect.poll(() => card.locator('[data-collection-footer]').count()).toBe(1);
    await page
      .getByRole('button', { name: messages[locale]['collection.next'], exact: true })
      .click();
    const original = card.getByRole('textbox', { name: 'guest-06', exact: true });
    await expect.poll(() => original.inputValue()).toBe('REF-105');
    const renameLabel = messages[locale]['additionalProperties.renameNamed'].replace(
      '{name}',
      'guest-06',
    );
    const row = original.locator(`xpath=ancestor::div[.//button[@aria-label="${renameLabel}"]][1]`);
    await row.getByRole('button', { name: renameLabel }).click();
    const dialog = page.getByRole('dialog');
    const draft = dialog.getByRole('textbox', {
      name: messages[locale]['additionalProperties.renamePropertyNameLabel'],
    });
    const accept = dialog.getByRole('button', {
      name: messages[locale]['additionalProperties.renameDialogAccept'],
    });
    await draft.fill('guest-01');
    await expect.poll(() => draft.getAttribute('aria-invalid')).toBe('true');
    await expect.poll(() => accept.isDisabled()).toBe(true);
    await draft.fill('guest-16');
    await expect.poll(() => accept.isEnabled()).toBe(true);
    await accept.click();
    await dialog.waitFor({ state: 'hidden' });
    await expect
      .poll(() => card.getByRole('textbox', { name: 'guest-16' }).inputValue())
      .toBe('REF-105');

    const propertyName = card.getByRole('textbox', {
      name: messages[locale]['additionalProperties.propertyNameLabel'],
      exact: true,
    });
    await propertyName.fill('guest-13');
    await propertyName.blur();
    const add = card.getByRole('button', {
      name: new RegExp('^' + messages[locale]['additionalProperties.addTo'].split('{label}')[0]),
    });
    await expect.poll(() => add.isEnabled()).toBe(true);
    await add.click();
    const added = card.getByRole('textbox', { name: 'guest-13', exact: true });
    await added.waitFor();
    await added.fill('REF-112');
    const removeLabel = messages[locale]['additionalProperties.deleteNamed'].replace(
      '{name}',
      'guest-13',
    );
    const addedRow = added.locator(
      `xpath=ancestor::div[.//button[@aria-label="${removeLabel}"]][1]`,
    );
    await addedRow.getByRole('button', { name: removeLabel }).click();
    await expect.poll(() => added.count()).toBe(0);

    let data: { bookingReference: string; references: Record<string, string> };
    if (webcomponent) {
      data = await page.locator(`jsonforms-svelte-${family}`).evaluate((element) => {
        const value = (element as HTMLElement & { data: string | typeof data }).data;
        return typeof value === 'string' ? JSON.parse(value) : value;
      });
    } else {
      const dataLabel = demoEditorLabel(locale, 'Data');
      await page.getByRole('tab', { name: dataLabel, exact: true }).click();
      const toolbar = page.getByRole('heading', { name: dataLabel, exact: true }).locator('..');
      await toolbar
        .locator('..')
        .locator('.monaco-editor')
        .click({ position: { x: 80, y: 20 } });
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      data = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    }
    assert.equal(data.bookingReference, 'CONF-2026-104');
    assert.equal(data.references['guest-01'], 'REF-100');
    assert.equal(data.references['guest-16'], 'REF-105');
    assert.equal(Object.hasOwn(data.references, 'guest-06'), false);
    assert.equal(Object.hasOwn(data.references, 'guest-13'), false);
    assert.equal(Object.keys(data.references).length, 12);
    assert.deepEqual(errors, []);
  },
  { timeout: 20_000 },
);

demoTest(
  'property-pagination-precedence',
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
      `${base}/${family}/#/examples/spec-property-pagination?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const card = page.locator('[data-additional-properties]:visible');
    const count = async () => (await card.getByRole('textbox').count()) - 1;
    await expect.poll(count).toBe(5);

    const uiTen = structuredClone(propertyUiSchema);
    if (!uiTen.elements[1].options) throw new Error('Missing property pagination options');
    Object.assign(uiTen.elements[1].options.additionalProperties.pagination, { pageSize: 10 });
    const showDemo = () =>
      page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
    await applyDemoEditor(page, locale, 'UI Schema', uiTen, { verifyVisibleText: false });
    await showDemo();
    await expect.poll(count).toBe(10);

    const configOff = { jsonformsExtended: { additionalProperties: { pagination: false } } };
    await applyDemoEditor(page, locale, 'Config', configOff);
    await showDemo();
    await expect.poll(count).toBe(10);

    const uiInherited = structuredClone(propertyUiSchema);
    if (!uiInherited.elements[1].options) throw new Error('Missing property pagination options');
    Reflect.deleteProperty(uiInherited.elements[1].options.additionalProperties, 'pagination');
    await applyDemoEditor(page, locale, 'UI Schema', uiInherited, {
      verifyVisibleText: false,
    });
    await showDemo();
    await expect.poll(count).toBe(12);
    await expect.poll(() => card.locator('[data-collection-footer]').count()).toBe(0);

    await applyDemoEditor(page, locale, 'Config', {});
    await showDemo();
    await expect.poll(count).toBe(5);
    await expect.poll(() => card.locator('[data-collection-footer]').count()).toBe(1);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
