import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import { applyDemoEditor } from '../helpers/demo-editor';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-template-layout/translations.supplement.json';

demoTest(
  'template-repeated-slot-lifecycle',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-template-layout?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(page, locale, 'UI Schema', {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/priority' },
        {
          type: 'TemplateLayout',
          lang: 'ractive',
          template: '{{#if data.priority}}{{>note}}{{/if}}{{>note}}',
          elements: [{ type: 'Control', scope: '#/properties/ractiveNote', name: 'note' }],
        },
      ],
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    const name = fields[locale]['specTemplateLayout.schema.properties.ractiveNote.label'];
    const notes = page.getByRole('textbox', { name, exact: true });
    await expect.poll(() => notes.count()).toBe(2);
    const surviving = await notes.nth(1).elementHandle();
    const priority = page.getByRole('checkbox', {
      name: fields[locale]['specTemplateLayout.schema.properties.priority.label'],
      exact: true,
    });
    await priority.uncheck();
    await expect.poll(() => notes.count()).toBe(1);
    expect(await notes.first().evaluate((node, original) => node === original, surviving)).toBe(
      true,
    );
    await notes.first().fill('Retained after branch change');
    await priority.check();
    await expect.poll(() => notes.count()).toBe(2);
    await expect.poll(() => notes.nth(0).inputValue()).toBe('Retained after branch change');
    expect(await notes.nth(1).inputValue()).toBe('Retained after branch change');
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
