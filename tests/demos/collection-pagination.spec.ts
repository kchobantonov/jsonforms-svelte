import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import additionalItemsUiSchema from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-additional-items-pagination/uischema.json';
import additionalItemsData from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-additional-items-pagination/data.json';
import paginationTranslations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-additional-items-pagination/translations.json';
import paginationSupplements from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-additional-items-pagination/translations.supplement.json';

demoTest('collection-pagination', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const route = (id: string) =>
    `${base}/${family}/#/examples/spec-${id}?use-webcomponent=${webcomponent}&drawer=false`;
  const next = () =>
    page.getByRole('button', { name: messages[locale]['collection.next'], exact: true }).click();
  const previous = () =>
    page
      .getByRole('button', { name: messages[locale]['collection.previous'], exact: true })
      .click();
  await page.goto(route('collection-pagination'));
  await expect.poll(() => page.locator('tbody tr').count()).toBe(5);
  await expect
    .poll(() =>
      page
        .locator('[data-collection-footer]')
        .evaluate((footer) => Boolean(footer.parentElement?.querySelector('table'))),
    )
    .toBe(true);
  const resize = page.locator('thead').getByRole('separator').first();
  const beforeWidth = await resize.evaluate(
    (element) => element.closest('th')!.getBoundingClientRect().width,
  );
  const box = await resize.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  const width = Number(await resize.getAttribute('aria-valuenow'));
  assert.ok(Math.abs(width - (beforeWidth + 30)) <= 1);
  await next();
  const first = page.locator('tbody').getByRole('textbox').first();
  assert.equal(await first.inputValue(), 'Applicant 06');
  await first.fill('Edited applicant');
  await next();
  await previous();
  await expect.poll(() => first.inputValue()).toBe('Edited applicant');
  assert.equal(Number(await resize.getAttribute('aria-valuenow')), width);

  await page.goto(route('property-pagination'));
  await expect
    .poll(() => page.locator('[data-additional-properties] [data-collection-footer]').count())
    .toBe(1);
  await next();
  const property = page.getByRole('textbox', { name: 'guest-06', exact: true });
  assert.equal(await property.inputValue(), 'REF-105');
  await property.fill('Edited reference');
  await next();
  await previous();
  await expect.poll(() => property.inputValue()).toBe('Edited reference');

  await page.goto(route('additional-items-pagination'));
  const tail = page.locator('.additional-items:visible');
  const reference = page.getByRole('textbox', {
    name: paginationSupplements[locale]['shipment.reference.label'],
    exact: true,
  });
  await expect.poll(() => reference.inputValue()).toBe('SHIP-104');
  await expect.poll(() => tail.locator('[data-additional-item]').count()).toBe(5);
  await expect.poll(() => tail.locator('[data-collection-footer]').count()).toBe(1);
  await next();
  const editor = tail.getByRole('textbox', {
    name: messages[locale]['tuple.position'].replace('{position}', '7'),
    exact: true,
  });
  await editor.fill('Edited package 06');
  await previous();
  await next();
  await expect.poll(() => editor.inputValue()).toBe('Edited package 06');
  await page.getByRole('button', { name: messages[locale]['tuple.add'], exact: true }).click();
  await expect.poll(() => tail.locator('[data-additional-item="13"]').count()).toBe(1);
  await previous();
  const deleteLabel = messages[locale]['tuple.delete'].replace(
    '{label}',
    messages[locale]['tuple.position'].replace('{position}', '7'),
  );
  await tail.getByRole('button', { name: deleteLabel, exact: true }).click();
  await expect.poll(() => editor.inputValue()).toBe('Package 07');
  await expect
    .poll(() =>
      tail
        .locator('[data-additional-item="6"] .additional-item-actions button[aria-label]')
        .getAttribute('aria-label'),
    )
    .toBe(deleteLabel);
  await expect.poll(() => reference.inputValue()).toBe('SHIP-104');

  await page
    .getByRole('tab', {
      name: paginationTranslations[locale]['featureNavigation.section2.label'],
      exact: true,
    })
    .click();
  await expect.poll(() => tail.locator('[data-additional-item]').count()).toBe(2);
  assert.equal(await tail.locator('[data-collection-footer]').count(), 0);
  const unpaginated = tail.getByRole('textbox', {
    name: messages[locale]['tuple.position'].replace('{position}', '2'),
    exact: true,
  });
  await expect.poll(() => unpaginated.inputValue()).toBe('Small crate');
  await unpaginated.fill('Edited small crate');
  await page
    .getByRole('tab', {
      name: paginationTranslations[locale]['featureNavigation.section1.label'],
      exact: true,
    })
    .click();
  await expect.poll(() => reference.inputValue()).toBe('SHIP-104');
  await page
    .getByRole('tab', {
      name: paginationTranslations[locale]['featureNavigation.section2.label'],
      exact: true,
    })
    .click();
  await expect.poll(() => unpaginated.inputValue()).toBe('Edited small crate');
  await page
    .getByRole('tab', {
      name: paginationTranslations[locale]['featureNavigation.section1.label'],
      exact: true,
    })
    .click();
  for (
    let step = 0;
    step < 2 && (await tail.locator('[data-additional-item="12"]').count()) === 0;
    step++
  )
    await next();
  await expect.poll(() => tail.locator('[data-additional-item="12"]').count()).toBe(1);
  for (const index of [12, 11]) {
    const label = messages[locale]['tuple.delete'].replace(
      '{label}',
      messages[locale]['tuple.position'].replace('{position}', String(index + 1)),
    );
    await tail.getByRole('button', { name: label, exact: true }).click();
  }
  await expect.poll(() => tail.locator('[data-additional-item="6"]').count()).toBe(1);
  await expect.poll(() => tail.locator('[data-additional-item="11"]').count()).toBe(0);
  await expect.poll(() => reference.inputValue()).toBe('SHIP-104');
  assert.deepEqual(errors, []);
});

demoTest(
  'additional-items-pagination-config',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-additional-items-pagination?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const tail = page.locator('.additional-items:visible');
    await expect.poll(() => tail.locator('[data-additional-item]').count()).toBe(5);

    const customUiSchema = structuredClone(additionalItemsUiSchema);
    const tailControl = customUiSchema.elements[0].elements[0].elements[0];
    if (!('options' in tailControl)) throw new Error('Missing additional-items options');
    Object.assign(tailControl.options.additionalItems, {
      pagination: { pageSize: 10 },
    });
    await applyDemoEditor(page, locale, 'UI Schema', customUiSchema, {
      verifyVisibleText: false,
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await expect.poll(() => tail.locator('[data-additional-item]').count()).toBe(10);

    await applyDemoEditor(page, locale, 'Config', {});
    await applyDemoEditor(page, locale, 'Data', {
      ...additionalItemsData,
      allPackages: ['SHIP-105', ...Array.from({ length: 12 }, (_, index) => `Crate ${index + 1}`)],
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: paginationTranslations[locale]['featureNavigation.section2.label'],
        exact: true,
      })
      .click();
    await expect.poll(() => tail.locator('[data-additional-item]').count()).toBe(5);
    await expect.poll(() => tail.locator('[data-collection-footer]').count()).toBe(1);
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);
