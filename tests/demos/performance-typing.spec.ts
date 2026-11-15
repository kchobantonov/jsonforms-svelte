import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

const sample = 'Performance typing stays responsive';

demoTest(
  'performance-typing',
  async ({ page, family, webcomponent, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-string-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const name = page.locator('[id="#/properties/contactName-input"]');
    await name.waitFor();
    await expect
      .poll(() => page.locator(`jsonforms-svelte-${family}`).count())
      .toBe(webcomponent ? 1 : 0);
    const samples: number[] = [];
    for (let iteration = 0; iteration < 6; iteration++) {
      await name.fill('');
      await name.focus();
      const start = await page.evaluate(() => performance.now());
      await name.pressSequentially(sample);
      await expect.poll(() => name.inputValue()).toBe(sample);
      const elapsed = (await page.evaluate(() => performance.now())) - start;
      const input = await name.evaluate((element) => {
        const field = element as HTMLInputElement;
        return {
          focused: field === (field.getRootNode() as Document | ShadowRoot).activeElement,
          caret: field.selectionStart,
        };
      });
      expect(input).toEqual({ focused: true, caret: sample.length });
      if (iteration > 0) samples.push(elapsed);
    }
    samples.sort((a, b) => a - b);
    const median = samples[2]!;
    const p95 = samples[4]!;
    expect(p95).toBeLessThan(500);
    expect(errors).toEqual([]);
    console.log(
      `performance-typing ${family} ${webcomponent ? 'webcomponent' : 'native'}: median ${median.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms for ${sample.length} keys`,
    );
  },
  { locales: ['en'], timeout: 20_000 },
);
