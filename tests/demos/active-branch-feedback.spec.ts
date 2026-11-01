import { expect } from 'vite-plus/test';
import { mkdir } from 'node:fs/promises';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import labels from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/translations.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/supplemental-translations.json';
import { localizeMixedSchema } from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/localize-schema';
import sourceSchema from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/schema.json';

demoTest(
  'active-branch-feedback',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-mixed-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', { name: labels[locale]['branchFeedback.navigation.label'], exact: true })
      .click();
    const short = page.getByRole('tab', {
      name: fields[locale]['mixedExample/properties/branchFeedback/anyOf/0.label'],
      exact: true,
    });
    const long = page.getByRole('tab', {
      name: fields[locale]['mixedExample/properties/branchFeedback/anyOf/1.label'],
      exact: true,
    });
    await expect.poll(() => short.count()).toBe(2);
    const invalid = page.locator('input[aria-invalid="true"]:visible');
    await short.first().click();
    await expect.poll(() => invalid.count()).toBe(1);
    await short.last().click();
    await expect.poll(() => invalid.count()).toBe(1);
    const inputs = page.locator('input:visible');
    expect(
      (
        await inputs.evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value))
      ).filter((value) => value === 'Longer text'),
    ).toHaveLength(2);
    await long.first().click();
    await expect.poll(() => invalid.count()).toBe(0);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const editor = page.locator(
      '.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context',
    );
    await editor.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('ControlOrMeta+C');
    await expect
      .poll(
        async () =>
          JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).branchFeedback,
      )
      .toEqual({ text: 'Longer text' });
    const schema = localizeMixedSchema(structuredClone(sourceSchema)) as {
      properties: {
        branchFeedback: { type: string | string[]; anyOf: Array<Record<string, unknown>> };
      };
    };
    schema.properties.branchFeedback.type = ['object', 'null'];
    schema.properties.branchFeedback.anyOf.push({ type: 'null', title: 'None' });
    const schemaLabel = demoEditorLabel(locale, 'Schema');
    await page.getByRole('tab', { name: schemaLabel, exact: true }).click();
    const toolbar = page.getByRole('heading', { name: schemaLabel, exact: true }).locator('..');
    const schemaEditor = toolbar.locator('..').locator('.inputarea, .native-edit-context');
    await schemaEditor.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await schemaEditor.evaluate((element, content) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', content);
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    }, JSON.stringify(schema));
    await toolbar.getByRole('button').nth(1).click();
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', { name: labels[locale]['branchFeedback.navigation.label'], exact: true })
      .click();
    const mixedSelectors = page.locator(
      '[id^="#/properties/branchFeedback"][id$="-input-selector"]:visible',
    );
    await expect.poll(() => mixedSelectors.count()).toBe(2);
    if (locale === 'bg') {
      await expect.poll(() => page.getByText('Клон', { exact: true }).count()).toBe(2);
    }
    const delegatedShort = page.getByRole('tab', {
      name: fields[locale]['mixedExample/properties/branchFeedback/anyOf/0.label'],
      exact: true,
    });
    const delegatedLong = page.getByRole('tab', {
      name: fields[locale]['mixedExample/properties/branchFeedback/anyOf/1.label'],
      exact: true,
    });
    await expect.poll(() => delegatedShort.count()).toBe(2);
    await delegatedShort.first().click();
    await expect.poll(() => invalid.count()).toBe(1);
    await delegatedShort.last().click();
    await expect.poll(() => invalid.count()).toBe(1);
    expect(
      (
        await inputs.evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value))
      ).filter((value) => value === 'Longer text'),
    ).toHaveLength(2);
    if (!webcomponent) {
      await mkdir('test-results', { recursive: true });
      await page.screenshot({
        path: `test-results/active-branch-delegated-${family}-${locale}.png`,
        fullPage: true,
      });
    }
    await delegatedLong.first().click();
    await expect.poll(() => invalid.count()).toBe(0);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await editor.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('ControlOrMeta+C');
    await expect
      .poll(
        async () =>
          JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).branchFeedback,
      )
      .toEqual({ text: 'Longer text' });
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
