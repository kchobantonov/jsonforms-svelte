import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-tuple-control/translations.json';
import supplement from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-tuple-control/translations.supplement.json';

demoTest('tuple-control', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
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
  await page.getByRole('button', { name: deleteLabel, exact: true }).click();
  await expect.poll(() => page.getByText('Imported extra value', { exact: true }).count()).toBe(0);
  await tab(1).click();
  assert.equal(await east.inputValue(), '46');
  assert.equal(await latitude.inputValue(), '47');
  assert.equal(await longitude.inputValue(), '-122.6819');
  await tab(2).click();
  assert.equal(await quantity.inputValue(), '3');
  assert.deepEqual(errors, []);
});
