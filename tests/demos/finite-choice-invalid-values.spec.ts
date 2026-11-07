import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest(
  'finite-choice-invalid-values',
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
      properties: {
        choice: { type: 'string', enum: ['A', 'B'] },
        named: {
          type: 'string',
          oneOf: [
            { const: 'X', title: 'X' },
            { const: 'Y', title: 'Y' },
          ],
        },
      },
    });
    await applyDemoEditor(page, locale, 'UI Schema', {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/choice', label: 'Choice' },
        {
          type: 'Control',
          scope: '#/properties/named',
          label: 'Named',
          options: { format: 'radio' },
        },
      ],
    });
    await applyDemoEditor(page, locale, 'Data', { choice: 'outside', named: 'unknown' });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();

    const choiceStatus = page.locator('[id$="/properties/choice-invalid-value"]:visible');
    const namedStatus = page.locator('[id$="/properties/named-invalid-value"]:visible');
    await choiceStatus.waitFor();
    await namedStatus.waitFor();
    const expected =
      locale === 'bg'
        ? 'Текуща стойност извън възможните избори'
        : 'Current value outside the choices';
    expect(await choiceStatus.textContent()).toContain(expected);
    expect(await choiceStatus.textContent()).toContain('"outside"');
    expect(await namedStatus.textContent()).toContain(expected);
    expect(await namedStatus.textContent()).toContain('"unknown"');

    const choiceInput = page.locator('[id$="/properties/choice-input"]:visible');
    await expect
      .poll(() => choiceInput.getAttribute('aria-describedby'))
      .toContain(await choiceStatus.getAttribute('id'));
    if (family !== 'flowbite') {
      await choiceInput.click();
      const option = page.getByRole('option', { name: 'B', exact: true });
      const popup = option.locator('xpath=ancestor::*[@role="listbox"][1]');
      expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
        webcomponent,
      );
      expect(await popup.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
        'rgba(0, 0, 0, 0)',
      );
      await page.keyboard.press('Escape');
      await expect.poll(() => popup.isVisible()).toBe(false);
      await expect
        .poll(() => choiceInput.evaluate((element) => element.matches(':focus')))
        .toBe(true);
    }
    const namedStatusId = await namedStatus.getAttribute('id');
    await expect
      .poll(() =>
        page
          .locator('[aria-describedby]')
          .evaluateAll(
            (nodes, id) =>
              nodes.some((node) => node.getAttribute('aria-describedby')?.split(' ').includes(id)),
            namedStatusId ?? '',
          ),
      )
      .toBe(true);

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
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual({ choice: 'outside', named: 'unknown' });
    expect(pageErrors).toEqual([]);
  },
  { timeout: 45_000 },
);
