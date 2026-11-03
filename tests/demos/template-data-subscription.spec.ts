import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'template literal and nested host replacement',
  async ({ page, family, locale, base }) => {
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
    await page.goto(`${base}/${family}/#/examples/spec-template-layout?use-webcomponent=true`);
    await page.evaluate(async (family) => {
      const tag = `jsonforms-svelte-${family}`;
      await customElements.whenDefined(tag);
      const host = document.createElement(tag);
      host.id = 'template-subscription-host';
      host.setAttribute('schema', JSON.stringify({ type: 'object' }));
      host.setAttribute(
        'config',
        JSON.stringify({ jsonformsExtended: { security: { allowScriptEvaluation: true } } }),
      );
      host.setAttribute(
        'uischema',
        JSON.stringify({
          type: 'TemplateLayout',
          template: '<p data-literal>{{data["a.b"]}}</p><p data-nested>{{data.a.b}}</p>',
        }),
      );
      host.setAttribute('data', JSON.stringify({ 'a.b': 'literal', a: { b: 'nested' } }));
      document.body.append(host);
    }, family);
    const host = page.locator('#template-subscription-host');
    const literal = host.locator('[data-literal]');
    const nested = host.locator('[data-nested]');
    await expect.poll(() => literal.textContent()).toBe('literal');
    await expect.poll(() => nested.textContent()).toBe('nested');
    await literal.evaluate((element) => {
      (window as typeof window & { __templateLiteral?: Element }).__templateLiteral = element;
    });
    await host.evaluate((element) => {
      element.setAttribute('data', JSON.stringify({ 'a.b': 'replaced', a: { b: 'new' } }));
    });
    await expect.poll(() => literal.textContent()).toBe('replaced');
    await expect.poll(() => nested.textContent()).toBe('new');
    expect(
      await literal.evaluate(
        (element) =>
          element === (window as typeof window & { __templateLiteral?: Element }).__templateLiteral,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 30_000 },
);
