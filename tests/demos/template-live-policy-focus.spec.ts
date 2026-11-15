import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import fields from '@chobantonov/jsonforms-extended-spec/examples/template-layout/translations.json';

demoTest(
  'template-live-policy-focus',
  async ({ page, family, locale, webcomponent, base }) => {
    assert.equal(webcomponent, true);
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
      `${base}/${family}/#/examples/spec-template-layout?use-webcomponent=true&drawer=false`,
    );
    await applyDemoEditor(page, locale, 'UI Schema', {
      type: 'TemplateLayout',
      lang: 'ractive',
      template:
        '<div><a data-policy-link href="https://example.org/">Reference</a><div>{{>note}}</div></div>',
      elements: [{ type: 'Control', scope: '#/properties/ractiveNote', name: 'note' }],
    });
    const config = (scheme: string) => ({
      jsonformsExtended: {
        security: { allowScriptEvaluation: true, urlPolicy: { allowedSchemes: [scheme] } },
      },
    });
    await applyDemoEditor(page, locale, 'Config', config('https'));
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    const link = page.locator('[data-policy-link]');
    await expect.poll(() => link.getAttribute('href')).toBe('https://example.org/');
    const note = page.getByRole('textbox', {
      name: fields[locale]['specTemplateLayout.schema.properties.ractiveNote.label'],
      exact: true,
    });
    const host = page.locator(`jsonforms-svelte-${family}`);
    await host.evaluate((element) => {
      const tracked = window as typeof window & { __templateCommitted?: string };
      element.addEventListener('change', (event) => {
        tracked.__templateCommitted = (
          event as CustomEvent<{ data: { ractiveNote?: string } }>
        ).detail.data.ractiveNote;
      });
    });
    const committed = () =>
      page.evaluate(
        () => (window as typeof window & { __templateCommitted?: string }).__templateCommitted,
      );
    await note.fill('Live policy draft');
    await expect.poll(committed).toBe('Live policy draft');
    await note.evaluate((element) => {
      const input = element as HTMLInputElement;
      input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      input.value += ' 候補';
      input.dispatchEvent(
        new InputEvent('input', { bubbles: true, data: '候補', isComposing: true }),
      );
      input.setSelectionRange(input.value.length, input.value.length);
      (window as typeof window & { __templateNote?: Element }).__templateNote = input;
    });
    const setPolicy = (scheme: string) =>
      host.evaluate((element, next) => {
        (element as HTMLElement & { config: unknown }).config = next;
      }, config(scheme));
    const preserved = async () => {
      assert.equal(
        await note.evaluate(
          (element) =>
            element === (window as typeof window & { __templateNote?: Element }).__templateNote,
        ),
        true,
      );
      assert.equal(await note.inputValue(), 'Live policy draft 候補');
      assert.equal(
        await note.evaluate((element) => (element as HTMLInputElement).selectionStart),
        'Live policy draft 候補'.length,
      );
      assert.equal(await note.evaluate((element) => element.matches(':focus')), true);
    };
    await setPolicy('mailto');
    await expect.poll(() => link.getAttribute('href')).toBeNull();
    await preserved();
    assert.equal(await committed(), 'Live policy draft');
    await setPolicy('https');
    await expect.poll(() => link.getAttribute('href')).toBe('https://example.org/');
    await preserved();
    await note.evaluate((element) => {
      element.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true, data: '候補' }),
      );
    });
    await expect.poll(committed).toBe('Live policy draft 候補');
    expect(errors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 45_000 },
);
