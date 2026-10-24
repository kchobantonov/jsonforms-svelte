import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import type { ImageViewDiagnosticCode } from '../../packages/jsonforms-svelte/src/lib/imageView';

demoTest(
  'image-context',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-presentation?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const apply = async (name: 'Schema' | 'UI Schema' | 'Data' | 'Config', value: unknown) => {
      const label = demoEditorLabel(locale, name);
      await page.getByRole('tab', { name: label, exact: true }).click();
      const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
      const input = toolbar.locator('..').locator('.inputarea, .native-edit-context');
      await input.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      await input.focus();
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+ArrowUp' : 'Control+Home');
      await toolbar
        .locator('..')
        .locator('.view-lines')
        .click({ position: { x: 10, y: 10 } });
      await page.keyboard.press('ControlOrMeta+A');
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.evaluate(
        (text) => navigator.clipboard.writeText(text),
        JSON.stringify(value, null, 2),
      );
      await page.keyboard.press('ControlOrMeta+V');
      await input.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      const expected = JSON.stringify(value, null, 2)
        .split('\n')
        .slice(0, 8)
        .join('')
        .replace(/\s/g, '');
      await expect
        .poll(async () =>
          (await toolbar.locator('..').locator('.view-lines').innerText()).replace(/\s/g, ''),
        )
        .toContain(expected);
      await toolbar.getByRole('button').nth(1).click();
    };
    const demo = () =>
      page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
    const checkDiagnostic = async (code: ImageViewDiagnosticCode) => {
      const warning = page.locator(`[data-image-diagnostic="${code}"]`);
      await expect.poll(() => warning.count()).toBe(1);
      expect((await warning.locator('[data-image-summary]').textContent())?.trim()).toBe(
        messages[locale][
          code === 'image.urlRefused' ? 'image.blocked' : 'image.configurationWarning'
        ],
      );
      const details = warning.getByRole('button', {
        name: messages[locale]['image.warningDetails'],
      });
      const tooltip = page.locator('[role="tooltip"]:visible');
      await details.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await details.hover();
      await expect.poll(() => tooltip.count(), { timeout: 3000 }).toBe(1);
      expect((await tooltip.textContent())?.trim()).toBe(messages[locale][code]);
      expect(
        await tooltip.evaluate((element) => element.getBoundingClientRect().width),
      ).toBeLessThanOrEqual(353);
      if (code === 'image.urlRefused' && locale === 'bg' && !webcomponent) {
        await page.screenshot({
          path: `test-results/image-diagnostic-${family}-bg.png`,
          fullPage: true,
        });
      }
      await details.press('Escape');
      await expect.poll(() => tooltip.count()).toBe(0);
      await details.tap();
      await expect.poll(() => tooltip.count(), { timeout: 3000 }).toBe(1);
      await details.press('Escape');
      await expect.poll(() => tooltip.count()).toBe(0);
      expect(await warning.textContent()).not.toContain('javascript:');
    };
    const schema = (allowed: boolean) => ({
      type: 'object',
      properties: { 'a.b': allowed, '': { type: 'string' } },
    });
    const image = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    await apply('Schema', schema(false));
    await apply('UI Schema', {
      type: 'VerticalLayout',
      elements: [
        { type: 'ImageView', scope: '#/properties/a.b', alt: 'Dotted image' },
        { type: 'ImageView', scope: '#/properties/', alt: 'Empty-key image' },
      ],
    });
    await apply('Data', { 'a.b': image, '': image });
    await demo();
    const dotted = page.getByRole('img', { name: 'Dotted image', exact: true });
    const empty = page.getByRole('img', { name: 'Empty-key image', exact: true });
    const diagnostic = page.locator('[data-image-diagnostic="image.scopeNotString"]');
    expect(await dotted.count()).toBe(0);
    await checkDiagnostic('image.scopeNotString');
    expect(await empty.getAttribute('src')).toBe(image);
    await apply('Schema', schema(true));
    await demo();
    await expect.poll(() => dotted.getAttribute('src')).toBe(image);
    expect(await empty.getAttribute('src')).toBe(image);
    expect(await diagnostic.count()).toBe(0);
    await apply('Schema', {
      ...schema(true),
      definitions: {
        escaped: { type: 'object', properties: { 'a~b~c': { type: 'string' }, '#': true } },
      },
      allOf: [{ $ref: '#/definitions/escaped' }],
    });
    await apply('UI Schema', {
      type: 'VerticalLayout',
      elements: [
        { type: 'ImageView', scope: '#/properties/a~0b~0c', alt: 'Escaped image' },
        { type: 'ImageView', scope: '#/properties/#', alt: 'Hash image' },
      ],
    });
    await apply('Data', { 'a~b~c': image, '#': image });
    await demo();
    expect(
      await page.getByRole('img', { name: 'Escaped image', exact: true }).getAttribute('src'),
    ).toBe(image);
    expect(
      await page.getByRole('img', { name: 'Hash image', exact: true }).getAttribute('src'),
    ).toBe(image);
    await apply('UI Schema', {
      type: 'VerticalLayout',
      elements: [
        { type: 'ImageView', scope: '#/properties/a.b', alt: 'Dotted image' },
        { type: 'ImageView', scope: '#/properties/', alt: 'Empty-key image' },
      ],
    });
    await apply('Data', { 'a.b': 42, '': image });
    await demo();
    await checkDiagnostic('image.nonStringSource');
    expect(await dotted.count()).toBe(0);
    expect(await empty.getAttribute('src')).toBe(image);
    await apply('Data', { 'a.b': '', '': image });
    await demo();
    await expect.poll(() => dotted.count()).toBe(0);
    expect(await empty.getAttribute('src')).toBe(image);
    await apply('Data', {});
    await demo();
    expect(await dotted.count()).toBe(0);
    expect(await empty.count()).toBe(0);
    expect(await page.locator('[data-image-diagnostic]').count()).toBe(0);
    await apply('Data', { 'a.b': image });
    await apply('UI Schema', {
      type: 'VerticalLayout',
      elements: [
        { type: 'ImageView', alt: 'Missing source' },
        { type: 'ImageView', src: image },
        { type: 'ImageView', src: 42, scope: '#/properties/a.b', alt: 'Invalid direct source' },
        { type: 'ImageView', src: '', scope: '#/properties/a.b', alt: 'Blank direct source' },
        { type: 'ImageView', src: 'javascript:alert(1)', alt: 'Refused image' },
      ],
    });
    await demo();
    for (const code of [
      'image.noSource',
      'image.missingAlt',
      'image.nonStringSource',
      'image.urlRefused',
    ] as const) {
      await checkDiagnostic(code);
    }
    expect(
      await page.getByRole('img', { name: 'Invalid direct source', exact: true }).count(),
    ).toBe(0);
    expect(await page.getByRole('img', { name: 'Blank direct source', exact: true }).count()).toBe(
      0,
    );
    expect(await page.getByRole('img', { name: 'Refused image', exact: true }).count()).toBe(0);
    await apply('UI Schema', {
      type: 'VerticalLayout',
      elements: [
        { type: 'ImageView', src: image, alt: 'Direct image' },
        { type: 'ImageView', scope: '#/properties/a.b', alt: 'Scoped image' },
      ],
    });
    await apply('Config', {
      jsonformsExtended: { security: { urlPolicy: { allowImageDataUrls: false } } },
    });
    await demo();
    await expect
      .poll(() => page.locator('[data-image-diagnostic="image.urlRefused"]').count())
      .toBe(2);
    await apply('Config', {
      jsonformsExtended: { security: { urlPolicy: { allowImageDataUrls: true } } },
    });
    await demo();
    await expect
      .poll(() => page.getByRole('img', { name: 'Direct image', exact: true }).getAttribute('src'))
      .toBe(image);
    expect(
      await page.getByRole('img', { name: 'Scoped image', exact: true }).getAttribute('src'),
    ).toBe(image);
    expect(await page.locator('[data-image-diagnostic]').count()).toBe(0);
    expect(errors).toEqual([]);
  },
  { hasTouch: true },
);
