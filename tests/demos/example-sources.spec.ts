import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';

demoTest('example-sources', async ({ page, family, locale, webcomponent, base }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(
    ({ family, locale }) => {
      localStorage.setItem(`${family}-example-locale`, locale);
    },
    { family, locale },
  );
  await page.goto(
    `${base}/${family}/#/examples/spec-cron-control?drawer=true&use-webcomponent=${webcomponent}`,
  );
  const sidebar = page.locator('aside');
  const source = sidebar.getByLabel(messages[locale]['sidebar.source'], { exact: true });
  const search = sidebar.getByLabel(messages[locale]['sidebar.search'], { exact: true });
  const choose = async (value: 'spec' | 'jsonforms' | 'all') => {
    if (await source.evaluate((element) => element.tagName === 'SELECT')) {
      await source.selectOption(value);
    } else {
      await source.click();
      await page
        .getByRole('option', { name: messages[locale][`sidebar.source.${value}`], exact: true })
        .click();
    }
  };
  await search.fill('cron');
  await sidebar.getByText('Spec: Cron control', { exact: true }).waitFor();
  const expression = page.locator('input[id*="/properties/stockSync"]:visible');
  await expression.fill('0 0 9 * * *');
  await choose('jsonforms');
  const sourceBox = (await source.boundingBox())!;
  const sidebarBox = (await sidebar.boundingBox())!;
  expect(sourceBox.x + sourceBox.width).toBeLessThanOrEqual(sidebarBox.x + sidebarBox.width);
  expect(await source.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
    true,
  );
  await expect.poll(() => sidebar.getByText('Spec: Cron control', { exact: true }).count()).toBe(0);
  await search.fill('');
  await sidebar
    .getByText(/^JsonForms: /)
    .first()
    .waitFor();
  if (locale === 'bg' && !webcomponent) {
    await sidebar.screenshot({
      path: `test-results/example-sources-${family}-bg.png`,
      animations: 'disabled',
    });
  }
  await choose('all');
  await search.fill('cron');
  await sidebar.getByText('Spec: Cron control', { exact: true }).waitFor();
  expect(await expression.inputValue()).toBe('0 0 9 * * *');
  await choose('spec');
  if (locale === 'en' && !webcomponent) {
    await sidebar.screenshot({
      path: `test-results/example-sources-${family}.png`,
      animations: 'disabled',
    });
  }
  await search.fill('main');
  expect(await sidebar.getByText('Main', { exact: true }).count()).toBe(0);
  expect(errors).toEqual([]);
});
