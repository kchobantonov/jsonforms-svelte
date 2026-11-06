import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import uiSchema from '@chobantonov/jsonforms-extended-spec/examples/draft-07-metaschema/uischema.json';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import sourceData from '@chobantonov/jsonforms-extended-spec/examples/draft-07-metaschema/data.json';

demoTest(
  'draft-07-metaschema',
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
      `${base}/${family}/#/examples/spec-draft-07-metaschema?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await expect
      .poll(
        () =>
          page
            .getByText(uiSchema.elements[0].text!, {
              exact: true,
            })
            .count(),
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0);
    const title = page.getByRole('textbox', { name: 'Title', exact: true }).first();
    await expect.poll(() => title.inputValue()).toBe('Inventory item');
    await title.fill('Inventory record');
    await expect.poll(() => title.inputValue()).toBe('Inventory record');
    const dataLabel = demoEditorLabel(locale, 'Data');
    await page.getByRole('tab', { name: dataLabel, exact: true }).click();
    const editor = page
      .getByRole('heading', { name: dataLabel, exact: true })
      .locator('..')
      .locator('..')
      .locator('.monaco-editor');
    await editor.click({ position: { x: 80, y: 20 } });
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await expect
      .poll(async () => {
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).title;
      })
      .toBe('Inventory record');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Demo'), exact: true }).click();
    const typeSelector = page.locator('[id$="-input-selector"]:visible').first();
    if (family === 'flowbite') await typeSelector.selectOption('1');
    else {
      await typeSelector.click();
      await page.getByRole('option', { name: 'boolean', exact: true }).click();
    }
    await page
      .getByRole('dialog', { name: messages[locale]['confirm.typeChange.title'] })
      .getByRole('button', { name: messages[locale]['confirm.accept'], exact: true })
      .click();
    await page.getByRole('tab', { name: dataLabel, exact: true }).click();
    await editor.click({ position: { x: 80, y: 20 } });
    await expect
      .poll(async () => {
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toBe(true);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Demo'), exact: true }).click();
    const booleanSchema = page.getByRole('checkbox');
    await expect.poll(() => booleanSchema.count()).toBe(1);
    await booleanSchema.uncheck();
    await page.getByRole('tab', { name: dataLabel, exact: true }).click();
    await editor.click({ position: { x: 80, y: 20 } });
    await expect
      .poll(async () => {
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toBe(false);
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);

demoTest(
  'draft-07-nested-property-schema',
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
      `${base}/${family}/#/examples/spec-draft-07-metaschema?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const dataLabel = demoEditorLabel(locale, 'Data');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const readProperties = async (): Promise<Record<string, unknown>> => {
      await page.getByRole('tab', { name: dataLabel, exact: true }).click();
      const editor = page
        .getByRole('heading', { name: dataLabel, exact: true })
        .locator('..')
        .locator('..')
        .locator('.monaco-editor');
      await editor.click({ position: { x: 80, y: 20 } });
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      return JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).properties;
    };
    let initialProperties: Record<string, unknown> = {};
    await expect
      .poll(
        async () => {
          initialProperties = await readProperties();
          return initialProperties.reference;
        },
        { timeout: 15_000 },
      )
      .toMatchObject(sourceData.properties.reference);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Demo'), exact: true }).click();
    const properties = page
      .locator('[data-additional-properties]:visible')
      .filter({
        has: page.getByRole('button', {
          name: messages[locale]['additionalProperties.renameNamed'].replace('{name}', 'reference'),
        }),
      })
      .first();
    const name = properties.getByRole('textbox', {
      name: messages[locale]['additionalProperties.propertyNameLabel'],
      exact: true,
    });
    await name.first().fill('status');
    await properties
      .getByRole('button', {
        name: new RegExp('^' + messages[locale]['additionalProperties.addTo'].split('{label}')[0]),
      })
      .first()
      .click();
    const status = properties.getByRole('checkbox', { name: 'status', exact: true });
    await expect.poll(() => status.count()).toBe(1);
    await status.click();
    await expect.poll(readProperties, { timeout: 15_000 }).toEqual({
      ...initialProperties,
      status: false,
    });
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);
