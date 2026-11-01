import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

for (const kind of [
  'group-border',
  'image-dimensions',
  'separator-local-vertical',
  'separator-removed-vertical',
  'label-format',
] as const) {
  demoTest(`config-${kind}`, async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/config-${kind}?use-webcomponent=${webcomponent}&drawer=false`,
    );

    if (kind === 'group-border') {
      const frames = page.locator('[data-group-frame]');
      await expect.poll(() => frames.count()).toBe(2);
      expect(await frames.nth(0).textContent()).toContain('Bordered content');
      expect(await frames.nth(1).textContent()).toContain('Borderless content');
      expect(await frames.nth(0).evaluate((node) => node.classList.contains('border-0'))).toBe(
        false,
      );
      expect(await frames.nth(1).evaluate((node) => node.classList.contains('border-0'))).toBe(
        true,
      );
      expect(await frames.nth(1).evaluate((node) => getComputedStyle(node).borderTopWidth)).toBe(
        '0px',
      );
    } else if (kind === 'image-dimensions') {
      const image = page.getByRole('img', { name: 'Sized preview' });
      await expect
        .poll(() => image.evaluate((node) => (node as HTMLImageElement).style.width))
        .toBe('120px');
      expect(await image.evaluate((node) => (node as HTMLImageElement).style.height)).toBe('5rem');
    } else if (kind === 'label-format') {
      await expect
        .poll(() => page.getByText('<strong>Literal</strong>', { exact: true }).count())
        .toBeGreaterThan(0);
      expect(await page.locator('strong').filter({ hasText: 'Literal' }).count()).toBe(0);
    } else {
      const separator = page
        .locator('[role="separator"][aria-orientation], hr[aria-orientation]')
        .last();
      await expect
        .poll(() => separator.getAttribute('aria-orientation'))
        .toBe(kind === 'separator-local-vertical' ? 'vertical' : 'horizontal');
    }
    expect(errors).toEqual([]);
  });
}
