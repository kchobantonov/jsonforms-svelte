import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-additional-properties/translations.json';

demoTest('additional-properties-minimum', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const demo = page.getByRole('tab', {
    name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`),
  });
  const overrides = page.getByRole('tab', {
    name: translations[locale]['featureNavigation.section3.label'],
    exact: true,
  });
  await overrides.click();
  const card = page.locator('[data-additional-properties]:visible');
  await expect.poll(() => card.count()).toBe(1);
  const name = card.getByRole('textbox', {
    name: messages[locale]['additionalProperties.propertyNameLabel'],
    exact: true,
  });
  const add = card.getByRole('button', {
    name: new RegExp(
      `^${messages[locale]['additionalProperties.addAriaLabelWithValue'].split('{value}')[0]}`,
    ),
  });
  await name.fill('   ');
  await expect.poll(() => add.isDisabled()).toBe(true);
  await name.fill('');
  await expect.poll(() => name.getAttribute('aria-invalid')).not.toBe('true');

  const remove = card.getByRole('button', {
    name: messages[locale]['additionalProperties.removeAriaLabel'],
    exact: true,
  });
  await expect.poll(() => remove.count()).toBe(2);
  await expect.poll(() => remove.first().isDisabled()).toBe(true);
  await remove.first().evaluate((node) => (node as HTMLButtonElement).click());
  await expect.poll(() => remove.count()).toBe(2);

  await applyDemoEditor(page, locale, 'Config', {
    showUnfocusedDescription: true,
    restrict: false,
    allowEmptyPropertyNames: true,
  });
  await demo.click();
  await overrides.click();
  await expect.poll(() => remove.first().isEnabled()).toBe(true);
  await remove.first().click();
  await expect.poll(() => remove.count()).toBe(1);
  const group = page.locator('[data-group-frame]').filter({ has: card });
  await expect.poll(() => group.locator('[data-object-own-errors]').count()).toBe(1);

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const editor = page.locator(
    '.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context',
  );
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('ControlOrMeta+C');
  const stored = JSON.parse(await page.evaluate(() => navigator.clipboard.readText())) as {
    quota: Record<string, number>;
  };
  assert.equal(Object.keys(stored.quota).length, 1);
  assert.deepEqual(pageErrors, []);
});
