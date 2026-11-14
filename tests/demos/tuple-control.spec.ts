import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/translations.json';

demoTest('tuple-control', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-tuple-control?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const east = page.getByRole('spinbutton', {
    name: translations[locale]['coordinates.x.label'],
    exact: true,
  });
  await expect.poll(() => east.inputValue()).toBe('45.52');
  await east.fill('46');
  const latitude = page.getByRole('spinbutton', {
    name: supplement[locale]['tupleExample.schema.properties.survey.items.0.label'],
    exact: true,
  });
  const longitude = page.getByRole('spinbutton', {
    name: supplement[locale]['tupleExample.schema.properties.survey.items.1.label'],
    exact: true,
  });
  assert.ok((await longitude.boundingBox())!.x < (await latitude.boundingBox())!.x);
  await latitude.fill('47');
  const tab = (index: 1 | 2 | 3) =>
    page.getByRole('tab', {
      name: translations[locale][`featureNavigation.section${index}.label`],
      exact: true,
    });
  await tab(2).click();
  const quantity = page.getByRole('spinbutton', {
    name: supplement[locale]['tupleExample.schema.properties.orderLine.items.1.label'],
    exact: true,
  });
  await quantity.fill('3');
  const inspector = page.getByRole('textbox', {
    name: supplement[locale]['tupleExample.schema.properties.inspection.items.0.label'],
    exact: true,
  });
  const inspection = page.locator('[data-tuple-control]').filter({ has: inspector });
  const add = inspection.getByRole('button', {
    name: translations[locale]['tuple.add'],
    exact: true,
  });
  await add.focus();
  const tooltip = page
    .locator(family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible')
    .filter({ hasText: translations[locale]['tuple.add'] })
    .first();
  await expect.poll(() => tooltip.isVisible()).toBe(true);
  expect(await tooltip.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
    webcomponent,
  );
  expect(await tooltip.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
    'rgba(0, 0, 0, 0)',
  );
  await page.keyboard.press('Escape');
  await expect.poll(() => tooltip.isVisible()).toBe(false);
  await expect.poll(() => add.evaluate((element) => element.matches(':focus'))).toBe(true);
  const tails = inspection.locator('[data-additional-item]');
  await inspector.evaluate((node) => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    (node as HTMLInputElement).value = 'Pending inspector';
    node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  await add.evaluate((node) => (node as HTMLButtonElement).click());
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  expect(await tails.count()).toBe(1);
  expect(await inspector.inputValue()).toBe('Pending inspector');
  await inspector.evaluate((node) =>
    node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })),
  );
  await add.evaluate((node) => {
    (node as HTMLButtonElement).click();
    (node as HTMLButtonElement).click();
  });
  await expect.poll(() => tails.count()).toBe(2);
  expect(await inspector.inputValue()).toBe('Pending inspector');
  expect(await tails.first().getByRole('textbox').inputValue()).toBe(
    'Call the yard before arrival',
  );
  expect(await tails.last().getByRole('textbox').inputValue()).toBe('');

  await tab(3).click();
  await expect
    .poll(() =>
      page.getByText(translations[locale]['tuple.configuration'], { exact: true }).isVisible(),
    )
    .toBe(true);
  const addressLabel =
    supplement[locale]['tupleExample.schema.properties.projectContact.items.0.label'];
  await page
    .getByRole('button', {
      name: translations[locale]['composite.edit'].replace('{label}', addressLabel),
      exact: true,
    })
    .click();
  const street = page.getByRole('textbox', {
    name: supplement[locale][
      'tupleExample.schema.properties.projectContact.items.0.properties.street.label'
    ],
    exact: true,
  });
  assert.equal(await street.inputValue(), '1200 NW Naito Parkway');
  await street.fill('Edited street');
  await page.getByRole('button', { name: translations[locale]['tuple.save'], exact: true }).click();
  await expect.poll(() => page.getByText('Edited street', { exact: true }).isVisible()).toBe(true);
  const deleteLabel = translations[locale]['tuple.delete'].replace(
    '{label}',
    translations[locale]['tuple.position'].replace('{position}', '3'),
  );
  const forbiddenTail = page
    .locator('[data-tuple-control]')
    .filter({ has: page.getByRole('button', { name: deleteLabel, exact: true }) });
  await expect
    .poll(() =>
      forbiddenTail
        .getByRole('button', { name: translations[locale]['tuple.add'], exact: true })
        .isDisabled(),
    )
    .toBe(true);
  await expect.poll(() => forbiddenTail.locator('[data-additional-items-errors]').count()).toBe(1);
  await page.getByRole('button', { name: deleteLabel, exact: true }).click();
  await expect.poll(() => page.getByText('Imported extra value', { exact: true }).count()).toBe(0);
  await expect.poll(() => forbiddenTail.locator('[data-additional-items-errors]').count()).toBe(0);
  await tab(1).click();
  assert.equal(await east.inputValue(), '46');
  assert.equal(await latitude.inputValue(), '47');
  assert.equal(await longitude.inputValue(), '-122.6819');
  await tab(2).click();
  assert.equal(await quantity.inputValue(), '3');
  assert.deepEqual(errors, []);
});

demoTest(
  'tuple fills empty prefix on later-position edit',
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
      `${base}/${family}/#/examples/spec-json-inference?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(page, locale, 'Schema', {
      type: 'object',
      properties: {
        value: { type: 'array', items: [{ type: 'string' }, { type: 'integer' }] },
      },
    });
    await applyDemoEditor(page, locale, 'UI Schema', {
      type: 'Control',
      scope: '#/properties/value',
    });
    await applyDemoEditor(page, locale, 'Data', { value: [] });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    const tuple = page.locator('[data-tuple-control]:visible');
    await expect.poll(() => tuple.count()).toBe(1);
    await tuple.getByRole('spinbutton').fill('30');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const editor = page.locator('.monaco-editor:visible');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await expect
      .poll(async () => {
        await editor.locator('.inputarea, .native-edit-context').focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual({ value: ['', 30] });
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
