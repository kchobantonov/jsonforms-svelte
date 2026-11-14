import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest(
  'conditional-recursive-reference',
  async ({ page, family, locale, webcomponent, base }) => {
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
      `${base}/${family}/#/examples/conditional-recursive-reference?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const values = () =>
      page
        .locator('input:visible')
        .evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value));
    await expect.poll(values).toContain('Parent VAT');
    await expect.poll(values).toContain('Child nick');
    expect(await values()).not.toContain('parent hidden');
    expect(await values()).not.toContain('child hidden');
    const index = (await values()).indexOf('Child nick');
    await page.locator('input:visible').nth(index).fill('Edited child');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const lines = page.locator('.monaco-editor:visible .view-lines');
    await lines.waitFor();
    await expect
      .poll(async () => JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')))
      .toEqual({
        value: {
          kind: 'business',
          vat: 'Parent VAT',
          nickname: 'parent hidden',
          child: { kind: 'personal', nickname: 'Edited child', vat: 'child hidden' },
        },
      });
    expect(errors).toEqual([]);
  },
);
