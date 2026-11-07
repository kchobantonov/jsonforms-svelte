import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/destructive-confirmation/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import original from '@chobantonov/jsonforms-extended-spec/examples/destructive-confirmation/data.json';
import config from '@chobantonov/jsonforms-extended-spec/examples/destructive-confirmation/config.json';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest('destructive-confirmation', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-destructive-confirmation?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const remove = page
    .getByRole('tabpanel', {
      name: translations[locale]['featureNavigation.section1.label'],
      exact: true,
    })
    .locator('[data-additional-properties]')
    .first()
    .getByRole('button', {
      name: new RegExp(
        '^' + messages[locale]['additionalProperties.deleteNamed'].split('{name}')[0],
      ),
    })
    .first();
  await remove.click();
  const dialog = page.getByRole('dialog', {
    name: translations[locale]['confirm.delete.title'],
    exact: true,
  });
  await expect.poll(() => dialog.isVisible()).toBe(true);
  if (family === 'shadcn') {
    await expect
      .poll(() =>
        dialog
          .getByRole('button', { name: messages[locale]['dialog.close'], exact: true })
          .isVisible(),
      )
      .toBe(true);
  }
  expect(await dialog.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
    webcomponent,
  );
  await expect
    .poll(() =>
      dialog.evaluate((element) =>
        element.contains((element.getRootNode() as Document | ShadowRoot).activeElement),
      ),
    )
    .toBe(true);
  await dialog
    .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
    .click();
  await expect.poll(() => dialog.count()).toBe(0);
  await expect.poll(() => remove.evaluate((element) => element.matches(':focus'))).toBe(true);
  await remove.click();
  await page.keyboard.press('Escape');
  await expect.poll(() => dialog.count()).toBe(0);
  await expect.poll(() => remove.evaluate((element) => element.matches(':focus'))).toBe(true);
  await remove.click();
  await dialog
    .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
    .click();
  await expect.poll(() => remove.count()).toBe(0);
  await page
    .getByRole('tab', {
      name: translations[locale]['featureNavigation.section2.label'],
      exact: true,
    })
    .click();
  const grid = page.locator('.jsonforms-ag-grid');
  await expect.poll(() => grid.locator('.ag-row').count()).toBe(3);
  await grid.locator('.ag-row').first().getByRole('checkbox').check();
  await grid.locator('.ag-row').nth(1).getByRole('checkbox').check();
  await grid.locator('.jsonforms-ag-grid__actions').getByRole('button').first().click();
  await expect.poll(() => dialog.isVisible()).toBe(true);
  await dialog
    .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
    .click();
  await expect.poll(() => grid.locator('.ag-row').count()).toBe(1);
  expect(errors).toEqual([]);
});

demoTest(
  'destructive confirmation host replacement',
  async ({ page, family, locale, base }) => {
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
      `${base}/${family}/#/examples/spec-destructive-confirmation?use-webcomponent=true&drawer=false`,
    );
    const host = page.locator(`jsonforms-svelte-${family}`);
    const remove = page
      .getByRole('tabpanel', {
        name: translations[locale]['featureNavigation.section1.label'],
        exact: true,
      })
      .locator('[data-additional-properties]')
      .first()
      .getByRole('button', {
        name: new RegExp(
          '^' + messages[locale]['additionalProperties.deleteNamed'].split('{name}')[0],
        ),
      })
      .first();
    await remove.click();
    const dialog = page.getByRole('dialog', {
      name: translations[locale]['confirm.delete.title'],
      exact: true,
    });
    await expect.poll(() => dialog.isVisible()).toBe(true);
    const replacement = structuredClone(original);
    replacement.notes.gate = 'Host replacement';
    await host.evaluate(
      (element, data) => element.setAttribute('data', JSON.stringify(data)),
      replacement,
    );
    await expect.poll(() => dialog.count()).toBe(0);
    expect(JSON.parse((await host.getAttribute('data'))!)).toEqual(replacement);
    expect(errors).toEqual([]);
  },
  { hosts: ['webcomponent'] },
);

