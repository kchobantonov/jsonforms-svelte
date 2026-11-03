import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import demoMessages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-additional-properties/translations.json';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest('additional-properties', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const addButtons = page.locator('[data-additional-properties]:visible');
  await expect.poll(() => addButtons.count()).toBe(3);
  for (const card of await addButtons.all()) {
    const propertyName = card.getByRole('textbox', {
      name: messages[locale]['additionalProperties.propertyNameLabel'],
      exact: true,
    });
    const add = card.getByRole('button', {
      name: new RegExp('^' + messages[locale]['additionalProperties.addTo'].split('{label}')[0]),
    });
    await expect
      .poll(async () => {
        const inputBox = await propertyName.boundingBox();
        const buttonBox = await add.boundingBox();
        if (!inputBox || !buttonBox) return false;
        return (
          Math.abs(buttonBox.y + buttonBox.height / 2 - (inputBox.y + inputBox.height / 2)) <= 5
        );
      })
      .toBe(true);
  }
  const invalidName = page.locator('.property-name-invalid').filter({ hasText: 'sensor-x' });
  await expect.poll(() => invalidName.count()).toBe(1);
  await expect.poll(() => invalidName.locator('[data-property-name-error]').count()).toBe(1);
  const sensorLabel = invalidName.locator('label').filter({ hasText: 'sensor-x' });
  const marker = invalidName.locator('[data-property-name-error]');
  await expect
    .poll(async () => {
      const labelBox = await sensorLabel.boundingBox();
      const markerBox = await marker.boundingBox();
      return (
        !!labelBox &&
        !!markerBox &&
        markerBox.x >= labelBox.x + labelBox.width - 2 &&
        markerBox.x <= labelBox.x + labelBox.width + 20 &&
        Math.abs(markerBox.y + markerBox.height / 2 - (labelBox.y + labelBox.height / 2)) < 8
      );
    })
    .toBe(true);
  expect((await marker.textContent())?.trim()).toBe('');
  const errorTrigger = marker.getByRole('button', { name: messages[locale]['validation.errors'] });
  if (family === 'shadcn') await errorTrigger.hover();
  else await errorTrigger.click();
  const localSummary = page.locator('[data-error-summary]:visible');
  await expect.poll(() => localSummary.count()).toBe(1);
  const validationPopup = localSummary.locator(
    'xpath=ancestor::*[@role="dialog" or @data-slot="popover-content"][1]',
  );
  expect(
    await validationPopup.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
  ).toBe(webcomponent);
  expect(
    await validationPopup.evaluate((element) => getComputedStyle(element).backgroundColor),
  ).not.toBe('rgba(0, 0, 0, 0)');
  const localMessage = (await localSummary.textContent())?.trim();
  expect(localMessage).toContain('9');
  const validLabel = page.locator('label').filter({ hasText: 'sensor-deck-a' });
  expect(await sensorLabel.evaluate((node) => getComputedStyle(node).color)).not.toBe(
    await validLabel.evaluate((node) => getComputedStyle(node).color),
  );
  const renameTrigger = invalidName.getByRole('button', {
    name: messages[locale]['additionalProperties.renameNamed'].replace('{name}', 'sensor-x'),
  });
  await renameTrigger.click();
  const renameDialog = page.getByRole('dialog').filter({
    has: page.getByText(messages[locale]['additionalProperties.renameDialogTitle'], {
      exact: true,
    }),
  });
  expect(
    await renameDialog.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
  ).toBe(webcomponent);
  expect(
    await renameDialog.evaluate((element) => getComputedStyle(element).backgroundColor),
  ).not.toBe('rgba(0, 0, 0, 0)');
  await expect
    .poll(() =>
      renameDialog
        .getByText(messages[locale]['additionalProperties.renameDialogTitle'], { exact: true })
        .count(),
    )
    .toBe(1);
  await expect
    .poll(() =>
      renameDialog
        .getByText(messages[locale]['additionalProperties.renameDialogDescription'], {
          exact: true,
        })
        .count(),
    )
    .toBe(1);
  const importedRename = renameDialog.getByRole('textbox', {
    name: messages[locale]['additionalProperties.renamePropertyNameLabel'],
  });
  await expect.poll(() => importedRename.getAttribute('aria-invalid')).toBe('true');
  const renameError = renameDialog.getByRole('alert');
  await expect.poll(() => renameError.textContent()).toContain('9');
  expect(localMessage).toBe((await renameError.textContent())?.trim());
  await importedRename.fill('sensor-z');
  await expect.poll(() => renameError.textContent()).toBe(localMessage);
  await importedRename.fill('senso');
  await expect.poll(() => renameError.textContent()).toContain('^sensor-');
  expect(await renameError.textContent()).toContain('9');
  await importedRename.fill('reading-deck');
  await expect.poll(() => renameError.textContent()).toContain('^sensor-');
  expect(await renameError.textContent()).not.toContain('9');
  if (family === 'shadcn') {
    expect(await renameError.evaluate((node) => getComputedStyle(node).color)).toBe(
      await sensorLabel.evaluate((node) => getComputedStyle(node).color),
    );
  }
  await expect
    .poll(() =>
      page
        .getByRole('dialog')
        .getByRole('button', {
          name: messages[locale]['additionalProperties.renameDialogAccept'],
        })
        .isDisabled(),
    )
    .toBe(true);
  await importedRename.fill('sensor-deck-b');
  await expect.poll(() => importedRename.getAttribute('aria-invalid')).not.toBe('true');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: messages[locale]['additionalProperties.renameDialogDecline'] })
    .click();
  await renameDialog.waitFor({ state: 'hidden' });
  await expect
    .poll(() => renameTrigger.evaluate((element) => element.matches(':focus')))
    .toBe(true);
  await expect.poll(() => invalidName.count()).toBe(1);
  await renameTrigger.click();
  await importedRename.fill('sensor-deck-b');
  await renameDialog
    .getByRole('button', { name: messages[locale]['additionalProperties.renameDialogAccept'] })
    .click();
  await renameDialog.waitFor({ state: 'hidden' });
  await expect.poll(() => invalidName.count()).toBe(0);
  await expect.poll(() => localSummary.count()).toBe(0);
  await expect
    .poll(() => page.getByRole('spinbutton', { name: 'sensor-deck-b', exact: true }).inputValue())
    .toBe('9.1');
  const supplier = page.locator('[data-additional-properties]:visible').nth(2);
  const supplierName = supplier.getByRole('textbox', {
    name: messages[locale]['additionalProperties.propertyNameLabel'],
    exact: true,
  });
  const supplierAdd = supplier.getByRole('button', {
    name: new RegExp('^' + messages[locale]['additionalProperties.addTo'].split('{label}')[0]),
  });
  await supplierName.fill('x-other-id');
  await expect.poll(() => supplierAdd.isDisabled()).toBe(true);
  await supplierName.fill('x-supplier-new');
  await expect.poll(() => supplierAdd.isEnabled()).toBe(true);
  await supplierAdd.click();
  await expect
    .poll(() => supplier.getByRole('textbox', { name: 'x-supplier-new', exact: true }).count())
    .toBe(1);
  const bracket = page.getByRole('textbox', { name: 'items[0]', exact: true });
  await expect.poll(() => bracket.inputValue()).toBe('crate');
  await bracket.fill('Edited bracket key');
  const empty = page.getByRole('textbox', { name: '', exact: true });
  assert.equal(await empty.inputValue(), 'unnamed label');
  await empty.fill('Edited empty key');
  const imported = page.getByRole('tab', {
    name: translations[locale]['featureNavigation.section2.label'],
    exact: true,
  });
  const dynamic = page.getByRole('tab', {
    name: translations[locale]['featureNavigation.section1.label'],
    exact: true,
  });
  await imported.click();
  const dotted = page.getByRole('textbox', { name: 'legacy.key', exact: true });
  assert.equal(await dotted.inputValue(), 'written by the old project system');
  await dotted.fill('Edited literal dot');
  assert.equal(
    await page.getByRole('textbox', { name: 'notes/1', exact: true }).inputValue(),
    'a slash is an ordinary character in a key',
  );
  await dynamic.click();
  await expect.poll(() => bracket.inputValue()).toBe('Edited bracket key');
  assert.equal(await empty.inputValue(), 'Edited empty key');
  assert.equal(
    await page.getByRole('textbox', { name: '2024', exact: true }).inputValue(),
    'season',
  );
  await imported.click();
  await expect.poll(() => dotted.inputValue()).toBe('Edited literal dot');
  const properties = page.locator('[data-additional-properties]').filter({ has: dotted });
  const name = properties.getByRole('textbox', {
    name: messages[locale]['additionalProperties.propertyNameLabel'],
    exact: true,
  });
  await name.fill('added.key');
  await name.blur();
  const add = properties.getByRole('button', {
    name: new RegExp('^' + messages[locale]['additionalProperties.addTo'].split('{label}')[0]),
  });
  await dotted.evaluate((node) => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    (node as HTMLInputElement).value = 'Pending literal value';
    node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  await add.evaluate((node) => (node as HTMLButtonElement).click());
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  expect(await page.getByRole('textbox', { name: 'added.key', exact: true }).count()).toBe(0);
  await dotted.evaluate((node) =>
    node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })),
  );
  await add.evaluate((node) => {
    (node as HTMLButtonElement).click();
    (node as HTMLButtonElement).click();
  });
  const added = page.getByRole('textbox', { name: 'added.key', exact: true });
  await expect.poll(() => added.count()).toBe(1);
  expect(await added.inputValue()).toBe('');
  await dotted.evaluate((node) => {
    (node as HTMLInputElement).value = 'Renamed draft';
    node.dispatchEvent(new InputEvent('input', { bubbles: true }));
  });
  await properties
    .getByRole('button', {
      name: new RegExp(
        '^' + messages[locale]['additionalProperties.renameNamed'].split('{name}')[0],
      ),
    })
    .first()
    .evaluate((node) => (node as HTMLButtonElement).click());
  const renameName = page.getByRole('dialog').getByRole('textbox', {
    name: messages[locale]['additionalProperties.renamePropertyNameLabel'],
    exact: true,
  });
  await renameName.waitFor();
  await renameName.evaluate((node) => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    (node as HTMLInputElement).value = 'renamed.key';
    node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    node.closest('form')!.requestSubmit();
  });
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  expect(
    await page
      .getByRole('textbox', { name: 'legacy.key', exact: true, includeHidden: true })
      .count(),
  ).toBe(1);
  await renameName.evaluate((node) => {
    node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    node.closest('form')!.requestSubmit();
  });
  await expect
    .poll(() => page.getByRole('textbox', { name: 'renamed.key', exact: true }).inputValue())
    .toBe('Renamed draft');
  expect(await dotted.count()).toBe(0);
  expect(await page.getByRole('textbox', { name: 'notes/1', exact: true }).inputValue()).toBe(
    'a slash is an ordinary character in a key',
  );
  expect(await added.inputValue()).toBe('');
  assert.deepEqual(errors, []);
});

