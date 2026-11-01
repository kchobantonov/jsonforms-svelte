import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('array-controls-row-details', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const rowAction = messages[locale]['collection.editRowDetails'].replace('{index}', '1');
  const titleLabel =
    fields[locale]['specArrayControls.schema.properties.sessions.items.properties.title.label'];
  const roomNameLabel =
    fields[locale][
      'specArrayControls.schema.properties.sessions.items.properties.room.properties.name.label'
    ];
  const selectMode = async (
    key: 'rowDialogTab.label' | 'rowSideTab.label' | 'rowBottomTab.label',
  ) => {
    const label = translations[locale][key];
    await page.getByRole('tab', { name: label, exact: true }).click();
    return page.getByRole('tabpanel', { name: label, exact: true });
  };

  const dialogPanel = await selectMode('rowDialogTab.label');
  const editDialog = dialogPanel.getByRole('button', { name: rowAction, exact: true }).first();
  await editDialog.click();
  const dialog = page.getByRole('dialog');
  const draftTitle = dialog.getByRole('textbox', { name: titleLabel, exact: true });
  const draftRoom = dialog.getByRole('textbox', { name: roomNameLabel, exact: true });
  await expect.poll(() => draftTitle.inputValue()).toBe('Designing for the second read');
  await expect.poll(() => draftRoom.inputValue()).toBe('Aurora');
  await draftTitle.fill('Uncommitted session');
  await draftRoom.fill('Uncommitted room');
  await dialog
    .getByRole('button', { name: messages[locale]['composite.cancel'], exact: true })
    .click();
  await editDialog.click();
  await expect.poll(() => draftTitle.inputValue()).toBe('Designing for the second read');
  await expect.poll(() => draftRoom.inputValue()).toBe('Aurora');
  await draftTitle.fill('Dialog session');
  await draftRoom.fill('Dialog room');
  await dialog
    .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
    .click();

  const sidePanel = await selectMode('rowSideTab.label');
  await sidePanel.getByRole('button', { name: rowAction, exact: true }).first().click();
  const sideTitle = page.locator('[data-row-detail-panel]:visible').getByRole('textbox', {
    name: titleLabel,
    exact: true,
  });
  await expect.poll(() => sideTitle.inputValue()).toBe('Dialog session');
  await sideTitle.fill('Side session');
  await sideTitle.blur();

  const bottomPanel = await selectMode('rowBottomTab.label');
  await expect.poll(() => page.locator('[data-row-detail-panel]:visible').count()).toBe(0);
  await bottomPanel.getByRole('button', { name: rowAction, exact: true }).first().click();
  const bottomTitle = page.locator('[data-row-detail-panel]:visible').getByRole('textbox', {
    name: titleLabel,
    exact: true,
  });
  await expect.poll(() => bottomTitle.inputValue()).toBe('Side session');
  await bottomTitle.fill('Bottom session');
  await bottomTitle.blur();

  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await expect
    .poll(async () => {
      await page
        .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
        .focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      const data = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      return data.sessions;
    })
    .toEqual([
      {
        ...original.sessions[0],
        title: 'Bottom session',
        room: { ...original.sessions[0].room, name: 'Dialog room' },
      },
      original.sessions[1],
    ]);
  expect(pageErrors).toEqual([]);
});
