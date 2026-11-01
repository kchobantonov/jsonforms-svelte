import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest('dynamic-reference', async ({ page, family, locale, webcomponent, base }) => {
  page.setDefaultTimeout(4_000);
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/dynamic-reference?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const diagnostic = page.locator('[data-schema-reference-error]');
  await expect.poll(() => diagnostic.count()).toBe(1);
  await expect.poll(() => diagnostic.textContent()).toContain('#node');
  await expect
    .poll(() => diagnostic.textContent())
    .toContain(locale === 'bg' ? 'Динамичната' : 'Dynamic');
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const lines = page.locator('.monaco-editor:visible .view-lines');
  await lines.waitFor();
  await expect
    .poll(async () => JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')))
    .toEqual({ value: { label: 'Leaf' } });
  expect(errors).toEqual([]);
});
