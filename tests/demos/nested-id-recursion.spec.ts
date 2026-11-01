import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('nested-id-recursion', async ({ page, family, locale, webcomponent, base }) => {
  page.setDefaultTimeout(4_000);
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/nested-id-recursion?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const values = () =>
    page
      .locator('input:visible')
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value));
  await expect.poll(values).toContain('Leaf');
  const leafIndex = (await values()).indexOf('Leaf');
  await page.locator('input:visible').nth(leafIndex).fill('Edited leaf');
  await expect.poll(values).toContain('Edited leaf');
  await page.getByRole('button', { name: messages[locale]['recursive.create'] }).click();
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const lines = page.locator('.monaco-editor:visible .view-lines');
  await lines.waitFor();
  await expect
    .poll(async () => JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')))
    .toEqual({ node: { label: 'Root', child: { label: 'Edited leaf', child: {} } } });
  expect(errors).toEqual([]);
});
