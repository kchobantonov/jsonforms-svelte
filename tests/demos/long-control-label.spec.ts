import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'long control label narrow',
  async ({ page, base, family, webcomponent }) => {
    await page.setViewportSize({ width: 390, height: 850 });
    await page.addInitScript(
      (family) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: 'bg' }),
        ),
      family,
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-file-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const label = page.getByText('Придружаващи файлове (само валидация)', { exact: true });
    await expect.poll(() => label.isVisible()).toBe(true);
    const field = page.locator('[data-file-control]:visible').nth(1);
    const [labelBox, fieldBox] = await Promise.all([label.boundingBox(), field.boundingBox()]);
    expect(labelBox).not.toBeNull();
    expect(fieldBox).not.toBeNull();
    expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(fieldBox!.x + fieldBox!.width);
    expect(labelBox!.y + labelBox!.height).toBeLessThanOrEqual(fieldBox!.y);
    expect(await label.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  },
  { locales: ['bg'] },
);
