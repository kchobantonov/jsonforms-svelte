import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-recursive-tree/translations.json';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-recursive-tree/data.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

const children = Array.from({ length: 100 }, (_, index) => ({
  kind: 'file',
  name: `File ${String(index).padStart(3, '0')}`,
  content: 'Measured child',
}));

demoTest(
  'performance-recursive-expansion',
  async ({ page, family, locale, webcomponent, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-recursive-tree?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(
      page,
      locale,
      'Data',
      {
        ...original,
        populated: {
          kind: 'folder',
          name: 'Documents',
          children: [{ kind: 'folder', name: 'Bulk', children }],
        },
      },
      { verifyVisibleText: false },
    );
    await page.getByRole('tab', { name: /^Demo/ }).click();
    await page
      .getByRole('tab', {
        name: translations[locale]['tree.editor.label'],
        exact: true,
      })
      .click();
    const navigation = page.locator('[data-recursive-tree-navigation]');
    await expect
      .poll(() => page.locator(`jsonforms-svelte-${family}`).count())
      .toBe(webcomponent ? 1 : 0);
    const last = navigation.getByRole('button', { name: 'File 099', exact: true });
    const bulk = navigation.locator('[data-recursive-node]').filter({ hasText: /^Bulk$/ });
    const skeletonToggle = bulk
      .locator('xpath=ancestor::*[@data-part="branch-control"][1]')
      .locator('[data-part="branch-indicator"]');
    const expand =
      family === 'skeleton'
        ? skeletonToggle
        : navigation.getByRole('button', {
            name: messages[locale]['tree.expand'].replace('{label}', 'Bulk'),
            exact: true,
          });
    const collapse =
      family === 'skeleton'
        ? skeletonToggle
        : navigation.getByRole('button', {
            name: messages[locale]['tree.collapse'].replace('{label}', 'Bulk'),
            exact: true,
          });
    await expand.waitFor();
    const samples: number[] = [];
    for (let iteration = 0; iteration < 6; iteration++) {
      const start = await page.evaluate(() => performance.now());
      await expand.click();
      await last.waitFor({ state: 'visible' });
      const elapsed = (await page.evaluate(() => performance.now())) - start;
      if (iteration > 0) samples.push(elapsed);
      await collapse.click();
      await last.waitFor({ state: 'hidden' });
    }
    samples.sort((a, b) => a - b);
    const median = samples[2]!;
    const p95 = samples[4]!;
    expect(p95).toBeLessThan(1000);
    expect(errors).toEqual([]);
    console.log(
      `performance-recursive-expansion ${family} ${webcomponent ? 'webcomponent' : 'native'}: median ${median.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms for 100 children`,
    );
  },
  { locales: ['en'], timeout: 30_000 },
);
