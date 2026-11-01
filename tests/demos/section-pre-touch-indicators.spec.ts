import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('section pre-touch indicators', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-json-inference?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await applyDemoEditor(page, locale, 'Schema', {
    type: 'object',
    properties: { name: { type: 'string', title: 'Field', minLength: 3 } },
  });
  await applyDemoEditor(page, locale, 'UI Schema', {
    type: 'Categorization',
    elements: [
      {
        type: 'Category',
        label: 'Section',
        elements: [
          {
            type: 'Group',
            label: 'Group',
            elements: [{ type: 'Control', scope: '#/properties/name' }],
          },
        ],
      },
    ],
  });
  await applyDemoEditor(page, locale, 'Config', {
    enableFilterErrorsBeforeTouch: true,
    filterErrorKeywordsBeforeTouch: ['minLength'],
    jsonformsExtended: { showValidationIndicator: true, showValidationIndicatorCount: true },
  });
  await applyDemoEditor(page, locale, 'Data', { name: 'x' });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();

  const markers = page.locator('[data-container-validation-indicator]');
  await expect.poll(() => markers.count()).toBe(2);
  const countLabel = messages[locale]['validation.containerError'].replace('{count}', '1');
  expect(await markers.first().getAttribute('aria-label')).toBe(countLabel);
  expect(await markers.last().getAttribute('aria-label')).toBe(countLabel);
  const field = page.getByRole('textbox', { name: 'Field', exact: true });
  await field.click();
  await page.keyboard.press('Tab');
  await expect.poll(() => markers.count()).toBe(2);
  expect(await markers.first().getAttribute('aria-label')).toBe(countLabel);
  expect(await markers.last().getAttribute('aria-label')).toBe(countLabel);
  expect(pageErrors).toEqual([]);
});
