import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';

for (const example of [
  'supplied-reference',
  'anonymous-supplied-reference',
  'nested-supplied-reference',
])
  demoTest(example, async ({ page, family, locale, webcomponent, base }) => {
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
      `${base}/${family}/#/examples/${example}?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const values = () =>
      page
        .locator('input:visible')
        .evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value));
    await expect.poll(values).toContain('Ada');
    const nameIndex = (await values()).indexOf('Ada');
    await page.locator('input:visible').nth(nameIndex).fill('Grace');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const lines = page.locator('.monaco-editor:visible .view-lines');
    await lines.waitFor();
    await expect
      .poll(async () => JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')))
      .toEqual({ profile: { name: 'Grace' } });
    expect(errors).toEqual([]);
  });
