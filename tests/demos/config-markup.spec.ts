import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

for (const kind of ['default', 'disabled', 'extended', 'typography'] as const) {
  demoTest(`config-markup-${kind}`, async ({ page, family, locale, webcomponent, base }) => {
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
      `${base}/${family}/#/examples/config-markup-${kind}?use-webcomponent=${webcomponent}&drawer=false`,
    );

    if (kind === 'disabled') {
      await expect.poll(() => page.getByText('**Bold**', { exact: true }).isVisible()).toBe(true);
      expect(await page.locator('[data-markup-diagnostic="markdownDisabled"]').count()).toBe(0);
      expect(await page.locator('strong:visible').count()).toBe(0);
    } else if (kind === 'extended') {
      await expect
        .poll(() => page.getByRole('heading', { name: 'Heading' }).isVisible())
        .toBe(true);
    } else {
      const strong = page.locator('strong:visible').filter({ hasText: 'Bold' });
      await expect.poll(() => strong.isVisible()).toBe(true);
      const typography = await strong.evaluate((element) =>
        Boolean(element.closest('.typography')),
      );
      expect(typography).toBe(kind === 'default');
    }
    expect(errors).toEqual([]);
  });
}
