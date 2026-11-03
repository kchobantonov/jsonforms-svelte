import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import arrays from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-detail-modes/translations.supplement.json';
import editors from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-editor-details/translations.supplement.json';
import editorData from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-editor-details/data.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('detail-examples', async ({ page, family, locale, webcomponent, base }) => {
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
  const route = (id: string) =>
    `${base}/${family}/#/examples/spec-${id}?use-webcomponent=${webcomponent}&drawer=false`;
  await page.goto(route('array-detail-modes'));
  await expect.poll(() => page.getByRole('table').count()).toBe(1);
  await expect
    .poll(() =>
      page
        .locator('input')
        .evaluateAll(
          (inputs) =>
            inputs.filter(
              (input) => (input as HTMLInputElement).value === 'Visible in generated layouts',
            ).length,
        ),
    )
    .toBe(4);
  const registered = page.getByRole('textbox', {
    name: arrays[locale]['detailExample.registeredName.label'],
    exact: true,
  });
  await expect.poll(() => registered.count()).toBe(2);
  await expect
    .poll(() =>
      page
        .getByRole('textbox', { name: arrays[locale]['detailExample.name.label'], exact: true })
        .count(),
    )
    .toBe(2);
  await expect
    .poll(() =>
      page
        .getByRole('textbox', { name: arrays[locale]['detailExample.note.label'], exact: true })
        .count(),
    )
    .toBe(2);
  const inline = page.getByRole('textbox', {
    name: arrays[locale]['arrayDetail.inlineNote.label'],
    exact: true,
  });
  await inline.fill('Edited inline note');
  await expect.poll(() => inline.inputValue()).toBe('Edited inline note');
  assert.equal(await registered.first().inputValue(), 'Ada');

  await page.goto(route('editor-details'));
  await expect
    .poll(() =>
      page
        .getByRole('textbox', { name: editors[locale]['detailExample.name.label'], exact: true })
        .count(),
    )
    .toBe(1);
  await expect
    .poll(() =>
      page
        .locator('input')
        .evaluateAll(
          (inputs) =>
            inputs
              .map((input) => (input as HTMLInputElement).value)
              .filter((value) => value === 'Generated field').length,
        ),
    )
    .toBe(1);
  await expect
    .poll(() =>
      page
        .locator('input')
        .evaluateAll(
          (inputs) =>
            inputs
              .map((input) => (input as HTMLInputElement).value)
              .filter((value) => value === 'Type-specific field').length,
        ),
    )
    .toBe(1);
  const note = page.getByRole('textbox', {
    name: editors[locale]['editorDetail.note.label'],
    exact: true,
  });
  await note.fill('Edited mixed note');
  await expect.poll(() => note.inputValue()).toBe('Edited mixed note');
  await page.locator('[data-composite-cell] button').first().click();
  await expect
    .poll(() =>
      page.getByRole('dialog', { name: messages[locale]['composite.detailsTitle'] }).count(),
    )
    .toBe(1);
  await expect
    .poll(() =>
      page
        .getByRole('dialog')
        .locator('input')
        .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)),
    )
    .toEqual(['Ada']);
  const name = page.getByRole('textbox', {
    name: editors[locale]['detailExample.registeredName.label'],
    exact: true,
  });
  await name.fill('Discarded');
  await page
    .getByRole('button', { name: messages[locale]['composite.cancel'], exact: true })
    .click();
  await page.locator('[data-composite-cell] button').first().click();
  assert.equal(await name.inputValue(), 'Ada');
  await name.fill('Grace');
  await page
    .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
    .click();
  await page.locator('[data-composite-cell] button').first().click();
  await expect.poll(() => name.inputValue()).toBe('Grace');
  await page
    .getByRole('button', { name: messages[locale]['composite.cancel'], exact: true })
    .click();
  assert.equal(await note.inputValue(), 'Edited mixed note');
  await applyDemoEditor(page, locale, 'Data', {
    ...editorData,
    mixed: 'String branch',
  });
  await page.getByRole('tab', { name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`) }).click();
  await expect
    .poll(() =>
      page.getByText(editors[locale]['editorDetail.string.text'], { exact: true }).count(),
    )
    .toBe(1);
  await expect
    .poll(() =>
      page
        .locator('input')
        .evaluateAll(
          (inputs) =>
            inputs
              .map((input) => (input as HTMLInputElement).value)
              .filter((value) => value === 'String branch').length,
        ),
    )
    .toBe(1);
  assert.deepEqual(errors, []);
});
