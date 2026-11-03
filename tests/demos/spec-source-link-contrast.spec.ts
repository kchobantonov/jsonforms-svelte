import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';

const luminance = (channels: number[]) =>
  channels
    .map((value) => value / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);

demoTest(
  'spec-source-link-contrast',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => {
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        );
        localStorage.setItem(
          `${family}-example-mode`,
          JSON.stringify({
            version: 1,
            value: sessionStorage.getItem('source-link-test-mode') ?? 'light',
          }),
        );
      },
      { family, locale },
    );
    await page.goto(
      `${base}/${family}/#/examples/spec-markup-label?use-webcomponent=${webcomponent}&drawer=false`,
    );

    for (const mode of ['light', 'dark'] as const) {
      if (mode === 'dark') {
        await page.evaluate(() => sessionStorage.setItem('source-link-test-mode', 'dark'));
        await page.reload();
      }
      const link = page.getByRole('link', { name: messages[locale]['spec.source'] });
      await expect.poll(() => link.isVisible()).toBe(true);
      const { foreground, background } = await link.evaluate((element) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        const channels = (color: string) => {
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          return [...context.getImageData(0, 0, 1, 1).data];
        };
        const foreground = channels(getComputedStyle(element).color).slice(0, 3);
        let ancestor = element.parentElement;
        while (ancestor) {
          const color = channels(getComputedStyle(ancestor).backgroundColor);
          if (color[3] >= 254) return { foreground, background: color.slice(0, 3) };
          ancestor = ancestor.parentElement;
        }
        return { foreground, background: [255, 255, 255] };
      });
      const bright = Math.max(luminance(foreground), luminance(background));
      const dark = Math.min(luminance(foreground), luminance(background));
      expect(
        (bright + 0.05) / (dark + 0.05),
        `${family} ${locale} ${mode} foreground=${foreground} background=${background}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  },
  { timeout: 20_000 },
);
