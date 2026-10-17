import assert from 'node:assert/strict';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-conditional-fields/translations.json';

demoTest('conditional-fields', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const catalog = translations[locale];
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-conditional-fields?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const field = (name: string) => page.locator(`input[id*="/properties/${name}"]:visible`);
  let expectedVat = 'VAT123';
  for (const tab of ['Generated fields.label', 'Authored placement.label'] as const) {
    await page.getByRole('tab', { name: catalog[tab], exact: true }).click();
    const vat = field('vatNumber');
    await vat.waitFor();
    assert.equal(await vat.inputValue(), expectedVat);
    assert.equal(await field('purchaseOrder').inputValue(), 'PO-42');
    assert.equal(await field('billingAddress').inputValue(), 'London');
    assert.equal(await field('nickname').count(), 0);
    await page
      .locator('label:visible')
      .filter({ hasText: catalog['vatNumber.label'] })
      .first()
      .waitFor();
    if (tab === 'Generated fields.label') {
      expectedVat = 'VAT987';
      await vat.fill(expectedVat);
      await vat.blur();
    }
  }
  await page.getByText(catalog['Identity.label'], { exact: true }).first().waitFor();
  await page.getByText(catalog['Billing.label'], { exact: true }).first().waitFor();
  assert.deepEqual(errors, []);
});
