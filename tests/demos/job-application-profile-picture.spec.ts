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
  },
  { locales: ['en'], timeout: 45_000 },
);
