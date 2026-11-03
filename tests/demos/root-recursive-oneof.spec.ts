import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import sourceData from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-recursive-tree/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-recursive-tree/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'root-recursive-oneof',
  async ({ page, family, locale, webcomponent, base }) => {
    page.setDefaultTimeout(3_000);
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
      `${base}/${family}/#/examples/root-recursive-oneof?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await expect
      .poll(() =>
        page
          .locator('input:visible')
          .evaluateAll((nodes) =>
            nodes.some((node) => (node as HTMLInputElement).value === 'Documents'),
          ),
      )
      .toBe(true);
    const hasInputValue = (value: string) =>
      page
        .locator('input:visible')
        .evaluateAll(
          (nodes, expected) => nodes.some((node) => (node as HTMLInputElement).value === expected),
          value,
        );
    if (!(await hasInputValue('Welcome'))) {
      await page.locator('[data-array-avatar]:visible').first().click();
    }
    await expect
      .poll(() =>
        page
          .locator('input:visible')
          .evaluateAll((nodes) =>
            nodes.some((node) => (node as HTMLInputElement).value === 'Welcome'),
          ),
      )
      .toBe(true);
    const childrenLabel = translations[locale]['tree.children.label'];
    const addName =
      locale === 'bg' ? `Бутон за добавяне към ${childrenLabel}` : `Add to ${childrenLabel} button`;
    await page.getByRole('button', { name: addName, exact: true }).first().click();
    await expect
      .poll(() => page.getByText(messages[locale]['oneOf.chooseKind'], { exact: true }).count())
      .toBeGreaterThan(0);
    const placeholder = locale === 'bg' ? 'Изберете опция' : 'Select an option';
    const folder = translations[locale]['tree.folder.label'];
    if (family === 'flowbite') {
      await page.locator('select:visible').last().selectOption('1');
    } else if (family === 'shadcn') {
      await page.getByText(placeholder, { exact: true }).last().click();
      await page.getByRole('option', { name: folder, exact: true }).click();
    } else {
      await page
        .locator(`input[placeholder="${placeholder}"]:visible`)
        .last()
        .locator('..')
        .locator('button')
        .last()
        .click();
      await page.getByRole('option', { name: folder, exact: true }).click();
    }
    const dialog = page.getByRole('dialog');
    await expect.poll(() => dialog.count()).toBe(1);
    await dialog.getByRole('button', { name: locale === 'bg' ? 'Да' : 'Yes', exact: true }).click();
    await expect.poll(() => dialog.count()).toBe(0);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const lines = page.locator('.monaco-editor:visible .view-lines');
    await lines.waitFor();
    const expected = structuredClone(sourceData.populated) as {
      kind: string;
      name: string;
      children: Array<Record<string, unknown>>;
    };
    expected.children[0].name = '';
    expected.children.push({ kind: 'folder', children: [] });
    await expect
      .poll(async () => JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')))
      .toEqual(expected);
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);
