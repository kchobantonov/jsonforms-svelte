import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'boolean table cell error placement',
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
    await applyDemoEditor(page, locale, 'Schema', {
      type: 'object',
      properties: {
        value: {
          type: 'array',
          items: { type: 'object', properties: { active: { type: 'boolean' } } },
        },
      },
    });
    await applyDemoEditor(page, locale, 'UI Schema', {
      type: 'Control',
      scope: '#/properties/value',
      options: { table: true },
    });
    await applyDemoEditor(page, locale, 'Data', {
      value: [{ active: true }, { active: 'false' }],
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    const table = page.getByRole('table').first();
    const rows = table.locator('tbody tr');
    await expect.poll(() => rows.count()).toBe(2);
    const invalid = rows.nth(1);
    await expect.poll(() => invalid.locator('[aria-invalid="true"]').count()).toBeGreaterThan(0);
    expect(await rows.first().locator('[aria-invalid="true"]').count()).toBe(0);
    const errorLabel = messages[locale]['validation.cellErrors'].split('{errors}')[0];
    const errorButton = invalid.locator('.cell-invalid > button[aria-label]');
    await expect.poll(() => errorButton.getAttribute('aria-label')).toContain(errorLabel);
    const errorText = (await errorButton.getAttribute('aria-label'))!.slice(errorLabel.length);
    await errorButton.focus();
    const hint = page
      .locator(family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible')
      .filter({ hasText: errorText })
      .first();
    await expect.poll(() => hint.isVisible()).toBe(true);
    expect(await hint.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    expect(await hint.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
      'rgba(0, 0, 0, 0)',
    );
    await page.keyboard.press('Escape');
    await expect.poll(() => hint.isVisible()).toBe(false);
    expect(await errorButton.evaluate((element) => element.matches(':focus'))).toBe(true);
    await expect.poll(() => page.locator('[data-array-summary]:visible').count()).toBe(1);
    expect(await invalid.locator('[role="alert"], [role="note"]').count()).toBe(0);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
