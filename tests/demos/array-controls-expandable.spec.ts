import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('array-controls-expandable', async ({ page, family, locale, webcomponent, base }) => {
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

  const tabLabel = translations[locale]['expandableTab.label'];
  await page.getByRole('tab', { name: tabLabel, exact: true }).click();
  const panel = page.getByRole('tabpanel', { name: tabLabel, exact: true });
  const card = (title: string) =>
    panel
      .getByRole('heading', { name: title, exact: true })
      .locator('..')
      .locator('..')
      .locator('..');
  const speakersLabel = fields[locale]['specArrayControls.schema.properties.speakers.label'];
  const announcementsLabel =
    fields[locale]['specArrayControls.schema.properties.announcements.label'];
  const speakers = card(speakersLabel);
  const announcements = card(announcementsLabel);
  const triggers = (container: typeof speakers) =>
    container.locator('button[aria-expanded]:not([aria-haspopup]):not([data-array-panel-toggle])');

  await expect.poll(() => triggers(speakers).count()).toBe(2);
  await expect.poll(() => triggers(speakers).first().getAttribute('aria-expanded')).toBe('true');
  await expect.poll(() => triggers(speakers).last().getAttribute('aria-expanded')).toBe('false');
  await expect.poll(() => triggers(speakers).first().innerText()).toContain('Rosa Iqbal');
  await expect.poll(() => speakers.locator('[data-array-avatar]').count()).toBe(2);
  const removeSpeaker = speakers
    .getByRole('button', { name: messages[locale]['array.removeAriaLabel'], exact: true })
    .first();
  await removeSpeaker.click();
  const deleteDialog = page
    .getByRole('dialog')
    .filter({ hasText: messages[locale]['confirm.delete.title'] });
  await deleteDialog.waitFor();
  expect(
    await deleteDialog.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
  ).toBe(webcomponent);
  expect(
    await deleteDialog.evaluate((element) => getComputedStyle(element).backgroundColor),
  ).not.toBe('rgba(0, 0, 0, 0)');
  await deleteDialog
    .getByRole('button', { name: messages[locale]['confirm.decline'], exact: true })
    .click();
  await expect.poll(() => deleteDialog.count()).toBe(0);
  await expect
    .poll(() => removeSpeaker.evaluate((element) => element.matches(':focus')))
    .toBe(true);
  await expect.poll(() => triggers(speakers).count()).toBe(2);

  const announcementToggle = announcements.locator('[data-array-panel-toggle]');
  await expect.poll(() => announcementToggle.getAttribute('aria-expanded')).toBe('false');
  await announcementToggle.click();
  await expect.poll(() => triggers(announcements).count()).toBe(2);
  await expect
    .poll(() => triggers(announcements).first().getAttribute('aria-expanded'))
    .toBe('false');
  await expect
    .poll(() => triggers(announcements).last().getAttribute('aria-expanded'))
    .toBe('false');
  await expect.poll(() => announcements.locator('[data-array-avatar]').count()).toBe(0);
  await expect
    .poll(() => triggers(announcements).first().innerText())
    .toContain('Doors open at 08:30.');

  const name = speakers.getByRole('textbox', {
    name: fields[locale][
      'specArrayControls.schema.properties.speakers.items.properties.name.label'
    ],
    exact: true,
  });
  await name.fill('Rosa Updated');
  await name.blur();
  await expect.poll(() => triggers(speakers).first().innerText()).toContain('Rosa Updated');

  const speakersToggle = speakers.locator('[data-array-panel-toggle]');
  await triggers(speakers).last().click();
  await expect.poll(() => triggers(speakers).first().getAttribute('aria-expanded')).toBe('false');
  await expect.poll(() => triggers(speakers).last().getAttribute('aria-expanded')).toBe('true');
  await speakersToggle.click();
  await expect.poll(() => speakersToggle.getAttribute('aria-expanded')).toBe('false');
  await speakersToggle.click();
  await expect.poll(() => speakersToggle.getAttribute('aria-expanded')).toBe('true');
  await expect.poll(() => triggers(speakers).first().getAttribute('aria-expanded')).toBe('false');
  await expect.poll(() => triggers(speakers).last().getAttribute('aria-expanded')).toBe('true');
  await expect.poll(() => triggers(speakers).first().innerText()).toContain('Rosa Updated');

  await triggers(announcements).first().click();
  await expect
    .poll(() => triggers(announcements).first().getAttribute('aria-expanded'))
    .toBe('true');
  await announcementToggle.click();
  await expect.poll(() => announcementToggle.getAttribute('aria-expanded')).toBe('false');
  await announcementToggle.click();
  await expect.poll(() => announcementToggle.getAttribute('aria-expanded')).toBe('true');
  await expect
    .poll(() => triggers(announcements).first().getAttribute('aria-expanded'))
    .toBe('true');
  await expect
    .poll(() => triggers(announcements).last().getAttribute('aria-expanded'))
    .toBe('false');
  await announcements
    .getByRole('button', {
      name: messages[locale]['array.addAriaLabelWithLabel'].replace('{label}', announcementsLabel),
      exact: true,
    })
    .click();
  await expect.poll(() => triggers(announcements).count()).toBe(3);
  await expect
    .poll(() => triggers(announcements).last().getAttribute('aria-expanded'))
    .toBe('false');
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
      return [data.speakers[0].name, data.announcements.length];
    })
    .toEqual(['Rosa Updated', 3]);
  expect(pageErrors).toEqual([]);
});
