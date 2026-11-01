import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/translations.json';
import supplements from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/supplemental-translations.json';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/data.json';

demoTest('mixed-tree-workspace', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-mixed-control?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await page
    .getByRole('tab', {
      name: translations[locale]['featureNavigation.section3.label'],
      exact: true,
    })
    .click();
  const treeLabel = supplements[locale]['mixedExampleUI/elements/0/elements/2/elements/2.label'];
  const toggle = page.getByRole('button', { name: treeLabel, exact: true });
  await expect.poll(() => toggle.getAttribute('aria-expanded')).toBe('true');
  const content = page.locator(
    `[id=${JSON.stringify(await toggle.getAttribute('aria-controls'))}]`,
  );
  const search = content.getByPlaceholder(messages[locale]['mixed.searchTree'], { exact: true });
  await expect.poll(() => search.count()).toBe(1);
  await search.evaluate(
    (element) => ((element as HTMLInputElement & { probe?: number }).probe = 1),
  );

  const showPrimitives = content.locator(
    `button[title=${JSON.stringify(messages[locale]['mixed.showPrimitives'])}]`,
  );
  await showPrimitives.click();
  await expect
    .poll(() =>
      content
        .locator(`button[title=${JSON.stringify(messages[locale]['mixed.hidePrimitives'])}]`)
        .count(),
    )
    .toBe(1);
  await search.fill('supplier');
  const supplier = content.getByRole('treeitem').filter({ hasText: 'supplier' }).last();
  await expect.poll(() => supplier.count()).toBe(1);
  if (family === 'flowbite') await supplier.locator(':scope > button').click();
  else await supplier.click();
  await expect.poll(() => supplier.getAttribute('aria-selected')).toBe('true');
  const breadcrumb = content.getByRole('navigation', {
    name: messages[locale]['mixed.navigationPath'],
    exact: true,
  });
  await expect.poll(() => breadcrumb.textContent()).toContain('supplier');
  await expect
    .poll(() => content.getByRole('textbox', { name: 'supplier', exact: true }).inputValue())
    .toBe('Cascade Supplies');

  await toggle.click();
  await expect.poll(() => toggle.getAttribute('aria-expanded')).toBe('false');
  await toggle.click();
  await expect.poll(() => toggle.getAttribute('aria-expanded')).toBe('true');
  await expect.poll(() => search.inputValue()).toBe('supplier');
  await expect
    .poll(() =>
      search.evaluate((element) => (element as HTMLInputElement & { probe?: number }).probe),
    )
    .toBe(1);
  await expect.poll(() => supplier.getAttribute('aria-selected')).toBe('true');

  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  const dataEditor = page.locator('.monaco-editor:visible');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await expect
    .poll(async () => {
      await dataEditor.locator('.inputarea, .native-edit-context').focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    })
    .toEqual(original);
  expect(errors).toEqual([]);
});
