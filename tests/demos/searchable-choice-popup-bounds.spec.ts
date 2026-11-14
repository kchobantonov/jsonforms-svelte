import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { touchScrollToEnd } from '../helpers/touch-scroll';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

const choices = Array.from({ length: 100 }, (_, index) => `Option ${index}`);

demoTest(
  'searchable-choice-popup-bounds',
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
      `${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const apply = async (name: string, value: unknown) => {
      const label = demoEditorLabel(locale, name);
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
    };
    await apply('Schema', {
      type: 'object',
      properties: {
        choice: { type: 'string', enum: choices },
        multiple: { type: 'array', items: { type: 'string', enum: choices }, uniqueItems: true },
      },
    });
    await apply('UI Schema', {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/choice',
          label: 'Choice',
          options: { autocomplete: true },
        },
        {
          type: 'Control',
          scope: '#/properties/multiple',
          label: 'Multiple',
          options: { variant: 'multi-select' },
        },
      ],
    });
    await apply('Data', {});
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page.setViewportSize({ width: 390, height: 450 });
    const trigger = page.getByRole('combobox', { name: 'Choice', exact: true });
    await trigger.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await trigger.click();
    if (family === 'skeleton') {
      const last = page.getByRole('option', { name: 'Option 99', exact: true });
      const popup = last.locator(
        'xpath=ancestor::*[@data-scope="combobox" and @data-part="content"][1]',
      );
      await expect.poll(() => popup.getByRole('option').count()).toBe(100);
      await expect
        .poll(async () => {
          const bounds = await popup.boundingBox();
          return !!bounds && bounds.y >= 0 && bounds.y + bounds.height <= 450;
        })
        .toBe(true);
      expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
        webcomponent,
      );
      expect(await popup.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
        true,
      );
      await popup.hover();
      await page.mouse.wheel(0, 10000);
      await expect
        .poll(async () => {
          const item = await last.boundingBox();
          const bounds = await popup.boundingBox();
          return (
            !!item &&
            !!bounds &&
            item.y >= bounds.y &&
            item.y + item.height <= bounds.y + bounds.height
          );
        })
        .toBe(true);
      await last.click();
      await expect.poll(() => trigger.inputValue()).toBe('Option 99');
      await trigger.click();
      await popup.evaluate((element) => {
        element.scrollTop = 0;
      });
      const cdp = await page.context().newCDPSession(page);
      await touchScrollToEnd(cdp, popup);
      await expect.poll(() => popup.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      await last.scrollIntoViewIfNeeded();
      await expect
        .poll(async () => {
          const item = await last.boundingBox();
          const list = await popup.boundingBox();
          return (
            !!item && !!list && item.y >= list.y && item.y + item.height <= list.y + list.height
          );
        })
        .toBe(true);
      await last.tap();
      await cdp.detach();
      await trigger.click();
      await trigger.press('End');
      await expect.poll(() => last.getAttribute('data-highlighted')).not.toBeNull();
      await trigger.press('Enter');
      await expect.poll(() => popup.count()).toBe(0);
      const multiple = page.getByRole('combobox', { name: 'Multiple', exact: true });
      await multiple.evaluate((element) => element.scrollIntoView({ block: 'center' }));
      await multiple.click();
      const multipleLast = page.getByRole('option', { name: 'Option 99', exact: true });
      const multiplePopup = multipleLast.locator(
        'xpath=ancestor::*[@data-scope="combobox" and @data-part="content"][1]',
      );
      await expect.poll(() => multiplePopup.getByRole('option').count()).toBe(100);
      await expect
        .poll(async () => {
          const bounds = await multiplePopup.boundingBox();
          return !!bounds && bounds.y >= 0 && bounds.y + bounds.height <= 450;
        })
        .toBe(true);
      expect(
        await multiplePopup.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
      ).toBe(webcomponent);
      await multiplePopup.hover();
      await page.mouse.wheel(0, 10000);
      await expect
        .poll(async () => {
          const item = await multipleLast.boundingBox();
          const bounds = await multiplePopup.boundingBox();
          return (
            !!item &&
            !!bounds &&
            item.y >= bounds.y &&
            item.y + item.height <= bounds.y + bounds.height
          );
        })
        .toBe(true);
      await multipleLast.click();
      await expect
        .poll(() =>
          page
            .getByRole('button', {
              name: messages[locale]['arrayChoices.remove'].replace('{label}', 'Option 99'),
              exact: true,
            })
            .count(),
        )
        .toBe(1);
      expect(errors).toEqual([]);
      return;
    }
    const popup = page.getByRole('dialog');
    const list = popup.getByRole('listbox', { name: 'Choice', exact: true });
    const last = list.getByRole('option', { name: 'Option 99', exact: true });
    await expect.poll(() => list.getByRole('option').count()).toBe(100);
    await expect
      .poll(async () => {
        const bounds = await popup.boundingBox();
        return !!bounds && bounds.y >= 0 && bounds.y + bounds.height <= 450;
      })
      .toBe(true);
    expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    expect(await list.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
      true,
    );
    await list.hover();
    await page.mouse.wheel(0, 10000);
    await expect.poll(() => list.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect
      .poll(async () => {
        const item = await last.boundingBox();
        const bounds = await list.boundingBox();
        return (
          !!item &&
          !!bounds &&
          item.y >= bounds.y &&
          item.y + item.height <= bounds.y + bounds.height
        );
      })
      .toBe(true);
    await last.click();
    await expect.poll(() => trigger.textContent()).toContain('Option 99');
    await trigger.click();
    await list.evaluate((element) => {
      element.scrollTop = 0;
    });
    const cdp = await page.context().newCDPSession(page);
    await touchScrollToEnd(cdp, list);
    await expect.poll(() => list.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await last.scrollIntoViewIfNeeded();
    await expect
      .poll(async () => {
        const item = await last.boundingBox();
        const bounds = await list.boundingBox();
        return (
          !!item &&
          !!bounds &&
          item.y >= bounds.y &&
          item.y + item.height <= bounds.y + bounds.height
        );
      })
      .toBe(true);
    await last.tap();
    await cdp.detach();
    await expect.poll(() => popup.count()).toBe(0);
    await trigger.click();
    await popup.getByRole('searchbox').press('ArrowDown');
    await page.keyboard.press('End');
    await expect
      .poll(() =>
        last.evaluate(
          (element) => element === (element.getRootNode() as Document | ShadowRoot).activeElement,
        ),
      )
      .toBe(true);
    await page.keyboard.press('Enter');
    await expect.poll(() => popup.count()).toBe(0);
    expect(errors).toEqual([]);
  },
  { families: ['flowbite', 'skeleton'], hasTouch: true, timeout: 60_000 },
);
