import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'job application displays its inline profile picture',
  async ({ page, family, webcomponent, base }) => {
    await page.goto(
      `${base}/${family}/#/examples/spec-job-application?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const picture = page.locator('img[alt="Profile Picture"]').first();
    await expect.poll(() => picture.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    await expect
      .poll(() => picture.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
    expect(await page.locator('[data-template-diagnostic="template.missing"]').count()).toBe(0);
    await expect.poll(() => page.getByRole('textbox', { name: 'First Name' }).count()).toBe(1);
    const applicantRow = picture.locator('xpath=ancestor::*[@data-layout="row"][1]');
    const pictureShare = await applicantRow.evaluate((row) => {
      const columns = Array.from(row.children).filter((child) =>
        child.hasAttribute('data-layout-item'),
      );
      if (columns.length !== 2) return 0;
      const widths = columns.map((column) => column.getBoundingClientRect().width);
      return widths[0] / (widths[0] + widths[1]);
    });
    expect(pictureShare).toBeGreaterThan(0.2);
    expect(pictureShare).toBeLessThan(0.35);
  },
  { locales: ['en'], timeout: 45_000 },
);
