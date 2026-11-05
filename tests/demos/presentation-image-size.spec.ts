import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'presentation images retain their authored width',
  async ({ page, family, webcomponent, base }) => {
    await page.goto(
      `${base}/${family}/#/examples/spec-presentation?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page.getByRole('tab', { name: 'ImageView', exact: true }).click();
    const images = page.getByRole('tabpanel', { name: 'ImageView' }).locator('img');
    await expect.poll(() => images.count()).toBe(3);
    for (const image of await images.all()) {
      await expect
        .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
      expect(await image.evaluate((element) => (element as HTMLImageElement).style.width)).toBe(
        '640px',
      );
      expect((await image.boundingBox())!.width).toBeLessThanOrEqual(640);
    }
  },
  { locales: ['en'], timeout: 45_000 },
);