demoTest(
  'additional-property-add-alignment-invalid',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(
      `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const telemetry = page.locator('[data-additional-properties]:visible').nth(1);
    const propertyName = telemetry.getByRole('textbox', {
      name: messages[locale]['additionalProperties.propertyNameLabel'],
      exact: true,
    });
    await propertyName.fill('x');
    await expect.poll(() => propertyName.getAttribute('aria-invalid')).toBe('true');
    const add = telemetry.getByRole('button', {
      name: new RegExp('^' + messages[locale]['additionalProperties.addTo'].split('{label}')[0]),
    });
    await expect
      .poll(async () => {
        const inputBox = await propertyName.boundingBox();
        const buttonBox = await add.boundingBox();
        if (!inputBox || !buttonBox) return false;
        return (
          Math.abs(buttonBox.y + buttonBox.height / 2 - (inputBox.y + inputBox.height / 2)) <= 5
        );
      })
      .toBe(true);
  },
  { families: ['shadcn'] },
);

demoTest(
  'additional-property-name-draft-constraints',
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
      `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const telemetry = page.locator('[data-additional-properties]:visible').nth(1);
    const propertyName = telemetry.getByRole('textbox', {
      name: messages[locale]['additionalProperties.propertyNameLabel'],
      exact: true,
    });
    const add = telemetry.getByRole('button', {
      name: new RegExp('^' + messages[locale]['additionalProperties.addTo'].split('{label}')[0]),
    });
    await propertyName.fill('sensor-z');
    await expect.poll(() => telemetry.getByRole('alert').textContent()).toContain('9');
    await expect.poll(() => add.isDisabled()).toBe(true);
    await propertyName.fill('senso');
    await expect.poll(() => telemetry.getByRole('alert').textContent()).toContain('^sensor-');
    expect(await telemetry.getByRole('alert').textContent()).toContain('9');
    await propertyName.fill('sensor-deck-b');
    await expect.poll(() => add.isEnabled()).toBe(true);
    assert.deepEqual(errors, []);
  },
);

