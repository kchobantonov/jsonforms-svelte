import { mkdir } from 'node:fs/promises';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/recursive-composition/translations.json';

for (const variant of [
  { suffix: '', child: {} },
  { suffix: '-required', child: {} },
  { suffix: '-default', child: { label: 'New node' } },
] as const) {
  const required = variant.suffix === '-required';
  demoTest(
    `recursive-composition${variant.suffix}`,
    async ({ page, family, locale, webcomponent, base }) => {
      await page.addInitScript(
        ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
        { family, locale },
      );
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        `${base}/${family}/#/examples/recursive-composition${variant.suffix}?use-webcomponent=${webcomponent}&drawer=false`,
      );
      const label = page.getByLabel(translations[locale]['recursiveComposition.label.label'], {
        exact: true,
      });
      const addName = locale === 'bg' ? 'Добавяне на възел' : 'Add node';
      const add = page.getByRole('button', { name: addName, exact: true });
      const inputValues = () =>
        label.evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value));
      await expect.poll(() => label.count()).toBe(2);
      expect(await inputValues()).toEqual(['Root', 'Leaf']);
      await expect.poll(() => add.count()).toBe(1);
      const localError = add.locator('..').getByRole('alert');
      await expect.poll(() => localError.count()).toBe(required ? 1 : 0);
      if (locale === 'en' && !webcomponent) {
        await mkdir('test-results', { recursive: true });
        await page.screenshot({
          path: `test-results/recursive-composition${variant.suffix}-${family}.png`,
          fullPage: true,
        });
      }
      await add.click();
      await expect.poll(() => label.count()).toBe(3);
      expect(await inputValues()).toEqual([
        'Root',
        'Leaf',
        variant.suffix === '-default' ? 'New node' : '',
      ]);
      await expect.poll(() => add.count()).toBe(1);
      await expect.poll(() => localError.count()).toBe(required ? 1 : 0);
      await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
      const lines = page.locator('.monaco-editor:visible .view-lines');
      await lines.waitFor();
      await expect
        .poll(async () => JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')).node)
        .toEqual({ label: 'Root', next: { label: 'Leaf', next: variant.child } });
      expect(errors).toEqual([]);
    },
    { timeout: 20_000 },
  );
}
