import { mkdir } from 'node:fs/promises';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import sourceData from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-recursive-tree/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-recursive-tree/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'recursive-oneof',
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
      `${base}/${family}/#/examples/recursive-oneof?use-webcomponent=${webcomponent}&drawer=false`,
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
    const childrenLabel = translations[locale]['tree.children.label'];
    const addName =
      locale === 'bg' ? `Бутон за добавяне към ${childrenLabel}` : `Add to ${childrenLabel} button`;
    const add = page.getByRole('button', { name: addName, exact: true });
    await expect.poll(() => add.count()).toBeGreaterThan(0);
    if (locale === 'en' && !webcomponent) {
      await mkdir('test-results', { recursive: true });
      await page.screenshot({
        path: `test-results/recursive-oneof-${family}.png`,
        fullPage: true,
      });
    }
    await add.first().click();
    await expect
      .poll(() => page.getByText(messages[locale]['oneOf.chooseKind'], { exact: true }).count())
      .toBeGreaterThan(0);
    if (locale === 'en' && !webcomponent) {
      await page.screenshot({
        path: `test-results/recursive-oneof-added-${family}.png`,
        fullPage: true,
      });
    }
    const placeholder = locale === 'bg' ? 'Изберете опция' : 'Select an option';
    const folder = translations[locale]['tree.folder.label'];
    const chooseFolder = async () => {
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
    };
    const dialog = page.getByRole('dialog');
    await chooseFolder();
    await expect.poll(() => dialog.count()).toBe(1);
    await dialog.getByRole('button', { name: locale === 'bg' ? 'Не' : 'No', exact: true }).click();
    await expect.poll(() => dialog.count()).toBe(0);
    await chooseFolder();
    await expect.poll(() => dialog.count()).toBe(1);
    await dialog.getByRole('button', { name: locale === 'bg' ? 'Да' : 'Yes', exact: true }).click();
    await expect.poll(() => dialog.count()).toBe(0);
    if (locale === 'en' && !webcomponent) {
      await page.screenshot({
        path: `test-results/recursive-oneof-folder-${family}.png`,
        fullPage: true,
      });
    }
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const lines = page.locator('.monaco-editor:visible .view-lines');
    await lines.waitFor();
    const expected = structuredClone(sourceData.populated);
    expected.children[0].name = '';
    const current = () =>
      lines.innerText().then((text) => JSON.parse(text.replaceAll('\u00a0', ' ')).populated);
    await expect.poll(async () => (await current()).children.length).toBe(3);
    const populated = await current();
    expect(populated.kind).toBe('folder');
    expect(populated.name).toBe('Documents');
    expect(populated.children.slice(0, 2)).toEqual(expected.children);
    expect(populated.children[2]).toEqual({ kind: 'folder', children: [] });
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);