demoTest(
  'additional-property-host-format',
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
      `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(page, locale, 'Schema', {
      type: 'object',
      properties: {
        scheduleNames: {
          type: 'object',
          title: 'Scheduled labels',
          propertyNames: { format: 'cron' },
          additionalProperties: { type: 'string' },
        },
      },
    });
    await applyDemoEditor(page, locale, 'UI Schema', {
      type: 'Control',
      scope: '#/properties/scheduleNames',
    });
    await applyDemoEditor(page, locale, 'Data', {
      scheduleNames: { '0 0/15 * * * *': 'Quarter-hour sync' },
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    const card = page.locator('[data-additional-properties]:visible');
    await expect.poll(() => card.count()).toBe(1);
    const propertyName = card.getByRole('textbox', {
      name: messages[locale]['additionalProperties.propertyNameLabel'],
      exact: true,
    });
    const add = card.getByRole('button', {
      name: new RegExp('^' + messages[locale]['additionalProperties.addTo'].split('{label}')[0]),
    });
    await propertyName.fill('draft');
    await expect.poll(() => card.getByRole('alert').textContent()).toContain('cron');
    await expect.poll(() => add.isDisabled()).toBe(true);
    await card
      .getByRole('button', {
        name: new RegExp(
          '^' + messages[locale]['additionalProperties.renameNamed'].split('{name}')[0],
        ),
      })
      .click();
    const dialog = page.getByRole('dialog');
    const rename = dialog.getByRole('textbox', {
      name: messages[locale]['additionalProperties.renamePropertyNameLabel'],
    });
    await rename.fill('draft');
    await expect.poll(() => dialog.getByRole('alert').textContent()).toContain('cron');
    await expect
      .poll(() =>
        dialog
          .getByRole('button', {
            name: messages[locale]['additionalProperties.renameDialogAccept'],
          })
          .isDisabled(),
      )
      .toBe(true);
    await dialog
      .getByRole('button', { name: messages[locale]['additionalProperties.renameDialogDecline'] })
      .click();
    await dialog.waitFor({ state: 'hidden' });
    await propertyName.fill('0 5 * * * *');
    await expect.poll(() => add.isEnabled()).toBe(true);
    assert.deepEqual(errors, []);
  },
);

demoTest(
  'additional-property-overlapping-patterns',
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
      `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(page, locale, 'Schema', {
      type: 'object',
      properties: {
        readings: {
          type: 'object',
          title: 'Pattern readings',
          additionalProperties: false,
          patternProperties: {
            '^sensor-': { type: 'number', minimum: 1 },
            '-a$': { type: 'number', minimum: 5 },
          },
        },
      },
    });
    await applyDemoEditor(page, locale, 'UI Schema', {
      type: 'Control',
      scope: '#/properties/readings',
    });
    await applyDemoEditor(page, locale, 'Data', {
      readings: { 'sensor-a': 3 },
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    const card = page.locator('[data-additional-properties]:visible');
    await expect.poll(() => card.count()).toBe(1);
    const propertyName = card.getByRole('textbox', {
      name: messages[locale]['additionalProperties.propertyNameLabel'],
      exact: true,
    });
    const add = card.getByRole('button', {
      name: new RegExp('^' + messages[locale]['additionalProperties.addTo'].split('{label}')[0]),
    });
    await propertyName.fill('unknown');
    await expect.poll(() => add.isDisabled()).toBe(true);
    await propertyName.fill('sensor-a');
    await expect.poll(() => add.isDisabled()).toBe(true);
    await propertyName.fill('sensor-b');
    await expect.poll(() => add.isEnabled()).toBe(true);
    await add.click();
    await expect.poll(() => card.getByRole('spinbutton', { name: 'sensor-b' }).count()).toBe(1);
    const constrained = card.getByRole('spinbutton', { name: 'sensor-a' });
    await expect.poll(() => constrained.inputValue()).toBe('3');
    await constrained.fill('4');
    await constrained.blur();
    await expect.poll(() => constrained.getAttribute('aria-invalid')).toBe('true');
    await constrained.fill('6');
    await expect.poll(() => constrained.inputValue()).toBe('6');
    await expect.poll(() => constrained.getAttribute('aria-invalid')).not.toBe('true');
    assert.deepEqual(errors, []);
  },
);

demoTest(
  'additional-property-literal-delete',
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
      `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(page, locale, 'Schema', {
      type: 'object',
      properties: {
        value: {
          type: 'object',
          properties: {
            nested: {
              type: 'object',
              properties: { key: { type: 'string' } },
            },
          },
          additionalProperties: { type: 'string' },
        },
      },
    });
    await applyDemoEditor(page, locale, 'UI Schema', {
      type: 'Control',
      scope: '#/properties/value',
    });
    await applyDemoEditor(page, locale, 'Data', {
      value: { 'nested.key': 'literal', nested: { key: 'nested' } },
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    const card = page.locator('[data-additional-properties]:visible');
    const literal = card.getByRole('textbox', { name: 'nested.key', exact: true });
    const nested = page.getByRole('textbox', { name: 'Key', exact: true });
    await expect.poll(() => literal.inputValue()).toBe('literal');
    await expect.poll(() => nested.inputValue()).toBe('nested');
    const renameLabel = messages[locale]['additionalProperties.renameNamed'].replace(
      '{name}',
      'nested.key',
    );
    const row = literal.locator(`xpath=ancestor::div[.//button[@aria-label="${renameLabel}"]][1]`);
    await row.getByRole('button', { name: renameLabel }).click();
    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('textbox', {
        name: messages[locale]['additionalProperties.renamePropertyNameLabel'],
      })
      .fill('renamed.key');
    await dialog
      .getByRole('button', { name: messages[locale]['additionalProperties.renameDialogAccept'] })
      .click();
    await dialog.waitFor({ state: 'hidden' });
    const renamed = card.getByRole('textbox', { name: 'renamed.key', exact: true });
    await expect.poll(() => renamed.inputValue()).toBe('literal');
    await expect.poll(() => nested.inputValue()).toBe('nested');
    const removeLabel = messages[locale]['additionalProperties.deleteNamed'].replace(
      '{name}',
      'renamed.key',
    );
    const renamedRow = renamed.locator(
      `xpath=ancestor::div[.//button[@aria-label="${removeLabel}"]][1]`,
    );
    await renamedRow.getByRole('button', { name: removeLabel }).click();
    await expect.poll(() => renamed.count()).toBe(0);
    await expect.poll(() => nested.inputValue()).toBe('nested');
    assert.deepEqual(errors, []);
  },
  { timeout: 20_000 },
);

demoTest(
  'additional-property-boolean-value-schemas',
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
      `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(page, locale, 'Schema', {
      type: 'object',
      properties: {
        open: { type: 'object', title: 'Open values', additionalProperties: true },
        closed: {
          type: 'object',
          title: 'Closed values',
          patternProperties: { '^blocked-': false },
          additionalProperties: false,
        },
      },
    });
    await applyDemoEditor(page, locale, 'UI Schema', {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/open' },
        { type: 'Control', scope: '#/properties/closed' },
      ],
    });
    await applyDemoEditor(page, locale, 'Data', {
      open: null,
      closed: { 'blocked-a': 'imported' },
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    const cards = page.locator('[data-additional-properties]:visible');
    await expect.poll(() => cards.count()).toBe(2);
    const open = cards.nth(0);
    const propertyName = open.getByRole('textbox', {
      name: messages[locale]['additionalProperties.propertyNameLabel'],
      exact: true,
    });
    const add = open.getByRole('button', {
      name: new RegExp('^' + messages[locale]['additionalProperties.addTo'].split('{label}')[0]),
    });
    await propertyName.fill('new-key');
    await expect.poll(() => add.isEnabled()).toBe(true);
    await add.click();
    await expect.poll(() => open.getByRole('textbox', { name: 'new-key' }).count()).toBe(1);
    const closed = cards.nth(1);
    await expect
      .poll(() => closed.getByText('blocked-a', { exact: true }).count())
      .toBeGreaterThan(0);
    await expect.poll(() => closed.locator('[aria-invalid="true"]').count()).toBeGreaterThan(0);
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const dataText = async () =>
      (
        await page.locator('.monaco-editor:visible').last().locator('.view-lines').innerText()
      ).replaceAll('\u00a0', ' ');
    await expect.poll(dataText).toContain('"open": {');
    await expect.poll(dataText).toContain('"new-key": ""');
    await expect.poll(dataText).toContain('"blocked-a": "imported"');
    assert.deepEqual(errors, []);
  },
  { timeout: 20_000 },
);

demoTest(
  'additional-property-static-and-dynamic-boundary',
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
      `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const title = translations[locale]['featureNavigation.staticAndDynamic.label'];
    await page.getByRole('tab', { name: title, exact: true }).click();
    const panel = page.getByRole('tabpanel', { name: title, exact: true });
    await expect.poll(() => panel.locator('[data-group-frame]').count()).toBe(1);
    await expect.poll(() => panel.locator('[data-object-static-fields]').count()).toBe(1);
    await expect.poll(() => panel.locator('[data-additional-properties]').count()).toBe(1);
    expect(await panel.locator('[data-object-boundary]').count()).toBe(0);

    const staticFields = panel.locator('[data-object-static-fields]');
    const dynamicFields = panel.locator('[data-additional-properties]');
    await expect.poll(() => staticFields.locator('input').count()).toBe(2);
    await expect.poll(() => dynamicFields.locator('input').count()).toBe(3);
    const reference = staticFields.getByRole('textbox').first();
    const warehouse = dynamicFields.getByRole('textbox', { name: 'warehouse', exact: true });
    await expect
      .poll(() => dynamicFields.getByRole('textbox', { name: 'handling', exact: true }).count())
      .toBe(1);
    await expect.poll(() => reference.inputValue()).toBe('INV-204');
    await expect.poll(() => warehouse.inputValue()).toBe('Portland');
    await reference.fill('INV-205');
    await warehouse.fill('Boston');

    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section1.label'],
        exact: true,
      })
      .click();
    await page.getByRole('tab', { name: title, exact: true }).click();
    await expect.poll(() => reference.inputValue()).toBe('INV-205');
    await expect.poll(() => warehouse.inputValue()).toBe('Boston');
    assert.deepEqual(errors, []);
  },
);

