import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-tuple-control/translations.json';
import supplement from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-tuple-control/translations.supplement.json';

demoTest('tuple-position-drafts', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-tuple-control?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const featureTab = page.getByRole('tab', {
    name: translations[locale]['featureNavigation.section2.label'],
    exact: true,
  });
  await featureTab.click();
  const quantity = page.getByRole('spinbutton', {
    name: supplement[locale]['tupleExample.schema.properties.orderLine.items.1.label'],
    exact: true,
  });
  const product = page.getByRole('textbox', {
    name: supplement[locale]['tupleExample.schema.properties.orderLine.items.0.label'],
    exact: true,
  });
  const orderLine = page.locator('[data-tuple-control]').filter({ has: quantity });
  await expect.poll(() => quantity.count()).toBe(1);
  await quantity.fill('4');
  await quantity.blur();
  await expect.poll(() => product.inputValue()).toBe('');

  const dataTab = page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true });
  const demoTab = page.getByRole('tab', {
    name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`),
  });
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const storedOrderLine = async () => {
    await dataTab.click();
    const editor = page.locator(
      '.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context',
    );
    await editor.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('ControlOrMeta+C');
    return (
      JSON.parse(await page.evaluate(() => navigator.clipboard.readText())) as {
        orderLine: unknown[];
      }
    ).orderLine;
  };
  await expect.poll(storedOrderLine).toEqual(['', 4]);

  await demoTab.click();
  await featureTab.click();
  await quantity.fill('');
  await quantity.blur();
  await expect.poll(() => orderLine.getByRole('alert').count()).toBeGreaterThan(0);
  await expect.poll(storedOrderLine).toEqual(['', 4]);

  await demoTab.click();
  await featureTab.click();
  await quantity.fill('5');
  await quantity.blur();
  await expect.poll(storedOrderLine).toEqual(['', 5]);

  await demoTab.click();
  await featureTab.click();
  await product.fill('SKU-1');
  await product.blur();
  await expect.poll(storedOrderLine).toEqual(['SKU-1', 5]);
  await demoTab.click();
  await featureTab.click();
  await product.fill('');
  await product.blur();
  await expect.poll(storedOrderLine).toEqual(['', 5]);
  assert.deepEqual(pageErrors, []);
});
