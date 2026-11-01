import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import { applyDemoEditor } from '../helpers/demo-editor';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'template-image-url-policy',
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

    const image = 'data:image/png;base64,AAAA';
    const nonImage = 'data:text/html,private';
    await applyDemoEditor(page, locale, 'UI Schema', {
      type: 'TemplateLayout',
      lang: 'ractive',
      template: `<div data-policy-probe><img data-image src="${image}" alt="Probe"><img data-non-image src="${nonImage}" alt="Refused"><svg><image data-svg href="${image}"></image><filter><feImage data-filter href="${image}"></feImage></filter></svg></div>`,
    });
    const config = (allowImageDataUrls: boolean, allowScriptEvaluation = true) => ({
      jsonformsExtended: {
        security: {
          allowScriptEvaluation,
          urlPolicy: { allowedSchemes: ['https', 'data'], allowImageDataUrls },
        },
      },
    });
    await applyDemoEditor(page, locale, 'Config', config(false));
    const demo = page.getByRole('tab', {
      name: new RegExp('^' + demoEditorLabel(locale, 'Demo')),
    });
    await demo.click();
    const probe = page.locator('[data-policy-probe]');
    await expect.poll(() => probe.count()).toBe(1);
    for (const selector of ['[data-image]', '[data-non-image]'])
      expect(await probe.locator(selector).getAttribute('src')).toBeNull();
    for (const selector of ['[data-svg]', '[data-filter]'])
      expect(await probe.locator(selector).getAttribute('href')).toBeNull();

    await applyDemoEditor(page, locale, 'Config', config(true));
    await demo.click();
    await expect.poll(() => probe.locator('[data-image]').getAttribute('src')).toBe(image);
    expect(await probe.locator('[data-svg]').getAttribute('href')).toBe(image);
    expect(await probe.locator('[data-filter]').getAttribute('href')).toBe(image);
    expect(await probe.locator('[data-non-image]').getAttribute('src')).toBeNull();

    await applyDemoEditor(page, locale, 'Config', config(true, false));
    await demo.click();
    await expect.poll(() => probe.count()).toBe(0);
    await expect
      .poll(() =>
        page
          .getByRole('alert')
          .filter({ hasText: messages[locale]['template.evaluationDisabled'] })
          .count(),
      )
      .toBe(1);
    await applyDemoEditor(page, locale, 'Config', config(true));
    await demo.click();
    await expect.poll(() => probe.locator('[data-image]').getAttribute('src')).toBe(image);
    expect(errors).toEqual([]);
  },
  { timeout: 60_000 },
);