demoTest(
  'additional-property-empty-add-draft-feedback',
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
      `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const labels = page.locator('[data-additional-properties]:visible').first();
    const propertyName = labels.getByRole('textbox', {
      name: messages[locale]['additionalProperties.propertyNameLabel'],
      exact: true,
    });
    const add = labels.getByRole('button', {
      name: new RegExp('^' + messages[locale]['additionalProperties.addTo'].split('{label}')[0]),
    });
    await expect.poll(() => propertyName.inputValue()).toBe('');
    await expect.poll(() => add.isDisabled()).toBe(true);
    await expect.poll(() => labels.locator('[data-property-name-error]').count()).toBe(0);

    await propertyName.fill('destination');
    await propertyName.blur();
    await expect.poll(() => add.isDisabled()).toBe(true);
    await expect.poll(() => labels.getByRole('alert').count()).toBeGreaterThan(0);
    await propertyName.fill('');
    await expect.poll(() => labels.getByRole('alert').count()).toBe(0);
    await expect.poll(() => add.isDisabled()).toBe(true);

    const empty = labels.getByRole('textbox', { name: '', exact: true });
    await expect.poll(() => empty.inputValue()).toBe('unnamed label');
    const removeLabel = messages[locale]['additionalProperties.deleteNamed'].replace('{name}', '');
    const row = empty.locator(`xpath=ancestor::div[.//button[@aria-label="${removeLabel}"]][1]`);
    await row.locator(`button[aria-label=${JSON.stringify(removeLabel)}]`).click();
    await expect.poll(() => empty.count()).toBe(0);
    await expect.poll(() => add.isEnabled()).toBe(true);
    await expect.poll(() => labels.locator('[data-property-name-error]').count()).toBe(0);
    await add.click();
    await expect.poll(() => labels.getByRole('textbox', { name: '', exact: true }).count()).toBe(1);
    assert.deepEqual(errors, []);
  },
);

