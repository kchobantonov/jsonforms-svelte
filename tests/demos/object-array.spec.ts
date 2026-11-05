import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import objectMessages from '@chobantonov/jsonforms-extended-spec/examples/object-control/translations.json';
import objectFields from '@chobantonov/jsonforms-extended-spec/examples/object-control/translations.json';
import arrayMessages from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';
import arrayFields from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('object-array', async ({ page, family, locale, webcomponent, base }) => {
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
  const url = (example: string) =>
    `${base}/${family}/#/examples/spec-${example}?use-webcomponent=${webcomponent}&drawer=false`;
  await page.goto(url('object-control'));
  await page
    .getByRole('tab', { name: objectMessages[locale]['features.registry.label'], exact: true })
    .click();
  const field = (path: string) =>
    page.getByRole('textbox', {
      name: objectFields[locale][
        `specObjectControl.schema.properties.${path}.label` as keyof typeof objectFields.en
      ],
      exact: false,
    });
  await expect.poll(() => field('address.properties.line1').isVisible()).toBe(true);
  await expect.poll(() => field('handover.properties.contactName').isVisible()).toBe(true);
  await expect.poll(() => field('notes.properties.forOffice').inputValue()).toBe('Room 3');
  await expect
    .poll(() => field('address.properties.city').getAttribute('aria-invalid'))
    .toBe('true');
  await field('address.properties.city').fill('Updated city');
  await expect
    .poll(() => field('address.properties.city').getAttribute('aria-invalid'))
    .not.toBe('true');
  await page
    .getByRole('tab', { name: objectMessages[locale]['features.generated.label'], exact: true })
    .click();
  const legalName = field('identity.properties.legalName');
  await expect.poll(() => legalName.getAttribute('aria-invalid')).toBe('true');
  await legalName.fill('Cascade Supplies LLC');
  await expect.poll(() => legalName.getAttribute('aria-invalid')).not.toBe('true');
  await page
    .getByRole('tab', { name: objectMessages[locale]['features.registry.label'], exact: true })
    .click();
  expect(await field('address.properties.city').inputValue()).toBe('Updated city');

  await page
    .getByRole('tab', { name: objectMessages[locale]['features.validation.label'], exact: true })
    .click();
  const ownError = page.locator('[data-object-own-errors]').first();
  expect(await ownError.getAttribute('aria-label')).toBe(
    objectMessages[locale]['error.minProperties'],
  );
  await expect.poll(() => ownError.isVisible()).toBe(true);
  await ownError.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.getByRole('dialog').isVisible()).toBe(true);
  await page.keyboard.press('Escape');
  await field('preferences.properties.language').fill('bg');
  await field('preferences.properties.timezone').click();
  await expect.poll(() => ownError.count()).toBe(0);
  const rejected = page.locator('[data-additional-property-errors]').first();
  expect(await rejected.getAttribute('aria-label')).toBe(
    `"legacyZone": ${objectMessages[locale]['error.additionalProperties']}`,
  );
  await expect.poll(() => rejected.isVisible()).toBe(true);
  await page
    .getByRole('button', {
      name: new RegExp(
        '^' + messages[locale]['additionalProperties.deleteNamed'].split('{name}')[0],
      ),
      exact: true,
    })
    .click();
  await expect.poll(() => rejected.count()).toBe(0);
  const costCentre = field('billing.properties.costCentre');
  await expect.poll(() => costCentre.getAttribute('aria-invalid')).toBe('true');
  await costCentre.fill('CC-42');
  await costCentre.blur();
  await expect.poll(() => costCentre.getAttribute('aria-invalid')).not.toBe('true');
  await page
    .getByRole('tab', { name: objectMessages[locale]['objectFrame.dynamic.label'], exact: true })
    .click();
  const dynamic = page.getByRole('tabpanel', {
    name: objectMessages[locale]['objectFrame.dynamic.label'],
    exact: true,
  });
  expect(await dynamic.locator('[data-object-static-fields]').count()).toBe(0);
  expect(await dynamic.locator('[data-additional-properties][data-embedded="true"]').count()).toBe(
    2,
  );
  const borders = await dynamic
    .locator('[data-additional-properties]')
    .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).borderTopWidth));
  expect(borders).toEqual(['0px', '0px']);

  await page.goto(url('array-controls'));
  const panel = page.getByRole('tabpanel', {
    name: arrayMessages[locale]['tableTab.label'],
    exact: true,
  });
  const row = panel.getByRole('row').nth(1);
  const title = row.getByRole('textbox').first();
  await expect.poll(() => title.inputValue()).toBe('Designing for the second read');
  await title.fill('Updated session');
  await title.blur();
  const room =
    arrayFields[locale]['specArrayControls.schema.properties.sessions.items.properties.room.label'];
  await row
    .getByRole('button', {
      name: messages[locale]['composite.edit'].replace('{label}', room),
      exact: true,
    })
    .click();
  const dialog = page.getByRole('dialog', { name: room, exact: true });
  await expect.poll(() => dialog.isVisible()).toBe(true);
  await dialog
    .getByRole('button', { name: messages[locale]['composite.close'], exact: true })
    .click();
  await page
    .getByRole('tab', { name: arrayMessages[locale]['expandableTab.label'], exact: true })
    .click();
  await page
    .getByRole('tab', { name: arrayMessages[locale]['tableTab.label'], exact: true })
    .click();
  expect(await title.inputValue()).toBe('Updated session');
  expect(errors).toEqual([]);
});
