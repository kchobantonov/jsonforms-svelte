import { demoEditorLabel } from '../helpers/demo-labels';
import assert from 'node:assert/strict';
import { demoTest } from '../helpers/demo';
import { expect } from 'vite-plus/test';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-code-editor/translations.json';

demoTest(
  'code-editor',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    const text = (en: string, bg: string) => (locale === 'bg' ? bg : en);
    await page.goto(
      `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-code-editor?use-webcomponent=${webcomponent}&drawer=false`,
    );
    // Turn on renderer-owned publication through the host's config editor.
    // This also verifies that the demo badge responds without a data edit.
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Config'), exact: true }).click();
    const configToolbar = page
      .getByRole('heading', { name: demoEditorLabel(locale, 'Config'), exact: true })
      .locator('..');
    const configInput = configToolbar.locator('..').locator('.inputarea, .native-edit-context');
    await configInput.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await configInput.evaluate((element) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData(
        'text/plain',
        '{"mode":"dark","jsonformsExtended":{"propagateErrors":true}}',
      );
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    });
    await configToolbar.getByRole('button').nth(1).click();
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: text('Structured document', 'Структуриран документ'),
        exact: true,
      })
      .click();
    const editor = page.locator('.jsonforms-monaco-editor:visible');
    await page.locator('.jsonforms-monaco-editor--dark:visible').waitFor();
    const input = editor.locator('.inputarea, .native-edit-context');
    await input.waitFor({ state: 'attached' });
    const paste = async (value: string) => {
      await input.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await input.evaluate((element, value) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', value);
        element.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
        );
      }, value);
    };
    const validityBadge = page.getByTestId('form-validation-errors');
    await validityBadge.waitFor({ state: 'hidden' });
    await page.evaluate(() => {
      const tracked = window as typeof window & { __demoPendingSeen?: boolean };
      tracked.__demoPendingSeen = false;
      const observer = new MutationObserver(() => {
        if (document.querySelector('[data-testid="form-validation-pending"]')) {
          tracked.__demoPendingSeen = true;
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
    await paste('{ broken');
    await validityBadge.waitFor();
    assert.equal(
      await page.evaluate(
        () => (window as typeof window & { __demoPendingSeen?: boolean }).__demoPendingSeen,
      ),
      true,
    );
    assert.equal((await validityBadge.innerText()).trim(), '1');
    await page.getByText(text('Invalid JSON', 'Невалиден JSON'), { exact: true }).waitFor();
    await page.keyboard.press('Escape');
    const normalBox = await editor.boundingBox();
    assert.ok(normalBox, 'Monaco has a normal rendered box');
    if (webcomponent) {
      assert.equal(
        await editor.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
        true,
      );
      assert.equal(
        await editor.evaluate(
          (element) =>
            (element.getRootNode() as ShadowRoot).querySelectorAll(
              '#jsonforms-monaco-editor-styles',
            ).length,
        ),
        1,
      );
    }
    await editor
      .getByRole('button', {
        name: text('Maximize code editor', 'Разгъване на редактора на код'),
      })
      .click();
    await editor.locator('.monaco-editor').waitFor();
    const maximizedBox = await editor.boundingBox();
    const viewport = page.viewportSize();
    const maximizedStyle = await editor.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        margin: style.margin,
        inset: style.inset,
        position: style.position,
        transform: style.transform,
      };
    });
    assert.ok(maximizedBox, 'Maximized Monaco has a rendered box');
    assert.ok(viewport, 'Demo page has a fixed viewport');
    assert.ok(
      Math.abs(maximizedBox.x) <= 1 && Math.abs(maximizedBox.y) <= 1,
      `Maximized editor origin: ${JSON.stringify(maximizedBox)} ${JSON.stringify(maximizedStyle)}`,
    );
    assert.ok(Math.abs(maximizedBox.width - viewport.width) <= 1, JSON.stringify(maximizedBox));
    assert.ok(Math.abs(maximizedBox.height - viewport.height) <= 1, JSON.stringify(maximizedBox));
    await editor
      .getByRole('button', {
        name: text('Restore code editor', 'Възстановяване на редактора на код'),
      })
      .click();
    const restoredBox = await editor.boundingBox();
    assert.ok(restoredBox, 'Restored Monaco has a rendered box');
    assert.ok(Math.abs(restoredBox.width - normalBox.width) <= 1);
    assert.ok(Math.abs(restoredBox.height - normalBox.height) <= 1);
    await editor
      .getByRole('button', {
        name: text('Maximize code editor', 'Разгъване на редактора на код'),
      })
      .click();
    await page.keyboard.press('Escape');
    await editor
      .getByRole('button', {
        name: text('Maximize code editor', 'Разгъване на редактора на код'),
      })
      .waitFor();
    const escapeRestoredBox = await editor.boundingBox();
    assert.ok(escapeRestoredBox, 'Escape restores the Monaco box');
    assert.ok(Math.abs(escapeRestoredBox.width - normalBox.width) <= 1);
    assert.ok(Math.abs(escapeRestoredBox.height - normalBox.height) <= 1);
    assert.ok(
      (await editor.locator('.view-lines').innerText())
        .replaceAll('\u00a0', ' ')
        .includes('{ broken'),
    );
    await paste('{"service":"warehouse","replicas":3}');
    await page
      .getByText(text('Invalid JSON', 'Невалиден JSON'), { exact: true })
      .waitFor({ state: 'hidden' });
    await validityBadge.waitFor({ state: 'hidden' });
    await page.getByTestId('form-validation-pending').waitFor({ state: 'hidden' });
    await paste('{"service":"warehouse","replicas":0}');
    await validityBadge.waitFor();
    assert.equal((await validityBadge.innerText()).trim(), '1');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page
      .locator('.monaco-editor:visible .view-lines')
      .filter({ hasText: '"replicas": 0' })
      .waitFor();
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: text('Structured document', 'Структуриран документ'),
        exact: true,
      })
      .click();
    await paste('{"service":"warehouse","replicas":2}');
    await validityBadge.waitFor({ state: 'hidden' });
    await page.getByTestId('form-validation-pending').waitFor({ state: 'hidden' });
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page
      .locator('.monaco-editor:visible .view-lines')
      .filter({ hasText: 'warehouse' })
      .waitFor();
    await page
      .locator('.monaco-editor:visible .view-lines')
      .filter({ hasText: '"replicas": 2' })
      .waitFor();
    assert.deepEqual(errors, [], `${family}/${locale}/${webcomponent}: browser errors`);
    console.log(`PASS code-editor ${family} ${locale} ${webcomponent ? 'webcomponent' : 'native'}`);
  },
  { timeout: 60_000 },
);