demoTest(
  'destructive confirmation local override and live config',
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
      `${base}/${family}/#/examples/spec-destructive-confirmation?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const panel = page.getByRole('tabpanel', {
      name: translations[locale]['featureNavigation.section1.label'],
      exact: true,
    });
    const remove = (table: number) =>
      panel
        .getByRole('button', {
          name: messages[locale]['collection.deleteSelected'],
          exact: true,
        })
        .nth(table);
    const selectRow = async (table: number) => {
      await panel
        .getByRole('table')
        .nth(table)
        .getByRole('checkbox', {
          name: messages[locale]['collection.selectRow'].replace('{index}', '1'),
          exact: true,
        })
        .click();
    };
    const tableValues = (table: number) =>
      panel
        .getByRole('table')
        .nth(table)
        .locator('input')
        .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));
    await expect.poll(() => tableValues(0)).toContain('A-01');
    await expect.poll(() => tableValues(1)).toContain('TMP-1');
    const dialog = page.getByRole('dialog', {
      name: messages[locale]['collection.deleteSelected'],
      exact: true,
    });
    await selectRow(0);
    await remove(0).click();
    await expect.poll(() => dialog.isVisible()).toBe(true);
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
      .click();
    await expect.poll(() => tableValues(0)).toContain('A-01');
    await selectRow(1);
    await remove(1).click();
    await expect.poll(() => tableValues(1)).not.toContain('TMP-1');
    await expect.poll(() => dialog.count()).toBe(0);

    const nextConfig = structuredClone(config);
    nextConfig.jsonformsExtended.confirmation.default = 'never';
    await applyDemoEditor(page, locale, 'Config', nextConfig);
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    const firstRow = panel
      .getByRole('table')
      .first()
      .getByRole('checkbox', {
        name: messages[locale]['collection.selectRow'].replace('{index}', '1'),
        exact: true,
      });
    if (!(await firstRow.isChecked())) await firstRow.click();
    await remove(0).click();
    await expect.poll(() => tableValues(0)).not.toContain('A-01');
    await expect.poll(() => dialog.count()).toBe(0);
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);

demoTest(
  'destructive confirmation oneOf branch change',
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
      `${base}/${family}/#/examples/spec-destructive-confirmation?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section4.label'],
        exact: true,
      })
      .click();
    const email = page.locator('input[id*="/properties/email"]:visible');
    await expect.poll(() => email.inputValue()).toBe('support@example.test');
    const choosePhone = async () => {
      if (family === 'flowbite') {
        await page.locator('select[id*="/properties/contact"]:visible').selectOption('1');
      } else {
        const trigger =
          family === 'shadcn'
            ? page.locator('button[id*="/properties/contact"][aria-haspopup="listbox"]:visible')
            : page
                .locator('input[id*="/properties/contact"]:visible')
                .locator('..')
                .locator('button[aria-haspopup="listbox"]');
        await trigger.click();
        await page
          .getByRole('option', {
            name: translations[locale][
              'specDestructiveConfirmation.schema.properties.contact.oneOf.1.label'
            ],
            exact: true,
          })
          .click();
      }
    };
    const dialog = page
      .getByRole('dialog')
      .filter({ hasText: translations[locale]['confirm.branchChange.title'] });
    await choosePhone();
    await expect.poll(() => dialog.isVisible()).toBe(true);
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
      .click();
    await expect.poll(() => email.inputValue()).toBe('support@example.test');
    await choosePhone();
    await expect.poll(() => dialog.isVisible()).toBe(true);
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
      .click();
    await expect.poll(() => email.count()).toBe(0);
    const phone = page.locator('input[id*="/properties/phone"]:visible');
    await expect.poll(() => phone.count()).toBe(1);
    const clear = page.locator(`button[aria-label="${messages[locale]['oneOf.clear']}"]`);
    if (family !== 'flowbite') {
      if (family === 'skeleton') {
        await page.locator('input[id*="/properties/contact"]:visible').focus();
        await expect.poll(() => clear.isVisible()).toBe(true);
      }
      await clear.evaluate((node) => (node as HTMLButtonElement).focus());
      const hint = page
        .locator(
          family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible',
        )
        .filter({ hasText: messages[locale]['oneOf.clear'] })
        .first();
      await expect.poll(() => hint.isVisible()).toBe(true);
      expect(await hint.evaluate((node) => node.getRootNode() instanceof ShadowRoot)).toBe(
        webcomponent,
      );
      expect(await hint.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe(
        'rgba(0, 0, 0, 0)',
      );
      await page.keyboard.press('Escape');
      await expect.poll(() => hint.isVisible()).toBe(false);
      await expect.poll(() => clear.evaluate((node) => node.matches(':focus'))).toBe(true);
    }
    const clickClear = async () => {
      if (family === 'skeleton') {
        await clear.evaluate((node) => (node as HTMLButtonElement).click());
      } else {
        if (family === 'flowbite') {
          await clear.locator('..').hover();
        }
        await clear.click();
      }
    };
    await clickClear();
    await expect.poll(() => dialog.isVisible()).toBe(true);
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
      .click();
    await expect.poll(() => phone.count()).toBe(1);
    await clickClear();
    await expect.poll(() => dialog.isVisible()).toBe(true);
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
      .click();
    await expect.poll(() => phone.count()).toBe(0);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const input = page.locator(
      '.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context',
    );
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('ControlOrMeta+C');
    await expect
      .poll(
        async () => JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).contact,
      )
      .toBeUndefined();
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);

