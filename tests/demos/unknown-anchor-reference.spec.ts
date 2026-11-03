import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest('unknown-anchor-reference', async ({ page, family, locale, webcomponent, base }) => {
  page.setDefaultTimeout(4_000);
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
    `${base}/${family}/#/examples/unknown-anchor-reference?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const diagnostic = page.locator('[data-schema-reference-error]');
  await expect.poll(() => diagnostic.count()).toBe(1);
  await expect
    .poll(() => diagnostic.textContent())
    .toContain('https://example.test/root.json#missing');
  await expect
    .poll(() => diagnostic.textContent())
    .toContain(locale === 'bg' ? 'Неразрешена' : 'Unresolved');
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const lines = page.locator('.monaco-editor:visible .view-lines');
  await lines.waitFor();
  await expect
    .poll(async () => JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')))
    .toEqual({ value: 'Kept' });
  expect(errors).toEqual([]);
});
