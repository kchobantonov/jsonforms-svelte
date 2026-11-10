import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest(
  'structured-mixed-summary',
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
        (element, value) => {
          const clipboardData = new DataTransfer();
          clipboardData.setData('text/plain', value);
          element.dispatchEvent(
            new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
          );
        },
        JSON.stringify(value, null, 2),
      );
      await editor.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      await toolbar.getByRole('button').nth(1).click();
    }

    const properties = Object.fromEntries(
      Array.from({ length: 5 }, (_, index) => [
        `field${index + 1}`,
        { type: 'string', minLength: 2, title: `Field ${index + 1}` },
      ]),
    );
    await apply('Schema', { type: ['object', 'null'], properties });
    await apply('UI Schema', {
      type: 'Control',
      scope: '#',
      options: { structuredLayout: 'tree' },
    });
    await apply('Config', {
      jsonformsExtended: { showValidationIndicator: true, showValidationIndicatorCount: true },
    });
    const data = Object.fromEntries(Object.keys(properties).map((key) => [key, 'x']));
    await apply('Data', data);
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page.setViewportSize({ width: 390, height: 700 });
    const trigger = page
      .locator('[data-mixed-frame-header] [data-container-validation-indicator]')
      .first();
    await trigger.evaluate((element) =>
      element.scrollIntoView({ block: 'center', behavior: 'instant' }),
    );
    await trigger.click();
    const summary = page.locator('[data-error-summary]:visible');
    await expect.poll(() => summary.locator('li').count()).toBe(3);
    if (family === 'shadcn') {
      const popup = summary.locator('xpath=ancestor::*[@role="dialog"][1]');
      expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
        webcomponent,
      );
      expect(await popup.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
        'rgba(0, 0, 0, 0)',
      );
      await page.mouse.move(0, 0);
      await page.waitForTimeout(500);
      await expect.poll(() => summary.locator('li').count()).toBe(3);
    }
    await expect.poll(() => summary.innerText()).toContain('Field 1');
    const showMore = summary.getByRole('button', {
      name: messages[locale]['validation.showMore'].replace('{count}', '2'),
      exact: true,
    });
    await showMore.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => summary.locator('li').count()).toBe(5);
    await expect.poll(() => summary.innerText()).toContain('Field 5');
    await expect
      .poll(async () => {
        const box = await summary.boundingBox();
        return box !== null && box.x >= 0 && box.x + box.width <= 391;
      })
      .toBe(true);
    const showLess = summary.getByRole('button', {
      name: messages[locale]['validation.showLess'],
      exact: true,
    });
    await showLess.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => summary.locator('li').count()).toBe(3);
    await page.mouse.move(0, 0);
    await trigger.press('Escape');
    await expect.poll(() => summary.count()).toBe(0);
    const dataTab = page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true });
    await dataTab.click();
    await expect.poll(() => dataTab.getAttribute('aria-selected')).toBe('true');
    const text = page.locator('.monaco-editor:visible .view-lines');
    await expect
      .poll(async () => JSON.parse((await text.innerText()).replaceAll('\u00a0', ' ')))
      .toEqual(data);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
