import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import config from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-combinators/config.json';

demoTest(
  'performance-branch-edit',
  async ({ page, family, locale, webcomponent, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-combinators?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const name = page.getByRole('textbox', { name: 'Contact name', exact: true });
    for (const active of [false, true]) {
      await applyDemoEditor(page, locale, 'Config', { ...config, validateActiveBranch: active });
      await page.getByRole('tab', { name: /^Demo/ }).click();
      await name.waitFor();
      await expect
        .poll(() => page.locator(`jsonforms-svelte-${family}`).count())
        .toBe(webcomponent ? 1 : 0);
      const samples: number[] = [];
      for (let iteration = 0; iteration < 6; iteration++) {
        const value = `Branch ${active ? 'active' : 'inactive'} edit ${iteration} stays responsive`;
        await name.fill('');
        await name.focus();
        const start = await page.evaluate(() => performance.now());
        await name.pressSequentially(value);
        await expect.poll(() => name.inputValue()).toBe(value);
        const elapsed = (await page.evaluate(() => performance.now())) - start;
        const state = await name.evaluate((element) => {
          const input = element as HTMLInputElement;
          return {
            focused: input === (input.getRootNode() as Document | ShadowRoot).activeElement,
            caret: input.selectionStart,
          };
        });
        expect(state).toEqual({ focused: true, caret: value.length });
        if (iteration > 0) samples.push(elapsed);
      }
      samples.sort((a, b) => a - b);
      expect(samples[4]).toBeLessThan(500);
      console.log(
        `performance-branch-edit ${family} ${webcomponent ? 'webcomponent' : 'native'} ${active ? 'active' : 'inactive'}: median ${samples[2]!.toFixed(1)} ms, p95 ${samples[4]!.toFixed(1)} ms`,
      );
    }
    expect(errors).toEqual([]);
  },
  { locales: ['en'], timeout: 30_000 },
);
