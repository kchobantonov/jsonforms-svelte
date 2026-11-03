import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import mixedTranslations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/translations.json';

const longOption = 'A descriptive option that remains readable at narrow width '.repeat(3);

demoTest(
  'long choice option remains contained and readable',
  async ({ page, base, family, locale, webcomponent }) => {
    await page.setViewportSize({ width: 320, height: 600 });
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
      `${base}/${family}/#/examples/spec-json-inference?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(page, locale, 'Schema', {
      type: 'object',
      properties: { choice: { type: 'string', enum: [longOption, 'Short option'] } },
    });
    await applyDemoEditor(page, locale, 'Data', {});
    for (const autocomplete of [false, true]) {
      await applyDemoEditor(page, locale, 'UI Schema', {
        type: 'Control',
        scope: '#/properties/choice',
        label: 'Choice',
        options: { autocomplete },
      });
      await page
        .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
        .click();
      const control = page.locator('[id$="/properties/choice-input"]:visible');
      if (family === 'skeleton' && !autocomplete) {
        const bounds = await control.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.x).toBeGreaterThanOrEqual(-1);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(321);
        expect(
          (await control.locator('option').allTextContents()).map((text) => text.trim()),
        ).toContain(longOption.trim());
        expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(320);
        continue;
      }
      await control.click();
      const option = page.getByRole('option', { name: longOption.trim(), exact: true });
      await expect.poll(() => option.isVisible()).toBe(true);
      const popup = option.locator('xpath=ancestor::*[@role="listbox"][1]');
      const [optionBox, popupBox] = await Promise.all([option.boundingBox(), popup.boundingBox()]);
      expect(optionBox).not.toBeNull();
      expect(popupBox).not.toBeNull();
      expect(popupBox!.x).toBeGreaterThanOrEqual(-1);
      expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(321);
      expect(optionBox!.x).toBeGreaterThanOrEqual(popupBox!.x - 1);
      expect(optionBox!.x + optionBox!.width).toBeLessThanOrEqual(
        popupBox!.x + popupBox!.width + 1,
      );
      expect(
        await option.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
      ).toBe(true);
      expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
        webcomponent,
      );
      expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(320);
      await option.click();
      await expect
        .poll(() =>
          control.evaluate((element) =>
            element instanceof HTMLInputElement ? element.value : element.textContent,
          ),
        )
        .toContain(longOption.trim());
    }
    expect(errors).toEqual([]);
  },
  { families: ['shadcn', 'skeleton'], timeout: 30_000 },
);

demoTest(
  'long OneOf branch label remains inside its narrow selector',
  async ({ page, base, family, webcomponent }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-json-inference?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(
      page,
      'en',
      'Schema',
      {
        type: 'object',
        properties: {
          contact: {
            type: 'object',
            oneOf: [
              { title: longOption, properties: { email: { type: 'string' } } },
              { title: 'Short branch', properties: { phone: { type: 'string' } } },
            ],
          },
        },
      },
      { verifyVisibleText: false },
    );
    await applyDemoEditor(page, 'en', 'UI Schema', {
      type: 'Control',
      scope: '#/properties/contact',
      label: 'Contact',
    });
    await applyDemoEditor(page, 'en', 'Data', { contact: { email: 'a' } });
    await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel('en', 'Demo')) }).click();
    const trigger =
      family === 'shadcn'
        ? page.locator('button[id*="/properties/contact"][aria-haspopup="listbox"]:visible')
        : page
            .locator('input[id*="/properties/contact"]:visible')
            .locator('..')
            .locator('button[aria-haspopup="listbox"]');
    await trigger.click();
    const option = page.getByRole('option', { name: longOption.trim(), exact: true });
    await expect.poll(() => option.isVisible()).toBe(true);
    const popup = option.locator('xpath=ancestor::*[@role="listbox"][1]');
    const [optionBox, popupBox] = await Promise.all([option.boundingBox(), popup.boundingBox()]);
    expect(optionBox).not.toBeNull();
    expect(popupBox).not.toBeNull();
    expect(popupBox!.x).toBeGreaterThanOrEqual(-1);
    expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(321);
    expect(optionBox!.x).toBeGreaterThanOrEqual(popupBox!.x - 1);
    expect(optionBox!.x + optionBox!.width).toBeLessThanOrEqual(popupBox!.x + popupBox!.width + 1);
    expect(await option.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
      true,
    );
    expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(320);
    await page.keyboard.press('Escape');
    await expect.poll(() => popup.isVisible()).toBe(false);
    expect(errors).toEqual([]);
  },
  { families: ['shadcn', 'skeleton'], locales: ['en'], timeout: 30_000 },
);

demoTest(
  'long scalar OneOf choice remains inside its narrow selector',
  async ({ page, base, family, webcomponent }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-json-inference?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(page, 'en', 'Schema', {
      type: 'object',
      properties: {
        choice: {
          type: 'string',
          oneOf: [
            { const: 'long', title: longOption },
            { const: 'short', title: 'Short choice' },
          ],
        },
      },
    });
    await applyDemoEditor(page, 'en', 'UI Schema', {
      type: 'Control',
      scope: '#/properties/choice',
      label: 'Choice',
    });
    await applyDemoEditor(page, 'en', 'Data', {});
    await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel('en', 'Demo')) }).click();
    const trigger = page.locator('[id$="/properties/choice-input"]:visible');
    await trigger.click();
    const option = page.getByRole('option', { name: longOption.trim(), exact: true });
    await expect.poll(() => option.isVisible()).toBe(true);
    const popup = option.locator('xpath=ancestor::*[@role="listbox"][1]');
    const [optionBox, popupBox] = await Promise.all([option.boundingBox(), popup.boundingBox()]);
    expect(optionBox).not.toBeNull();
    expect(popupBox).not.toBeNull();
    expect(popupBox!.x).toBeGreaterThanOrEqual(-1);
    expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(321);
    expect(optionBox!.x).toBeGreaterThanOrEqual(popupBox!.x - 1);
    expect(optionBox!.x + optionBox!.width).toBeLessThanOrEqual(popupBox!.x + popupBox!.width + 1);
    expect(await option.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
      true,
    );
    expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(320);
    expect(errors).toEqual([]);
  },
  { families: ['shadcn', 'skeleton'], locales: ['en'], timeout: 30_000 },
);

demoTest(
  'long translated mixed type remains inside its narrow selector',
  async ({ page, base, family, webcomponent }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-mixed-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(
      page,
      'en',
      'Internationalization',
      { ...mixedTranslations, en: { ...mixedTranslations.en, string: longOption } },
      { verifyVisibleText: false },
    );
    await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel('en', 'Demo')) }).click();
    await page
      .getByRole('tab', {
        name: mixedTranslations.en['featureNavigation.section2.label'],
        exact: true,
      })
      .click();
    const field = page.locator('[id="#/properties/priority"]');
    const trigger =
      family === 'shadcn'
        ? field.locator('[data-slot="select-trigger"]')
        : field.locator('[data-part="trigger"]').first();
    await trigger.click();
    const option = page.getByRole('option', { name: longOption.trim(), exact: true });
    await expect.poll(() => option.isVisible()).toBe(true);
    const popup = option.locator('xpath=ancestor::*[@role="listbox"][1]');
    const [optionBox, popupBox] = await Promise.all([option.boundingBox(), popup.boundingBox()]);
    expect(optionBox).not.toBeNull();
    expect(popupBox).not.toBeNull();
    expect(popupBox!.x).toBeGreaterThanOrEqual(-1);
    expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(321);
    expect(optionBox!.x).toBeGreaterThanOrEqual(popupBox!.x - 1);
    expect(optionBox!.x + optionBox!.width).toBeLessThanOrEqual(popupBox!.x + popupBox!.width + 1);
    expect(await option.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
      true,
    );
    expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(320);
    expect(errors).toEqual([]);
  },
  { families: ['shadcn', 'skeleton'], locales: ['en'], timeout: 30_000 },
);
