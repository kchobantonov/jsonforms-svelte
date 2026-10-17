import assert from 'node:assert/strict';
import { expect } from 'vitest';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

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
  await next();
  const property = page.getByRole('textbox', { name: 'guest-06', exact: true });
  assert.equal(await property.inputValue(), 'REF-105');
  await property.fill('Edited reference');
  await next();
  await previous();
  await expect.poll(() => property.inputValue()).toBe('Edited reference');

  await page.goto(route('additional-items-pagination'));
  const tail = page.locator('.additional-items:visible');
  await expect.poll(() => tail.locator('[data-additional-item]').count()).toBe(5);
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
  assert.deepEqual(errors, []);
});
