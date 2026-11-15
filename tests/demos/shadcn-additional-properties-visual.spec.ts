import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'shadcn additional properties narrow dark RTL',
  async ({ page, base, webcomponent }) => {
    await page.setViewportSize({ width: 390, height: 850 });
    await page.emulateMedia({ colorScheme: 'dark' });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/shadcn/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page.getByRole('button', { name: 'Open settings' }).click();
    await page.getByText('RTL', { exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Settings' })
      .getByRole('button', {
        name: 'Close settings',
      })
      .click();
    await expect.poll(() => page.locator('html').getAttribute('dir')).toBe('rtl');

    for (const title of ['Inventory labels', 'Telemetry readings', 'Supplier headers']) {
      const heading = page.getByText(title, { exact: true });
      await expect.poll(() => heading.isVisible()).toBe(true);
      const bounds = await heading.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    }
    await expect.poll(() => page.getByText('sensor-x', { exact: true }).isVisible()).toBe(true);
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(390);
    expect(errors).toEqual([]);
  },
  { families: ['shadcn'], locales: ['en'] },
);