demoTest(
  'code-editor independent languages and row sizing',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-code-editor?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const labels = translations[locale];
    const editor = page.locator('.jsonforms-monaco-editor:visible');
    const text = editor.locator('.view-lines');
    const visibleCode = () => text.innerText().then((value) => value.replaceAll('\u00a0', ' '));
    const paste = async (value: string) => {
      const input = editor.locator('.inputarea, .native-edit-context');
      await input.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await input.evaluate((element, value) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', value);
        element.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
        );
      }, value);
    };
    const script = Array.from({ length: 8 }, (_, index) => `console.log(${index});`).join('\n');
    await expect.poll(visibleCode).toContain("const service = 'catalog';");
    const initialScriptHeight = (await editor.boundingBox())!.height;
    await paste(script);
    await expect.poll(visibleCode).toContain('console.log(7);');
    await expect
      .poll(() => editor.boundingBox().then((box) => box!.height))
      .toBeGreaterThan(initialScriptHeight);

    await page
      .getByRole('tab', { name: labels['featureNavigation.section2.label'], exact: true })
      .click();
    await expect.poll(visibleCode).toContain('Catalog service');
    const markupHeight = (await editor.boundingBox())!.height;
    const markup = '<main>\n  <h1>Updated</h1>\n  <p>Status</p>\n</main>';
    await paste(markup);
    await expect.poll(visibleCode).toContain('Updated');
    await expect.poll(() => editor.boundingBox().then((box) => box!.height)).toBe(markupHeight);

    await page
      .getByRole('tab', { name: labels['featureNavigation.section1.label'], exact: true })
      .click();
    await expect.poll(visibleCode).toContain('console.log(7);');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const lines = page.locator('.monaco-editor:visible .view-lines');
    await lines.waitFor();
    const data = JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' '));
    expect(data).toEqual({
      script,
      markup,
      document: { service: 'catalog', replicas: 2 },
    });
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