demoTest(
  'additional-property-prototype-looking-add',
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
      `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const labels = page.locator('[data-additional-properties]:visible').first();
    const propertyName = labels.getByRole('textbox', {
      name: messages[locale]['additionalProperties.propertyNameLabel'],
      exact: true,
    });
    const add = labels.getByRole('button', {
      name: new RegExp('^' + messages[locale]['additionalProperties.addTo'].split('{label}')[0]),
    });
    await propertyName.fill('__proto__');
    await expect.poll(() => add.isEnabled()).toBe(true);
    await add.click();
    const value = labels.getByRole('textbox', { name: '__proto__', exact: true });
    await expect.poll(() => value.count()).toBe(1);
    await value.fill('ordinary own key');

    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const editorText = async () =>
      (
        await page.locator('.monaco-editor:visible').last().locator('.view-lines').innerText()
      ).replaceAll('\u00a0', ' ');
    await expect.poll(editorText).toContain('"__proto__"');
    await expect.poll(editorText).toContain('ordinary own key');
    await expect.poll(editorText).toContain('destination');
    assert.deepEqual(errors, []);
  },
);

demoTest(
  'additional-property-global-empty-name-setting-and-local-overrides',
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
      `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const tab = (key: keyof typeof translations.en) =>
      page.getByRole('tab', { name: translations[locale][key], exact: true });
    const add = (card: ReturnType<typeof page.locator>) =>
      card.getByRole('button', {
        name: new RegExp('^' + messages[locale]['additionalProperties.addTo'].split('{label}')[0]),
      });

    await tab('featureNavigation.section2.label').click();
    const imported = page.locator('[data-additional-properties]:visible');
    await expect.poll(() => add(imported).isEnabled()).toBe(true);
    await tab('featureNavigation.section3.label').click();
    const quota = page.locator('[data-additional-properties]:visible');
    await expect.poll(() => add(quota).isDisabled()).toBe(true);

    await page.getByRole('button', { name: demoMessages[locale]['nav.openSettings'] }).click();
    await page.getByText(demoMessages[locale]['settings.emptyNames'], { exact: true }).click();
    await page
      .getByRole('button', { name: demoMessages[locale]['nav.closeSettings'] })
      .last()
      .click();
    await tab('featureNavigation.section2.label').click();
    await expect.poll(() => add(imported).isDisabled()).toBe(true);
    await tab('featureNavigation.section3.label').click();
    await expect.poll(() => add(quota).isDisabled()).toBe(true);

    await tab('featureNavigation.section1.label').click();
    const labels = page.locator('[data-additional-properties]:visible').first();
    const empty = labels.getByRole('textbox', { name: '', exact: true });
    const removeLabel = messages[locale]['additionalProperties.deleteNamed'].replace('{name}', '');
    const row = empty.locator(`xpath=ancestor::div[.//button[@aria-label="${removeLabel}"]][1]`);
    await row.locator(`button[aria-label=${JSON.stringify(removeLabel)}]`).click();
    await expect.poll(() => empty.count()).toBe(0);
    await expect.poll(() => add(labels).isEnabled()).toBe(true);
    assert.deepEqual(errors, []);
  },
);

