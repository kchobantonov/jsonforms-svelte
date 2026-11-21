import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/group-layout/translations.json';
import fields from '@chobantonov/jsonforms-extended-spec/examples/group-layout/translations.json';

demoTest('group-layout-canonical', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-group-layout?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const tab = (key: keyof typeof translations.en) =>
    page.getByRole('tab', { name: translations[locale][key], exact: true });
  const group = (label: keyof typeof fields.en) =>
    page.getByRole('group', { name: fields[locale][label], exact: true });
  const indicator = (label: keyof typeof fields.en) =>
    group(label).locator(
      `h3 [data-group-indicator][aria-label="${translations[locale]['group.dataIndicator']}"]`,
    );

  const identity = group('Identity');
  await expect.poll(() => identity.count()).toBe(1);
  assert.equal(await identity.locator('button[aria-expanded]').count(), 0);
  assert.equal(
    await identity.getByRole('textbox', { name: fields[locale]['legalName.label'] }).inputValue(),
    'Cascade Supplies',
  );

  await tab('featureNavigation.section2.label').click();
  const contact = group('Contact');
  const details = group('Additional details');
  const contactToggle = contact.getByRole('button', {
    name: fields[locale]['Contact'],
    exact: true,
  });
  const detailsToggle = details.getByRole('button', {
    name: fields[locale]['Additional details'],
    exact: true,
  });
  await expect.poll(() => contactToggle.getAttribute('aria-expanded')).toBe('true');
  await expect.poll(() => detailsToggle.getAttribute('aria-expanded')).toBe('false');
  await expect.poll(() => indicator('Contact').count()).toBe(2);
  await expect.poll(() => indicator('Additional details').count()).toBe(1);
  await contactToggle.click();
  await expect.poll(() => contactToggle.getAttribute('aria-expanded')).toBe('false');
  await contactToggle.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => contactToggle.getAttribute('aria-expanded')).toBe('true');
  assert.equal(await detailsToggle.getAttribute('aria-expanded'), 'false');
  await detailsToggle.click();
  const phone = details.getByRole('textbox', { name: fields[locale]['alternatePhone.label'] });
  assert.equal(await phone.inputValue(), '+1 503 555 0113');
  await phone.fill('+1 503 555 0199');
  await phone.blur();

  await tab('featureNavigation.section3.label').click();
  const insurance = group('Insurance');
  const insuranceToggle = insurance.getByRole('button', {
    name: fields[locale]['Insurance'],
    exact: true,
  });
  await expect.poll(() => insuranceToggle.getAttribute('aria-expanded')).toBe('false');
  assert.equal(await indicator('Insurance').count(), 0);
  await insuranceToggle.click();
  await expect.poll(() => insuranceToggle.getAttribute('aria-expanded')).toBe('true');
  await insurance.getByRole('textbox', { name: fields[locale]['insurer.label'] }).waitFor();

  await tab('featureNavigation.section4.label').click();
  const audit = group('Audit');
  assert.equal(await audit.locator('button[aria-expanded]').count(), 0);
  await audit.getByRole('textbox', { name: fields[locale]['auditNote.label'] }).waitFor();

  await tab('presence.tab.label').click();
  const presence = page.getByRole('group', {
    name: translations[locale]['presence.group.label'],
    exact: true,
  });
  await expect.poll(() => presence.locator('h3 [data-group-indicator]').count()).toBe(1);
  await expect
    .poll(() => presence.getByRole('button').first().getAttribute('aria-expanded'))
    .toBe('false');
  if (family === 'shadcn') {
    assert.notEqual(await presence.getAttribute('data-group-frame'), null);
    const frameBox = await presence.boundingBox();
    const chevronBox = await presence
      .getByRole('button')
      .first()
      .locator('svg')
      .last()
      .boundingBox();
    assert.ok(frameBox && chevronBox);
    assert.ok(chevronBox.x > frameBox.x + frameBox.width * 0.8);
  }

  await tab('featureNavigation.section2.label').click();
  await expect.poll(() => contactToggle.getAttribute('aria-expanded')).toBe('true');
  if ((await detailsToggle.getAttribute('aria-expanded')) === 'false') await detailsToggle.click();
  assert.equal(await phone.inputValue(), '+1 503 555 0199');

  await tab('regions.tab.label').click();
  const card = group('regions.header.title.text');
  const cardToggle = card.getByRole('button', {
    name: fields[locale]['regions.header.title.text'],
    exact: true,
  });
  await expect.poll(() => cardToggle.getAttribute('aria-expanded')).toBe('false');
  await expect
    .poll(() => card.getByText(fields[locale]['regions.header.title.text'], { exact: true }).count())
    .toBe(1);
  const cover = card.locator('[data-group-cover] img');
  await expect.poll(() => cover.count()).toBe(1);
  assert.equal(await cover.isVisible(), true);
  const header = card.locator('[data-group-header]');
  await expect.poll(() => header.textContent()).toContain(translations[locale]['regions.header.description.text']);
  assert.equal(await header.isVisible(), true);
  assert.equal(await card.locator('[data-group-footer]').isVisible(), false);
  await cardToggle.click();
  await expect.poll(() => cardToggle.getAttribute('aria-expanded')).toBe('true');
  assert.equal(await cover.isVisible(), true);
  assert.equal(await cover.getAttribute('alt'), 'Sunlit courtyard at a boutique hotel');
  await expect
    .poll(() =>
      cover.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);
  await expect
    .poll(() => header.textContent())
    .toContain(translations[locale]['regions.header.title.text']);
  await expect
    .poll(() => card.textContent())
    .toContain(translations[locale]['regions.header.description.text']);
  const cardBox = await card.boundingBox();
  const coverBox = await cover.boundingBox();
  assert.ok(cardBox && coverBox);
  assert.ok(cardBox.width <= 820);
  assert.ok(coverBox.width >= cardBox.width * 0.9);
  assert.ok(coverBox.y - cardBox.y < 4);
  assert.equal(await cardToggle.locator('[data-group-header]').count(), 0);
  const footer = card.locator('[data-group-footer]');
  await expect.poll(() => footer.getByRole('button').count()).toBe(2);
  const actionBoxes = await Promise.all(
    [0, 1].map((index) => footer.getByRole('button').nth(index).boundingBox()),
  );
  assert.ok(actionBoxes[0] && actionBoxes[1]);
  assert.ok(Math.abs(actionBoxes[0].y - actionBoxes[1].y) < 8);
  const lastField = await card
    .getByRole('textbox', { name: fields[locale]['memberNumber.label'] })
    .boundingBox();
  assert.ok(lastField);
  assert.ok(actionBoxes[0].y - (lastField.y + lastField.height) >= 12);
  const nextLocale: 'en' | 'bg' = locale === 'en' ? 'bg' : 'en';
  await footer
    .getByRole('button', { name: nextLocale === 'bg' ? 'Български' : 'English' })
    .click();
  const nextCard = page.getByRole('group', {
    name: translations[nextLocale]['regions.header.title.text'],
    exact: true,
  });
  await expect.poll(() => nextCard.count()).toBe(1);
  await expect
    .poll(() => nextCard.locator('button[aria-expanded]').getAttribute('aria-expanded'))
    .toBe('true');
  await expect
    .poll(() => nextCard.locator('[data-group-header]').textContent())
    .toContain(translations[nextLocale]['regions.header.title.text']);
  await nextCard
    .locator('[data-group-footer]')
    .getByRole('button', { name: locale === 'bg' ? 'Български' : 'English' })
    .click();
  await expect.poll(() => card.count()).toBe(1);
  if ((await cardToggle.getAttribute('aria-expanded')) === 'false') await cardToggle.click();
  await expect.poll(() => cardToggle.getAttribute('aria-expanded')).toBe('true');
  await card.getByRole('textbox', { name: fields[locale]['legalName.label'] }).waitFor();
  assert.deepEqual(errors, []);
});
