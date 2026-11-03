import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

for (const bound of ['minItems', 'maxItems'] as const) {
  demoTest(`tuple tail ${bound} restrict`, async ({ page, family, locale, webcomponent, base }) => {
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
        value: {
          type: 'array',
          items: [
            { type: 'string', title: 'Code' },
            { type: 'integer', title: 'Quantity' },
          ],
          additionalItems: { type: 'string' },
          [bound]: 3,
        },
      },
    });
    await applyDemoEditor(page, locale, 'UI Schema', {
      type: 'Control',
      scope: '#/properties/value',
    });
    await applyDemoEditor(page, locale, 'Data', { value: ['PART', 1, 'note'] });
    await applyDemoEditor(page, locale, 'Config', { restrict: true });
    const demo = page.getByRole('tab', {
      name: new RegExp('^' + demoEditorLabel(locale, 'Demo')),
    });
    await demo.click();

    const tuple = page.locator('[data-tuple-control]');
    await expect.poll(() => tuple.count()).toBe(1);
    const label =
      bound === 'maxItems'
        ? messages[locale]['tuple.add']
        : messages[locale]['tuple.delete'].replace(
            '{label}',
            messages[locale]['tuple.position'].replace('{position}', '3'),
          );
    const action = tuple.getByRole('button', { name: label, exact: true });
    await expect.poll(() => action.isDisabled()).toBe(true);
    await applyDemoEditor(page, locale, 'Config', { restrict: false });
    await demo.click();
    await expect.poll(() => action.isEnabled()).toBe(true);
    await action.click();
    if (bound === 'maxItems') {
      await expect.poll(() => tuple.locator('[data-additional-item="3"]').count()).toBe(1);
    } else {
      await expect.poll(() => tuple.locator('[data-additional-item="2"]').count()).toBe(0);
    }
    await expect.poll(() => tuple.locator(':scope > p[role="alert"]').count()).toBe(1);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await expect
      .poll(async () => {
        const editor = page.locator(
          '.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context',
        );
        await editor.focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual({ value: bound === 'maxItems' ? ['PART', 1, 'note', ''] : ['PART', 1] });
    expect(pageErrors).toEqual([]);
  });
}
