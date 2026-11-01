import type { Page } from 'playwright';
import { expect } from 'vite-plus/test';
import { demoEditorLabel } from './demo-labels';

export type DemoEditorName = 'Schema' | 'UI Schema' | 'Data' | 'Config';

/** Replace and apply a demo editor's JSON without relying on the system clipboard. */
export async function applyDemoEditor(
  page: Page,
  locale: 'en' | 'bg',
  name: DemoEditorName,
  value: unknown,
  options: { verifyVisibleText?: boolean } = {},
) {
  const label = demoEditorLabel(locale, name);
  const tab = page.getByRole('tab', { name: label, exact: true });
  await tab.click();
  await expect.poll(() => tab.getAttribute('aria-selected')).toBe('true');
  const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
  const input = toolbar.locator('..').locator('.inputarea, .native-edit-context');
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
  if (options.verifyVisibleText !== false) {
    const expected = JSON.stringify(value, null, 2)
      .split('\n')
      .slice(0, 8)
      .join('')
      .replace(/\s/g, '');
    await expect
      .poll(async () =>
        (await toolbar.locator('..').locator('.view-lines').innerText()).replace(/\s/g, ''),
      )
      .toContain(expected);
  } else {
    await toolbar
      .locator('..')
      .locator('.monaco-editor')
      .evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
  }
  await toolbar.getByRole('button').nth(1).click();
}
