import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'array-controls-expandable-reorder',
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
      `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const tabLabel = translations[locale]['expandableTab.label'];
    await page.getByRole('tab', { name: tabLabel, exact: true }).click();
    const panel = page.getByRole('tabpanel', { name: tabLabel, exact: true });
    const card = (title: string) =>
      panel
        .getByRole('heading', { name: title, exact: true })
        .locator('..')
        .locator('..')
        .locator('..');
    const speakers = card(fields[locale]['specArrayControls.schema.properties.speakers.label']);
    const announcements = card(
      fields[locale]['specArrayControls.schema.properties.announcements.label'],
    );
    const disclosure = speakers.locator(
      'button[aria-expanded]:not([aria-haspopup]):not([data-array-panel-toggle])',
    );
    const downLabel = messages[locale]['array.downAriaLabel'];
    await expect
      .poll(() => speakers.getByRole('button', { name: downLabel, exact: true }).count())
      .toBe(2);
    await expect
      .poll(() => announcements.getByRole('button', { name: downLabel, exact: true }).count())
      .toBe(0);
    const name = speakers.getByRole('textbox', {
      name: fields[locale][
        'specArrayControls.schema.properties.speakers.items.properties.name.label'
      ],
      exact: true,
    });
    await name.fill('Rosa Updated');
    await name.blur();
    await disclosure.last().click();
    await expect.poll(() => disclosure.last().getAttribute('aria-expanded')).toBe('true');
    const down = speakers.getByRole('button', { name: downLabel, exact: true });
    await expect.poll(() => down.first().isEnabled()).toBe(true);
    await expect.poll(() => down.last().isDisabled()).toBe(true);
    await down.first().click();
    await expect.poll(() => disclosure.first().innerText()).toContain('Tomas Lind');
    await expect.poll(() => disclosure.last().innerText()).toContain('Rosa Updated');
    await expect.poll(() => disclosure.first().getAttribute('aria-expanded')).toBe('true');
    await expect.poll(() => disclosure.last().getAttribute('aria-expanded')).toBe('false');

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
        return data.speakers.map((speaker: { name: string }) => speaker.name);
      })
      .toEqual(['Tomas Lind', 'Rosa Updated']);
    expect(errors).toEqual([]);
  },
  { timeout: 10_000 },
);
