import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

for (const kind of [
  'file-accept',
  'category-initial',
  'table',
  'cells',
  'categorization-local-vertical',
  'categorization-removed-vertical',
] as const) {
  demoTest(`config-removed-${kind}`, async ({ page, family, locale, webcomponent, base }) => {
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
    const example = kind.startsWith('categorization-')
      ? `config-${kind}`
      : `config-removed-${kind}`;
    await page.goto(
      `${base}/${family}/#/examples/${example}?use-webcomponent=${webcomponent}&drawer=false`,
    );

    if (kind === 'file-accept') {
      await expect
        .poll(() => page.locator('input[type="file"]').getAttribute('accept'))
        .toBe('image/png');
    } else if (kind === 'category-initial') {
      await expect
        .poll(() => page.locator('[id="#/properties/first-input"]').isVisible())
        .toBe(true);
      expect(await page.locator('[id="#/properties/second-input"]').isVisible()).toBe(false);
    } else if (kind === 'table') {
      await expect.poll(() => page.locator('table:visible').count()).toBe(1);
      await expect
        .poll(() => page.locator('table:visible input[type="text"]').first().inputValue())
        .toBe('Ada');
    } else if (kind === 'cells') {
      await expect.poll(() => page.locator('table:visible').count()).toBe(1);
      await expect.poll(() => page.locator('table:visible').innerText()).toContain('Main Street');
      expect(await page.locator('table:visible').innerText()).not.toContain('Legacy');
    } else {
      const categoryTabs = page.getByRole('tablist').filter({
        has: page.getByRole('tab', { name: 'First', exact: true }),
      });
      await expect
        .poll(() => categoryTabs.getAttribute('aria-orientation'))
        .toBe(kind === 'categorization-local-vertical' ? 'vertical' : 'horizontal');
    }
    expect(errors).toEqual([]);
  });
}
