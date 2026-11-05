import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/translations.json';
import supplements from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/translations.json';
import original from '@chobantonov/jsonforms-extended-spec/examples/mixed-control/data.json';

demoTest(
  'mixed-tree-workspace',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
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
    const toggle = page.locator(
      `button[data-mixed-collapse][aria-label=${JSON.stringify(treeLabel)}]`,
    );
    await expect.poll(() => toggle.getAttribute('aria-expanded')).toBe('true');
    const content = page.locator(
      `[id=${JSON.stringify(await toggle.getAttribute('aria-controls'))}]`,
    );
    const search = content.getByPlaceholder(messages[locale]['mixed.searchPlaceholder'], {
      exact: true,
    });
    await expect.poll(() => search.count()).toBe(1);
    await expect
      .poll(() => search.getAttribute('aria-label'))
      .toBe(messages[locale]['mixed.searchLabel']);
    const tree = content.getByRole(family === 'flowbite' ? 'region' : 'tree', {
      name: messages[locale]['mixed.treeLabel'],
      exact: true,
    });
    await expect.poll(() => tree.count()).toBe(1);
    await expect
      .poll(() => content.locator('[id$="-input-selector"]').first().getAttribute('aria-label'))
      .toBe(messages[locale]['mixed.typeLabel']);
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

    const renameButton = supplier.locator(
      `button[title=${JSON.stringify(messages[locale]['mixed.rename'])}]`,
    );
    const rename = content.locator('[data-tree-rename]');
    await expect
      .poll(
        async () => {
          if (!(await rename.count())) await renameButton.click({ force: true });
          return rename.count();
        },
        { timeout: 10000 },
      )
      .toBe(1);
    await content.evaluate((root) => {
      const input = root.querySelector<HTMLInputElement>('[data-tree-rename]');
      if (!input) throw new Error('The tree Rename input closed before editing');
      input.value = 'partner';
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    await expect.poll(() => search.inputValue()).toBe('supplier');
    await expect.poll(() => content.getByRole('treeitem', { name: /partner/i }).count()).toBe(0);
    await expect
      .poll(() => content.getByRole('textbox', { name: 'partner', exact: true }).inputValue())
      .toBe('Cascade Supplies');
    await search.fill('partner');
    const partner = content.getByRole('treeitem').filter({ hasText: 'partner' }).last();
    await expect.poll(() => partner.getAttribute('aria-selected')).toBe('true');
    await content
      .locator(`button[title=${JSON.stringify(messages[locale]['mixed.hidePrimitives'])}]`)
      .click();
    await expect.poll(() => partner.count()).toBe(0);
    await expect
      .poll(() => content.getByRole('textbox', { name: 'partner', exact: true }).inputValue())
      .toBe('Cascade Supplies');
    await expect.poll(() => search.inputValue()).toBe('partner');
    await content
      .locator(`button[title=${JSON.stringify(messages[locale]['mixed.showPrimitives'])}]`)
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect.poll(() => partner.getAttribute('aria-selected')).toBe('true');
    const breadcrumb = content.getByRole('navigation', {
      name: messages[locale]['mixed.navigationPath'],
      exact: true,
    });
    await expect.poll(() => breadcrumb.textContent()).toContain('partner');
    await expect
      .poll(() => content.getByRole('textbox', { name: 'partner', exact: true }).inputValue())
      .toBe('Cascade Supplies');

    await toggle.click();
    await expect.poll(() => toggle.getAttribute('aria-expanded')).toBe('false');
    await toggle.click();
    await expect.poll(() => toggle.getAttribute('aria-expanded')).toBe('true');
    await expect.poll(() => search.inputValue()).toBe('partner');
    await expect
      .poll(() =>
        search.evaluate((element) => (element as HTMLInputElement & { probe?: number }).probe),
      )
      .toBe(1);
    await expect.poll(() => partner.getAttribute('aria-selected')).toBe('true');

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
      .toEqual({
        ...original,
        payload: {
          milestones: original.payload.milestones,
          verified: false,
          partner: 'Cascade Supplies',
        },
      });
    expect(errors).toEqual([]);
  },
  { timeout: 12000 },
);