demoTest(
  'destructive confirmation mixed type change',
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
      `${base}/${family}/#/examples/spec-destructive-confirmation?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section3.label'],
        exact: true,
      })
      .click();
    const selector = page.locator('[id*="/properties/payload"][id$="-input-selector"]:visible');
    const selectType = async (target: typeof selector, type: string) => {
      if (family === 'flowbite') {
        await target.selectOption({ label: type });
      } else if (family === 'shadcn') {
        await target.click();
        await page.getByRole('option', { name: type, exact: true }).click();
      } else {
        await target.locator('..').locator('[data-part="trigger"]').click();
        const contentId = await target.getAttribute('aria-controls');
        await page
          .locator(`[id="${contentId}"] [data-part="item"]`)
          .filter({ hasText: type })
          .click();
      }
    };
    const selectString = () => selectType(selector, 'string');
    const dialog = page
      .getByRole('dialog')
      .filter({ hasText: translations[locale]['confirm.typeChange.title'] });
    await selectString();
    await expect.poll(() => dialog.isVisible()).toBe(true);
    await expect
      .poll(() => dialog.textContent())
      .toContain(translations[locale]['confirm.typeChange.message']);
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
      .click();
    await expect.poll(() => dialog.count()).toBe(0);
    await selectString();
    await expect.poll(() => dialog.isVisible()).toBe(true);
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
      .click();
    const scalarSelector = page.locator(
      '[id*="/properties/scalar"][id$="-input-selector"]:visible',
    );
    await selectType(scalarSelector, 'number');
    await expect.poll(() => dialog.count()).toBe(0);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const input = page.locator(
      '.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context',
    );
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('ControlOrMeta+C');
    await expect
      .poll(
        async () =>
          typeof JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).scalar,
      )
      .toBe('number');
    await expect
      .poll(
        async () => JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).payload,
      )
      .toBe('');

    await applyDemoEditor(page, locale, 'Data', { ...original, payload: {} });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section3.label'],
        exact: true,
      })
      .click();
    await selectString();
    await expect.poll(() => dialog.count()).toBe(0);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('ControlOrMeta+C');
    await expect
      .poll(
        async () => JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).payload,
      )
      .toBe('');
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);

demoTest(
  'destructive confirmation mixed tree delete',
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
      `${base}/${family}/#/examples/spec-destructive-confirmation?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section3.label'],
        exact: true,
      })
      .click();
    const tree = page.getByRole('tree').first();
    const root = tree.getByRole('treeitem').first();
    if ((await root.getAttribute('aria-expanded')) === 'false') {
      if (family === 'flowbite') await root.locator('[role="button"]').first().click();
      else if (family === 'skeleton')
        await root.locator('[data-part="branch-control"]').first().click();
      else await root.locator('button').first().click();
    }
    const remove = tree
      .getByRole('treeitem')
      .filter({ hasText: 'assignment' })
      .locator(`button[title=${JSON.stringify(messages[locale]['mixed.delete'])}]`)
      .first();
    await remove.evaluate((node) => (node as HTMLButtonElement).click());
    const dialog = page
      .getByRole('dialog')
      .filter({ hasText: translations[locale]['confirm.delete.title'] });
    await expect.poll(() => dialog.isVisible()).toBe(true);
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
      .click();
    await expect.poll(() => remove.count()).toBe(1);
    await remove.evaluate((node) => (node as HTMLButtonElement).click());
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
      .click();
    await expect.poll(() => remove.count()).toBe(0);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const input = page.locator(
      '.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context',
    );
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('ControlOrMeta+C');
    const remainingPayload = structuredClone(original.payload) as Record<string, unknown>;
    delete remainingPayload.assignment;
    await expect
      .poll(
        async () => JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).payload,
      )
      .toEqual(remainingPayload);
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);

demoTest(
  'destructive confirmation array presentations',
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
      `${base}/${family}/#/examples/spec-destructive-confirmation?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const panel = page.getByRole('tabpanel', {
      name: translations[locale]['featureNavigation.section2.label'],
      exact: true,
    });
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section2.label'],
        exact: true,
      })
      .click();
    const removeButtons = panel.getByRole('button', {
      name: messages[locale]['array.removeAriaLabel'],
      exact: true,
    });
    await expect.poll(() => removeButtons.count()).toBeGreaterThanOrEqual(4);
    const dialog = page
      .getByRole('dialog')
      .filter({ hasText: translations[locale]['confirm.delete.title'] });
    await removeButtons.first().click();
    await expect.poll(() => dialog.isVisible()).toBe(true);
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
      .click();
    await expect.poll(() => removeButtons.count()).toBeGreaterThanOrEqual(4);
    await removeButtons.first().click();
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
      .click();
    await expect.poll(() => removeButtons.count()).toBeGreaterThanOrEqual(3);
    await removeButtons.nth(1).click();
    await expect.poll(() => dialog.isVisible()).toBe(true);
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
      .click();
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const input = page.locator(
      '.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context',
    );
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('ControlOrMeta+C');
    await expect
      .poll(async () => {
        const data = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
        return { milestones: data.milestones, coordinators: data.coordinators };
      })
      .toEqual({
        milestones: original.milestones.slice(1),
        coordinators: original.coordinators.slice(1),
      });
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);
