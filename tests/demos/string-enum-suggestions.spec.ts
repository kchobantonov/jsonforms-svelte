import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest(
  'string-enum-suggestions',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-json-inference?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(page, locale, 'Schema', {
      type: 'object',
      $defs: {
        codes: { type: 'string', enum: ['A', 'AB'] },
        free: { type: 'string', minLength: 3 },
      },
      properties: {
        code: { anyOf: [{ $ref: '#/$defs/codes' }, { $ref: '#/$defs/free' }] },
      },
    });
    await applyDemoEditor(page, locale, 'UI Schema', {
      type: 'Control',
      scope: '#/properties/code',
      label: 'Suggested code',
    });
    await applyDemoEditor(page, locale, 'Data', { code: 'A' });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();

    const input = page.locator('input[id$="/properties/code-input"]:visible');
    await input.waitFor();
    await expect.poll(() => input.inputValue()).toBe('A');
    if (family === 'flowbite') {
      await input.focus();
      await expect
        .poll(() => page.getByRole('button', { name: 'AB', exact: true }).count())
        .toBe(1);
      await input.press('ArrowDown');
      await input.press('ArrowDown');
      await input.press('Enter');
      await expect.poll(() => input.inputValue()).toBe('AB');
    } else {
      const options = input.locator('xpath=following-sibling::datalist/option');
      await expect.poll(() => options.count()).toBe(2);
      expect(
        await options.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('value'))),
      ).toEqual(['A', 'AB']);
      await input.fill('AB');
      await input.press('Tab');
    }

    await page.setViewportSize({ width: 390, height: 850 });
    if (family === 'flowbite') {
      await input.fill('A');
      const suggestion = page.getByRole('button', { name: 'AB', exact: true });
      await suggestion.waitFor();
      const popup = await suggestion.boundingBox();
      expect(popup).not.toBeNull();
      expect(popup!.x).toBeGreaterThanOrEqual(0);
      expect(popup!.x + popup!.width).toBeLessThanOrEqual(390);
    }
    await input.fill('custom');
    await input.press('Tab');
    await expect.poll(() => input.inputValue()).toBe('custom');
    const bounds = await input.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);

    const dataLabel = demoEditorLabel(locale, 'Data');
    await page.getByRole('tab', { name: dataLabel, exact: true }).click();
    const toolbar = page.getByRole('heading', { name: dataLabel, exact: true }).locator('..');
    const editor = toolbar.locator('..').locator('.monaco-editor');
    await editor.click({ position: { x: 80, y: 20 } });
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await expect
      .poll(async () => {
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).code;
      })
      .toBe('custom');
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await input.fill('xy');
    await input.press('Tab');
    await expect.poll(() => input.getAttribute('aria-invalid')).toBe('true');
    const compositionFeedback =
      locale === 'bg' ? 'трябва да съответства на схема' : 'must match a schema';
    await expect
      .poll(() => page.getByRole('alert').allTextContents())
      .toEqual(expect.arrayContaining([expect.stringContaining(compositionFeedback)]));
    await expect.poll(() => input.inputValue()).toBe('xy');
    expect(pageErrors).toEqual([]);
  },
  { timeout: 45_000 },
);
