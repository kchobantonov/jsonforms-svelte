import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

for (const kind of ['date', 'time', 'datetime'] as const) {
  demoTest(
    `temporal-popup-bounds: ${kind}`,
    async ({ page, family, locale, webcomponent, base }) => {
      await page.setViewportSize({ width: 900, height: 360 });
      await page.addInitScript(
        ({ family, locale }) =>
          localStorage.setItem(
            `${family}-example-locale`,
            JSON.stringify({ version: 1, value: locale }),
          ),
        { family, locale },
      );
      await page.goto(
        `${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=${webcomponent}&drawer=false`,
      );
      const scope = `#/properties/schemaBased/properties/${kind}`;
      const suffix = kind === 'datetime' ? 'DateTime' : kind === 'date' ? 'Date' : 'Time';
      const action =
        `temporal.${family === 'flowbite' ? 'open' : 'choose'}${suffix}` as keyof typeof messages.en;
      const trigger = page
        .locator(`[id=${JSON.stringify(scope)}]`)
        .getByRole('button', { name: messages[locale][action], exact: true });
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();

      const popup = page.locator('[class*="max-h-[min(30rem"]:visible').last();
      await popup.waitFor();
      await expect
        .poll(async () => {
          const bounds = await popup.boundingBox();
          return bounds !== null && bounds.y >= 0 && bounds.y + bounds.height <= 360;
        })
        .toBe(true);
      const before = await popup.boundingBox();
      expect(before).not.toBeNull();
      expect(before!.y).toBeGreaterThanOrEqual(0);
      expect(before!.y + before!.height).toBeLessThanOrEqual(360);
      expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
        webcomponent,
      );
      expect(await popup.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
        'rgba(0, 0, 0, 0)',
      );
      const overflows = await popup.evaluate(
        (element) => element.scrollHeight > element.clientHeight,
      );

      if (overflows) {
        await popup.evaluate((element) => {
          element.scrollTop = element.scrollHeight;
        });
        await expect.poll(() => popup.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      }
      const lastControl = popup.locator('button:visible,input:visible,select:visible').last();
      const after = await popup.boundingBox();
      const last = await lastControl.boundingBox();
      expect(after).not.toBeNull();
      expect(last).not.toBeNull();
      expect(last!.y + last!.height).toBeLessThanOrEqual(after!.y + after!.height + 1);
    },
    { timeout: 60_000 },
  );
}