demoTest(
  'additional-property-rename-changes-value-schema',
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
      `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await applyDemoEditor(page, locale, 'Schema', {
      type: 'object',
      properties: {
        readings: {
          type: 'object',
          patternProperties: {
            '^text_': { type: 'string' },
            '^count_': { type: 'integer', minimum: 0 },
          },
          additionalProperties: false,
        },
      },
    });
    await applyDemoEditor(page, locale, 'UI Schema', {
      type: 'Control',
      scope: '#/properties/readings',
    });
    await applyDemoEditor(page, locale, 'Data', {
      readings: { text_quantity: 'five' },
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    const card = page.locator('[data-additional-properties]:visible');
    await expect.poll(() => card.count()).toBe(1);
    await card
      .getByRole('button', {
        name: messages[locale]['additionalProperties.renameNamed'].replace(
          '{name}',
          'text_quantity',
        ),
      })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog
      .getByRole('textbox', {
        name: messages[locale]['additionalProperties.renamePropertyNameLabel'],
      })
      .fill('count_quantity');
    await dialog
      .getByRole('button', { name: messages[locale]['additionalProperties.renameDialogAccept'] })
      .click();
    await dialog.waitFor({ state: 'hidden' });
    const renamed = card.getByRole('spinbutton', { name: 'count_quantity', exact: true });
    await expect.poll(() => renamed.count()).toBe(1);
    await expect.poll(() => renamed.getAttribute('aria-invalid')).toBe('true');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const editorText = async () =>
      (
        await page.locator('.monaco-editor:visible').last().locator('.view-lines').innerText()
      ).replaceAll('\u00a0', ' ');
    await expect.poll(editorText).toContain('"count_quantity": "five"');
    await expect.poll(editorText).not.toContain('"text_quantity"');
    assert.deepEqual(errors, []);
  },
);
