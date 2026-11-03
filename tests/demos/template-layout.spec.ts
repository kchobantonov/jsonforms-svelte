import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-template-layout/translations.supplement.json';
import sourceConfig from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-template-layout/config.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('template-layout', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-template-layout?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await page.getByRole('tab', { name: 'lang: ractive', exact: true }).click();
  const ractive = page.getByRole('tabpanel', { name: 'lang: ractive', exact: true });
  const ractiveNote = page.getByRole('textbox', {
    name: fields[locale]['specTemplateLayout.schema.properties.ractiveNote.label'],
    exact: true,
  });
  await ractiveNote.fill('Ractive slot edit');
  await ractiveNote.evaluate((element) => {
    (window as typeof window & { __ractiveNote?: Element }).__ractiveNote = element;
  });
  const customer = page.getByRole('textbox', {
    name: fields[locale]['specTemplateLayout.schema.properties.customerName.label'],
    exact: true,
  });
  await customer.fill('Updated customer');
  await expect
    .poll(() => ractive.locator('[data-greeting]').textContent())
    .toBe(fields[locale]['specTemplateLayout.greeting'] + ' Updated customer');
  await expect.poll(() => ractive.locator('[data-list]').textContent()).toContain('Ann, Bo, Cy');
  expect(
    await ractiveNote.evaluate(
      (element) =>
        element === (window as typeof window & { __ractiveNote?: Element }).__ractiveNote,
    ),
  ).toBe(true);
  await expect.poll(() => ractiveNote.inputValue()).toBe('Ractive slot edit');
  await customer.blur();
  await ractiveNote.blur();
  await page.getByRole('tab', { name: 'lang: jsx', exact: true }).click();
  await expect
    .poll(() => page.locator('[role="alert"]:visible').filter({ hasText: 'jsx' }).count())
    .toBeGreaterThan(0);
  await page
    .getByRole('tab', {
      name: fields[locale]['specTemplateLayout.ui.elements.3.elements.2.label'],
      exact: true,
    })
    .click();
  await expect
    .poll(() => page.locator('[data-default]').textContent())
    .toContain('Updated customer');
  await expect
    .poll(() => page.locator('[role="alert"]:visible').filter({ hasText: 'handlebars' }).count())
    .toBeGreaterThan(0);
  await page
    .getByRole('tab', { name: fields[locale]['specTemplateLayout.native.label'], exact: true })
    .click();
  const native = page.getByRole('tabpanel', {
    name: fields[locale]['specTemplateLayout.native.label'],
    exact: true,
  });
  await expect
    .poll(() => native.locator('[data-greeting]').textContent())
    .toBe(fields[locale]['specTemplateLayout.greeting'] + ' Updated customer');
  const nativeNote = page.getByRole('textbox', {
    name: fields[locale]['specTemplateLayout.schema.properties.nativeNote.label'],
    exact: true,
  });
  await nativeNote.fill('Native slot edit');
  await nativeNote.blur();
  await expect.poll(() => nativeNote.inputValue()).toBe('Native slot edit');
  await page.getByRole('tab', { name: 'lang: ractive', exact: true }).click();
  await expect.poll(() => ractiveNote.inputValue()).toBe('Ractive slot edit');
  await applyDemoEditor(page, locale, 'Config', {
    ...sourceConfig,
    jsonformsExtended: {
      ...sourceConfig.jsonformsExtended,
      security: { allowScriptEvaluation: false },
    },
  });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await page.getByRole('tab', { name: 'lang: ractive', exact: true }).click();
  await expect
    .poll(() =>
      page
        .getByRole('alert')
        .filter({ hasText: messages[locale]['template.evaluationDisabled'] })
        .count(),
    )
    .toBe(1);
  await page
    .getByRole('tab', { name: fields[locale]['specTemplateLayout.native.label'], exact: true })
    .click();
  await expect.poll(() => nativeNote.inputValue()).toBe('Native slot edit');
  await nativeNote.fill('Still editable');
  await nativeNote.blur();
  await expect.poll(() => nativeNote.inputValue()).toBe('Still editable');
  await page.getByRole('tab', { name: 'lang: ractive', exact: true }).click();
  await applyDemoEditor(page, locale, 'Config', sourceConfig);
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await page.getByRole('tab', { name: 'lang: ractive', exact: true }).click();
  await expect.poll(() => ractiveNote.inputValue()).toBe('Ractive slot edit');
  expect(errors).toEqual([]);
});
