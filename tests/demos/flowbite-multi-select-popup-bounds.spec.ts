import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';

const choices = Array.from({ length: 100 }, (_, index) => `Option ${index}`);

demoTest(
  'flowbite-multi-select-popup-bounds',
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
        multiple: { type: 'array', items: { type: 'string', enum: choices }, uniqueItems: true },
      },
    });
    await apply('UI Schema', {
      type: 'Control',
      scope: '#/properties/multiple',
      label: 'Multiple',
      options: { variant: 'multi-select' },
    });
    await apply('Data', {});
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page.setViewportSize({ width: 900, height: 360 });
    const trigger = page.getByRole('listbox', { name: 'Multiple', exact: true });
    await trigger.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await trigger.click();
    const dropdown = trigger.locator(':scope > [role="presentation"]');
    await expect.poll(() => dropdown.locator(':scope > [role="presentation"]').count()).toBe(100);
    await expect
      .poll(async () => {
        const bounds = await dropdown.boundingBox();
        return bounds !== null && bounds.y >= 0 && bounds.y + bounds.height <= 360;
      })
      .toBe(true);
    expect(await dropdown.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
      true,
    );
    expect(await dropdown.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    const last = dropdown.locator(':scope > [role="presentation"]').last();
    await last.scrollIntoViewIfNeeded();
    await expect.poll(() => dropdown.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await last.click();
    await expect.poll(() => trigger.textContent()).toContain('Option 99');
    await page.mouse.click(880, 20);
    await expect.poll(() => dropdown.count()).toBe(0);
    await trigger.focus();
    await trigger.press('Enter');
    await expect.poll(() => dropdown.locator(':scope > [role="presentation"]').count()).toBe(100);
    await trigger.evaluate((element) => {
      for (let index = 0; index < 98; index++)
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    const active = dropdown.locator('[data-active="true"]');
    await expect.poll(() => active.textContent()).toBe('Option 98');
    await expect
      .poll(async () => {
        const item = await active.boundingBox();
        const list = await dropdown.boundingBox();
        return !!item && !!list && item.y >= list.y && item.y + item.height <= list.y + list.height;
      })
      .toBe(true);
    await trigger.press('Enter');
    await expect.poll(() => trigger.textContent()).toContain('Option 98');
    expect(errors).toEqual([]);
  },
  { families: ['flowbite'], timeout: 60_000 },
);
