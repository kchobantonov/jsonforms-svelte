import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/data.json';

demoTest(
  'native-temporal-draft-replacement',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/spec-temporal-controls?drawer=false`);
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    for (const [kind, partial] of [
      ['date', '2026-10-1'],
      ['time', '09:3'],
      ['datetime', '2026-10-1'],
    ] as const) {
      const input = page.locator(
        `[id=${JSON.stringify(`#/properties/schemaBased/properties/${kind}-input`)}]`,
      );
      const before = await input.inputValue();
      await input.fill(partial);
      await expect.poll(() => input.inputValue()).not.toBe(before);
      await expect.poll(() => input.getAttribute('aria-describedby')).toContain('draft-hint');
    }

    const dataLabel = demoEditorLabel(locale, 'Data');
    await page.getByRole('tab', { name: dataLabel, exact: true }).click();
    const toolbar = page.getByRole('heading', { name: dataLabel, exact: true }).locator('..');
    const editor = toolbar.locator('..').locator('.inputarea, .native-edit-context');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await editor.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('ControlOrMeta+C');
    expect(JSON.parse(await page.evaluate(() => navigator.clipboard.readText()))).toEqual(original);

    const replacement = structuredClone(original);
    replacement.schemaBased.date = '2026-11-03';
    replacement.schemaBased.time = '11:45:00Z';
    replacement.schemaBased.datetime = '2026-11-03T09:30:00Z';
    await editor.evaluate((element, value) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', JSON.stringify(value));
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    }, replacement);
    await toolbar.getByRole('button').nth(1).click();
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    for (const [kind, shown] of [
      ['date', /^11\/03\/2026$/],
      ['time', /:45/],
      ['datetime', /11\/03\/2026.*:30/],
    ] as const) {
      const input = page.locator(
        `[id=${JSON.stringify(`#/properties/schemaBased/properties/${kind}-input`)}]`,
      );
      await expect.poll(() => input.inputValue()).toMatch(shown);
    }
    expect(pageErrors).toEqual([]);
  },
  { hosts: ['native'] },
);
