import { mkdir } from 'node:fs/promises';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/object-contradiction/translations.json';

for (const layout of ['authored', 'generated'] as const) {
  demoTest(
    `composition-object-contradiction-${layout}`,
    async ({ page, family, locale, webcomponent, base }) => {
      await page.addInitScript(
        ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
        { family, locale },
      );
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        `${base}/${family}/#/examples/object-contradiction-${layout}?use-webcomponent=${webcomponent}&drawer=false`,
      );
      const labels = translations[locale];
      const name = page.getByLabel(labels['objectContradiction.name.label'], { exact: true });
      const minimum = page.getByLabel(labels['objectContradiction.minimumCode.label'], {
        exact: true,
      });
      const maximum = page.getByLabel(labels['objectContradiction.maximumCode.label'], {
        exact: true,
      });
      await expect.poll(() => name.count()).toBe(1);
      await expect.poll(() => minimum.count()).toBe(1);
      await expect.poll(() => maximum.count()).toBe(1);
      expect(await name.inputValue()).toBe('Item');
      expect(await minimum.inputValue()).toBe('ABCD');
      expect(await maximum.inputValue()).toBe('ABCD');
      await expect.poll(() => minimum.getAttribute('aria-invalid')).toBe('true');
      await expect.poll(() => maximum.getAttribute('aria-invalid')).toBe('true');
      if (locale === 'en' && !webcomponent) {
        await mkdir('test-results', { recursive: true });
        await page.screenshot({
          path: `test-results/composition-object-contradiction-${layout}-${family}.png`,
          fullPage: true,
        });
      }
      await minimum.fill('ABCDEFG');
      await minimum.press('Tab');
      await expect.poll(() => maximum.inputValue()).toBe('ABCDEFG');
      await expect.poll(() => minimum.getAttribute('aria-invalid')).toBe('true');
      await expect.poll(() => maximum.getAttribute('aria-invalid')).toBe('true');
      await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
      const lines = page.locator('.monaco-editor:visible .view-lines');
      await lines.waitFor();
      await expect
        .poll(async () => JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')).element)
        .toEqual({ name: 'Item', code: 'ABCDEFG' });
      expect(errors).toEqual([]);
    },
    { timeout: 20_000 },
  );
}
