import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';

const cases = [
  {
    name: 'minItems',
    value: ['PART'],
    schema: {
      type: 'array',
      items: [
        { type: 'string', title: 'Code' },
        { type: 'integer', title: 'Quantity' },
      ],
      additionalItems: false,
      minItems: 2,
    },
  },
  {
    name: 'maxItems',
    value: ['PART', 1, 'extra'],
    schema: {
      type: 'array',
      items: [
        { type: 'string', title: 'Code' },
        { type: 'integer', title: 'Quantity' },
      ],
      additionalItems: true,
      maxItems: 2,
    },
  },
  {
    name: 'uniqueItems',
    value: ['dupe', 'dupe'],
    schema: {
      type: 'array',
      items: [
        { type: 'string', title: 'First' },
        { type: 'string', title: 'Second' },
      ],
      additionalItems: false,
      uniqueItems: true,
    },
  },
] as const;

for (const example of cases) {
  demoTest(
    `tuple-wide ${example.name} feedback`,
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
        properties: { value: example.schema },
      });
      await applyDemoEditor(page, locale, 'UI Schema', {
        type: 'Control',
        scope: '#/properties/value',
      });
      await applyDemoEditor(page, locale, 'Data', { value: example.value });
      await page
        .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
        .click();

      const tuple = page.locator('[data-tuple-control]');
      await expect.poll(() => tuple.count()).toBe(1);
      await expect.poll(() => tuple.locator(':scope > p[role="alert"]').count()).toBe(1);
      expect((await tuple.locator(':scope > p[role="alert"]').textContent())?.trim()).not.toBe('');
      const invalidFields = tuple.locator('input[aria-invalid="true"]');
      expect(await invalidFields.count()).toBe(0);
      expect(pageErrors).toEqual([]);
    },
  );
}