demoTest(
  'recursive-oneof-external-replacement',
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
      `${base}/${family}/#/examples/recursive-oneof?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const hasInputValue = (value: string) =>
      page
        .locator('input:visible')
        .evaluateAll(
          (nodes, expected) => nodes.some((node) => (node as HTMLInputElement).value === expected),
          value,
        );
    await expect.poll(() => hasInputValue('Documents')).toBe(true);
    const applyData = async (value: unknown) => {
      const label = demoEditorLabel(locale, 'Data');
      await page.getByRole('tab', { name: label, exact: true }).click();
      const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
      const editor = toolbar.locator('..').locator('.monaco-editor');
      const input = editor.locator('.inputarea, .native-edit-context');
      await input.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await input.evaluate((element, text) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', text);
        element.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
        );
      }, JSON.stringify(value));
      await editor.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      await toolbar.getByRole('button').nth(1).click();
      await page
        .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
        .click();
    };
    const readData = async () => {
      await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
      const lines = page.locator('.monaco-editor:visible .view-lines');
      await lines.waitFor();
      return JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' '));
    };
    await applyData({});
    await expect.poll(() => hasInputValue('Documents')).toBe(false);
    await expect
      .poll(() => page.getByText(translations[locale]['tree.children.label']).count())
      .toBe(0);
    const placeholder = locale === 'bg' ? 'Изберете опция' : 'Select an option';
    if (family === 'flowbite') {
      await expect.poll(() => page.locator('select:visible').last().inputValue()).toBe('');
    } else if (family === 'shadcn') {
      await expect
        .poll(() => page.getByText(placeholder, { exact: true }).count())
        .toBeGreaterThan(0);
    } else {
      await expect
        .poll(() => page.locator(`input[placeholder="${placeholder}"]:visible`).last().inputValue())
        .toBe('');
    }
    expect(await readData()).toEqual({});
    const restored = { populated: { kind: 'file', name: 'Restored', content: 'Text' } };
    await applyData(restored);
    await expect.poll(() => hasInputValue('Restored')).toBe(true);
    await expect.poll(() => hasInputValue('Documents')).toBe(false);
    expect(await readData()).toEqual(restored);
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);

demoTest(
  'recursive-oneof-nested-folder',
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
      `${base}/${family}/#/examples/recursive-oneof?use-webcomponent=${webcomponent}&drawer=false`,
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
    // The second row of Documents is the existing Archive folder.
    await page.locator('[data-array-avatar]:visible').nth(1).click();
    const childrenLabel = translations[locale]['tree.children.label'];
    const addName =
      locale === 'bg' ? `Бутон за добавяне към ${childrenLabel}` : `Add to ${childrenLabel} button`;
    const add = page.getByRole('button', { name: addName, exact: true });
    await expect.poll(() => add.count()).toBe(2);
    await add.last().click();
    await expect
      .poll(() => page.getByText(messages[locale]['oneOf.chooseKind'], { exact: true }).count())
      .toBeGreaterThan(0);
    const placeholder = locale === 'bg' ? 'Изберете опция' : 'Select an option';
    const file = translations[locale]['tree.file.label'];
    if (family === 'flowbite') {
      await page.locator('select:visible').last().selectOption('0');
    } else if (family === 'shadcn') {
      await page.getByText(placeholder, { exact: true }).last().click();
      await page.getByRole('option', { name: file, exact: true }).click();
    } else {
      await page
        .locator(`input[placeholder="${placeholder}"]:visible`)
        .last()
        .locator('..')
        .locator('button')
        .last()
        .click();
      await page.getByRole('option', { name: file, exact: true }).click();
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
    (expected.children[1].children as unknown[]).push({ kind: 'file' });
    await expect
      .poll(async () => JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')).populated)
      .toEqual(expected);
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);

demoTest(
  'recursive-oneof-nested-branch-change',
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
      `${base}/${family}/#/examples/recursive-oneof?use-webcomponent=${webcomponent}&drawer=false`,
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
    await page.locator('[data-array-avatar]:visible').nth(1).click();
    const file = translations[locale]['tree.file.label'];
    const folder = translations[locale]['tree.folder.label'];
    const placeholder = locale === 'bg' ? 'Изберете опция' : 'Select an option';
    const chooseFile = async () => {
      if (family === 'flowbite') {
        await page
          .locator('select:visible:has(option:checked[value="1"])')
          .last()
          .selectOption('0');
      } else if (family === 'shadcn') {
        await page
          .locator('button[aria-haspopup="listbox"][id^="#"]:not([id*="/properties/kind"]):visible')
          .filter({ hasText: folder })
          .last()
          .click();
        await page.getByRole('option', { name: file, exact: true }).click();
      } else {
        const inputs = page.locator(`input[placeholder="${placeholder}"]:visible`);
        const values = await inputs.evaluateAll((nodes) =>
          nodes.map((node) => (node as HTMLInputElement).value),
        );
        const index = values.lastIndexOf(folder);
        expect(index).toBeGreaterThan(-1);
        await inputs.nth(index).locator('..').locator('button').last().click();
        await page.getByRole('option', { name: file, exact: true }).click();
      }
    };
    const dialog = page.getByRole('dialog');
    await chooseFile();
    await expect.poll(() => dialog.count()).toBe(1);
    await dialog.getByRole('button', { name: locale === 'bg' ? 'Не' : 'No', exact: true }).click();
    await expect.poll(() => dialog.count()).toBe(0);
    await expect
      .poll(() =>
        page
          .locator('input:visible')
          .evaluateAll((nodes) =>
            nodes.some((node) => (node as HTMLInputElement).value === 'Archive'),
          ),
      )
      .toBe(true);
    await chooseFile();
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
    expected.children[1] = { kind: 'file' };
    await expect
      .poll(async () => JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')).populated)
      .toEqual(expected);
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);

demoTest(
  'recursive-oneof-clear-slot',
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
      `${base}/${family}/#/examples/recursive-oneof?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const addName =
      locale === 'bg'
        ? `Бутон за добавяне към ${translations[locale]['tree.children.label']}`
        : `Add to ${translations[locale]['tree.children.label']} button`;
    await page.getByRole('button', { name: addName, exact: true }).first().click();
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
    let nestedOneOf;
    if (family === 'flowbite') {
      nestedOneOf = page.locator('select:visible:has(option:checked[value="1"])').last();
    } else if (family === 'shadcn') {
      nestedOneOf = page
        .locator('button[aria-haspopup="listbox"][id^="#"]:not([id*="/properties/kind"]):visible')
        .last();
    } else {
      const inputs = page.locator(`input[placeholder="${placeholder}"]:visible`);
      const values = await inputs.evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLInputElement).value),
      );
      const index = values.lastIndexOf(folder);
      expect(index).toBeGreaterThan(-1);
      nestedOneOf = inputs.nth(index);
    }
    await expect
      .poll(async () =>
        family === 'flowbite'
          ? nestedOneOf.inputValue()
          : family === 'shadcn'
            ? (await nestedOneOf.textContent())?.trim()
            : nestedOneOf.inputValue(),
      )
      .toBe(family === 'flowbite' ? '1' : folder);
    const wrapper = nestedOneOf.locator('..');
    const clear = (family === 'flowbite' ? wrapper.locator('..') : wrapper).locator(
      `button[aria-label="${messages[locale]['oneOf.clear']}"]`,
    );
    await wrapper.hover();
    await clear.click();
    await expect.poll(() => dialog.count()).toBe(1);
    await dialog.getByRole('button', { name: locale === 'bg' ? 'Да' : 'Yes', exact: true }).click();
    await expect.poll(() => dialog.count()).toBe(0);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const lines = page.locator('.monaco-editor:visible .view-lines');
    await lines.waitFor();
    const expected = structuredClone(sourceData.populated);
    expected.children[0].name = '';
    await expect
      .poll(async () => JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' ')).populated)
      .toEqual({ ...expected, children: [...expected.children, {}] });
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);
