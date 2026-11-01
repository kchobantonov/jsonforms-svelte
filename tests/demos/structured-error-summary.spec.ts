import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest(
  'structured-error-summary',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-json-inference?use-webcomponent=${webcomponent}&drawer=false`,
    );
    async function apply(name: string, value: unknown) {
      await page.getByRole('tab', { name: demoEditorLabel(locale, name), exact: true }).click();
      const toolbar = page
        .getByRole('heading', { name: demoEditorLabel(locale, name), exact: true })
        .locator('..');
      const editor = toolbar.locator('..').locator('.monaco-editor');
      const input = editor.locator('.inputarea, .native-edit-context');
      await input.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await input.evaluate(
        (element, text) => {
          const clipboardData = new DataTransfer();
          clipboardData.setData('text/plain', text);
          element.dispatchEvent(
            new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
          );
        },
        JSON.stringify(value, null, 2),
      );
      await editor.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      await toolbar.getByRole('button').nth(1).click();
    }

    await apply('Schema', {
      type: 'array',
      items: {
        type: 'object',
        properties: { message: { type: 'string', minLength: 3, title: 'Message' } },
      },
    });
    await apply('UI Schema', {
      type: 'Control',
      scope: '#',
      options: { table: true, hideArraySummaryValidation: false },
    });
    await apply('Config', {});
    const data = Array.from({ length: 7 }, () => ({ message: 'x' }));
    await apply('Data', data);
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page.setViewportSize({ width: 390, height: 700 });
    const notice = page.locator('[data-array-summary]:visible').first();
    await notice.evaluate((element) =>
      element.scrollIntoView({ block: 'center', behavior: 'instant' }),
    );
    await expect
      .poll(() => notice.locator('[data-array-summary-message]').innerText())
      .toBe(messages[locale]['validation.childrenErrors']);
    await expect
      .poll(() =>
        notice.getByRole('button', { name: messages[locale]['collection.firstError'] }).isVisible(),
      )
      .toBe(true);
    expect(await page.locator('[data-error-summary]:visible').count()).toBe(0);
    await expect
      .poll(async () => {
        const box = await notice.boundingBox();
        return (
          box !== null &&
          box.x >= 0 &&
          box.x + box.width <= 391 &&
          box.y >= 0 &&
          box.y + box.height <= 701
        );
      })
      .toBe(true);
    const pageTwo = messages[locale]['collection.errorPage']
      .replace('{page}', '2')
      .replace('{count}', '2');
    await page.getByRole('button', { name: pageTwo, exact: true }).click();
    await expect.poll(() => page.locator('tbody tr:visible').count()).toBe(2);
    await notice.getByRole('button', { name: messages[locale]['collection.firstError'] }).click();
    await expect.poll(() => page.locator('tbody tr:visible').count()).toBe(5);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const text = page.locator('.monaco-editor:visible .view-lines');
    await expect
      .poll(async () => JSON.parse((await text.innerText()).replaceAll('\u00a0', ' ')))
      .toEqual(data);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
