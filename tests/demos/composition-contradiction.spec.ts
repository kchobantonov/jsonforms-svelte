import { mkdir } from 'node:fs/promises';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/scalar-contradiction/translations.json';

for (const layout of ['authored', 'generated'] as const) {
  demoTest(
    `composition-contradiction-${layout}`,
    async ({ page, family, locale, webcomponent, base }) => {
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
        `${base}/${family}/#/examples/scalar-contradiction-${layout}?use-webcomponent=${webcomponent}&drawer=false`,
      );
      const input = page.getByLabel(translations[locale]['scalarContradiction.value.label'], {
        exact: true,
      });
      await expect.poll(() => input.count()).toBe(1);
      expect(await input.inputValue()).toBe('7');
      expect(await input.getAttribute('min')).toBeNull();
      expect(await input.getAttribute('max')).toBeNull();
      await expect.poll(() => input.getAttribute('aria-invalid')).toBe('true');
      if (family !== 'flowbite') {
        const demoTab = page.getByRole('tab', {
          name: demoEditorLabel(locale, 'Demo'),
          exact: true,
        });
        expect(await demoTab.locator('button').count()).toBe(0);
        const badge = page.getByTestId('form-validation-errors');
        await badge.click();
        await expect.poll(() => page.locator('[data-error-summary]:visible').count()).toBe(1);
        await badge.click();
        await expect.poll(() => page.locator('[data-error-summary]:visible').count()).toBe(0);
      }
      if (locale === 'en' && !webcomponent) {
        await mkdir('test-results', { recursive: true });
        await page.screenshot({
          path: `test-results/composition-contradiction-${layout}-${family}.png`,
          fullPage: true,
        });
      }
      for (const value of [12, 3]) {
        await input.fill(String(value));
        await input.press('Tab');
        await expect.poll(() => input.getAttribute('aria-invalid')).toBe('true');
      }
      await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
      const lines = page.locator('.monaco-editor:visible .view-lines');
      await lines.waitFor();
      await expect
        .poll(async () => JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')).value)
        .toBe(3);
      expect(errors).toEqual([]);
    },
    { timeout: 20_000 },
  );
}
