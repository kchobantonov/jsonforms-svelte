import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'array-controls-table-room',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const tabLabel = translations[locale]['tableTab.label'];
    const panel = page.getByRole('tabpanel', { name: tabLabel, exact: true });
    const row = panel.locator('tbody tr').first();
    const roomLabel =
      fields[locale]['specArrayControls.schema.properties.sessions.items.properties.room.label'];
    const nameLabel =
      fields[locale][
        'specArrayControls.schema.properties.sessions.items.properties.room.properties.name.label'
      ];
    const floorLabel =
      fields[locale][
        'specArrayControls.schema.properties.sessions.items.properties.room.properties.floor.label'
      ];
    const editRoom = row.getByRole('button', {
      name: messages[locale]['composite.edit'].replace('{label}', roomLabel),
      exact: true,
    });
    await expect.poll(() => row.textContent()).toContain('Aurora');
    await editRoom.click();
    const dialog = page.getByRole('dialog');
    const name = dialog.getByRole('textbox', { name: nameLabel, exact: true });
    const floor = dialog.getByRole('spinbutton', { name: floorLabel, exact: true });
    await expect.poll(() => name.inputValue()).toBe('Aurora');
    await expect.poll(() => floor.inputValue()).toBe('2');
    await name.fill('Draft room');
    await dialog
      .getByRole('button', { name: messages[locale]['composite.cancel'], exact: true })
      .click();
    await expect.poll(() => row.textContent()).toContain('Aurora');

    await editRoom.click();
    await expect.poll(() => name.inputValue()).toBe('Aurora');
    await name.fill('North Hall');
    await floor.fill('4');
    await dialog
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();
    await expect.poll(() => row.textContent()).toContain('North Hall');

    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await expect
      .poll(async () => {
        await page
          .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
          .focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        const data = JSON.parse(
          await page.evaluate(() => navigator.clipboard.readText()),
        ) as typeof original;
        return data.sessions;
      })
      .toEqual([
        { ...original.sessions[0], room: { name: 'North Hall', floor: 4 } },
        original.sessions[1],
      ]);
    expect(pageErrors).toEqual([]);
  },
  { timeout: 20_000 },
);
