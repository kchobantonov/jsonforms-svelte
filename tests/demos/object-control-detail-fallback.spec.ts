import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-object-control/translations.json';
import supplement from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-object-control/translations.supplement.json';

demoTest('object-control-detail-fallback', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) =>
      localStorage.setItem(
        `${family}-example-locale`,
        JSON.stringify({ version: 1, value: locale }),
      ),
    { family, locale },
  );
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-object-control?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await page
    .getByRole('tab', { name: translations[locale]['features.registry.label'], exact: true })
    .click();
  const coordinator = page.getByRole('textbox', {
    name: supplement[locale][
      'specObjectControl.schema.properties.notes.properties.forCoordinator.label'
    ],
    exact: true,
  });
  const office = page.getByRole('textbox', {
    name: supplement[locale][
      'specObjectControl.schema.properties.notes.properties.forOffice.label'
    ],
    exact: true,
  });
  await expect.poll(() => coordinator.inputValue()).toBe('Call on arrival');
  await expect.poll(() => office.inputValue()).toBe('Room 3');
  const handoverInputs = page
    .getByRole('tabpanel', {
      name: translations[locale]['features.registry.label'],
      exact: true,
    })
    .locator('input');
  await expect
    .poll(() =>
      handoverInputs.evaluateAll((inputs) =>
        inputs
          .map((input) => (input as HTMLInputElement).value)
          .filter((value) => ['A. Ferreira', '08:00-10:00', '4417'].includes(value)),
      ),
    )
    .toEqual(['A. Ferreira', '08:00-10:00', '4417']);
  await office.fill('Room 4');
  await office.blur();

  await page
    .getByRole('tab', { name: translations[locale]['features.detail.label'], exact: true })
    .click();
  const contactInputs = page
    .getByRole('tabpanel', { name: translations[locale]['features.detail.label'], exact: true })
    .locator('input');
  await expect
    .poll(() =>
      contactInputs.evaluateAll((inputs) =>
        inputs
          .map((input) => (input as HTMLInputElement).value)
          .filter((value) => ['+1 503 555 0113', 'support@example.test'].includes(value)),
      ),
    )
    .toEqual(['+1 503 555 0113', 'support@example.test']);

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const editor = page.locator(
    '.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context',
  );
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('ControlOrMeta+C');
  const stored = JSON.parse(await page.evaluate(() => navigator.clipboard.readText())) as {
    notes: { forCoordinator: string; forOffice: string };
  };
  assert.deepEqual(stored.notes, { forCoordinator: 'Call on arrival', forOffice: 'Room 4' });
  assert.deepEqual(pageErrors, []);
});
