import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/translations.json';
import supplements from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/supplemental-translations.json';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/data.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'mixed-tree-commands',
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
    const toggle = page.locator(
      `button[data-mixed-collapse][aria-label=${JSON.stringify(
        supplements[locale]['mixedExampleUI/elements/0/elements/2/elements/2.label'],
      )}]`,
    );
    const content = page.locator(
      `[id=${JSON.stringify(await toggle.getAttribute('aria-controls'))}]`,
    );
    const primitiveButton = content.getByRole('button', {
      name: messages[locale]['mixed.showPrimitives'],
      exact: true,
    });
    await page.mouse.move(0, 0);
    await primitiveButton.focus();
    const primitiveHint = page
      .locator(family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible')
      .filter({ hasText: messages[locale]['mixed.showPrimitives'] })
      .first();
    await expect.poll(() => primitiveHint.isVisible()).toBe(true);
    expect(
      await primitiveHint.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
    ).toBe(webcomponent);
    expect(
      await primitiveHint.evaluate((element) => getComputedStyle(element).backgroundColor),
    ).not.toBe('rgba(0, 0, 0, 0)');
    await page.keyboard.press('Escape');
    await expect.poll(() => primitiveHint.isVisible()).toBe(false);
    expect(
      await primitiveButton.evaluate(
        (element) => (element.getRootNode() as Document | ShadowRoot).activeElement === element,
      ),
    ).toBe(true);
    await primitiveButton.click();
    await content
      .getByRole('button', { name: messages[locale]['mixed.hidePrimitives'], exact: true })
      .click();
    await expect.poll(() => primitiveButton.count()).toBe(1);
    const tree = content.getByRole('tree');
    const rename = () =>
      tree.locator(`button[title=${JSON.stringify(messages[locale]['mixed.rename'])}]`).first();
    const deleteButton = () =>
      tree.locator(`button[title=${JSON.stringify(messages[locale]['mixed.delete'])}]`).first();
    const checkTreeActionHint = async (button: ReturnType<typeof rename>, label: string) => {
      await button.focus();
      await expect
        .poll(() =>
          button.evaluate(
            (element) => getComputedStyle(element.closest('.opacity-0') as HTMLElement).opacity,
          ),
        )
        .toBe('1');
      const hint = page
        .locator(
          family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible',
        )
        .filter({ hasText: label })
        .first();
      await expect.poll(() => hint.isVisible()).toBe(true);
      expect(await hint.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
        webcomponent,
      );
      expect(await hint.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
        'rgba(0, 0, 0, 0)',
      );
      await page.keyboard.press('Escape');
      await expect.poll(() => hint.isVisible()).toBe(false);
      expect(
        await button.evaluate(
          (element) => (element.getRootNode() as Document | ShadowRoot).activeElement === element,
        ),
      ).toBe(true);
    };
    const root = tree.getByRole('treeitem').first();
    if ((await root.getAttribute('aria-expanded')) === 'false') {
      if (family === 'flowbite')
        await root
          .locator(
            '[role="button"][aria-label^="Expand "], [role="button"][aria-label^="Разгъване на "]',
          )
          .evaluate((node) => (node as HTMLElement).click());
      else if (family === 'skeleton')
        await root.locator('[data-part="branch-control"]').first().click();
      else await root.locator('button').first().click();
    }
    await expect.poll(() => root.getAttribute('aria-expanded')).toBe('true');
    await checkTreeActionHint(rename(), messages[locale]['mixed.rename']);
    await rename().evaluate((node, family) => {
      const item = node.closest('[role="treeitem"]') as HTMLElement;
      (family === 'flowbite' ? item.querySelector<HTMLButtonElement>('button')! : item).click();
    }, family);
    const breadcrumb = content.getByRole('navigation', {
      name: messages[locale]['mixed.navigationPath'],
      exact: true,
    });
    await expect.poll(() => breadcrumb.textContent()).toContain('milestones');
    // Select the stored first array item, independently of native search/name inputs.
    const first = content.locator('input').filter({ visible: true });
    let firstIndex = -1;
    await expect
      .poll(async () => {
        firstIndex = await first.evaluateAll((nodes) =>
          nodes.findIndex((node) => (node as HTMLInputElement).value === 'Portland'),
        );
        return firstIndex;
      })
      .toBeGreaterThanOrEqual(0);
    const editor = first.nth(firstIndex);
    await editor.evaluate((node) => {
      node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      (node as HTMLInputElement).value = 'Pending city';
      node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    });
    await rename().evaluate((node) => (node as HTMLButtonElement).click());
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    expect(await tree.locator('[data-tree-rename]').count()).toBe(0);
    await editor.evaluate((node) => {
      node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      node.dispatchEvent(new InputEvent('input', { bubbles: true }));
    });
    const name = tree.locator('[data-tree-rename]');
    // The example's second editor validates this same data asynchronously.
    // A fresh attempt is allowed once its pending work has settled.
    await expect
      .poll(
        async () => {
          if (!(await name.count())) await rename().click({ force: true });
          return name.count();
        },
        { timeout: 10000 },
      )
      .toBe(1);
    await name.evaluate((node) => {
      node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      (node as HTMLInputElement).value = 'route.stops';
      node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
      node.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true }),
      );
    });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    expect(await name.count()).toBe(1);
    await name.evaluate((node) => {
      node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    await expect.poll(() => breadcrumb.textContent()).toContain('route.stops');
    await checkTreeActionHint(deleteButton(), messages[locale]['mixed.delete']);
    const dialog = page.getByRole('dialog');
    await expect
      .poll(
        async () => {
          if (!(await dialog.count()))
            await deleteButton().evaluate((node) => (node as HTMLButtonElement).click());
          return dialog.count();
        },
        { timeout: 10000 },
      )
      .toBe(1);
    await dialog
      .getByRole('button', { name: messages[locale]['confirm.decline'], exact: true })
      .click();
    await expect.poll(() => breadcrumb.textContent()).toContain('route.stops');
    const expected = structuredClone(original) as Record<string, unknown>;
    expected.payload = {
      supplier: original.payload.supplier,
      'route.stops': ['Pending city', 'Salem'],
      verified: false,
    };
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
      .toEqual(expected);
    expect(errors).toEqual([]);
  },
  { timeout: 10_000 },
);
