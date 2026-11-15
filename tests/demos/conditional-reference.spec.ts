import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';

for (const example of ['conditional-local-reference', 'conditional-supplied-reference'])
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
    await expect.poll(values).toContain('BG123');
    await expect.poll(values).toContain('REF-1');
    expect(await values()).not.toContain('kept');
    let index = (await values()).indexOf('BG123');
    await page.locator('input:visible').nth(index).fill('BG456');
    await expect.poll(values).toContain('BG456');
    index = (await values()).indexOf('business');
    await page.locator('input:visible').nth(index).fill('personal');
    await expect.poll(values).toContain('kept');
    await expect.poll(values).toContain('REF-1');
    expect(await values()).not.toContain('BG456');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const lines = page.locator('.monaco-editor:visible .view-lines');
    await lines.waitFor();
    await expect
      .poll(async () => JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')))
      .toEqual({ value: { kind: 'personal', vat: 'BG456', nickname: 'kept', reference: 'REF-1' } });
    expect(errors).toEqual([]);
  });
