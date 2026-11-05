import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import schema from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/schema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/config.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('tuple tail off-page summary', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-tuple-control?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const editedSchema = structuredClone(schema);
  Object.assign(editedSchema.properties.inspection.items[0], { minLength: 3 });
  Object.assign(editedSchema.properties.inspection.additionalItems, { minLength: 4 });
  await applyDemoEditor(page, locale, 'Schema', editedSchema, { verifyVisibleText: false });
  await applyDemoEditor(page, locale, 'Config', {
    ...config,
    jsonformsExtended: {
      showValidationIndicatorCount: true,
      additionalItems: { pagination: { pageSize: 1 } },
    },
  });
  await applyDemoEditor(
    page,
    locale,
    'Data',
    {
      ...data,
      inspection: ['x', false, 'valid', 'bad'],
    },
    { verifyVisibleText: false },
  );
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await page
    .getByRole('tab', { name: translations[locale]['featureNavigation.section2.label'] })
    .click();

  const tail = page
    .locator('.additional-items')
    .filter({ has: page.locator('[data-additional-items-summary]') });
  await expect.poll(() => tail.locator('[data-additional-item="2"]').count()).toBe(1);
  const notice = messages[locale]['validation.childrenErrorCount'].replace('{count}', '1');
  await expect
    .poll(() => tail.locator('[data-additional-items-summary-message]').textContent())
    .toBe(notice);
  await tail.getByRole('button', { name: messages[locale]['collection.firstError'] }).click();
  await expect.poll(() => tail.locator('[data-additional-item="3"]').count()).toBe(1);
  expect(pageErrors).toEqual([]);
});
