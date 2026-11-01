import { mkdir } from 'node:fs/promises';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import catalog from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-combinators/supplemental-translations.json';

demoTest(
  'composition-generated',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-combinators?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const label = demoEditorLabel(locale, 'UI Schema');
    await page.getByRole('tab', { name: label, exact: true }).click();
    const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
    const editor = toolbar.locator('..').locator('.monaco-editor');
    await editor.locator('.inputarea, .native-edit-context').focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Backspace');
    await toolbar.getByRole('button').nth(1).click();
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await expect.poll(() => page.getByRole('tab', { name: 'allOf', exact: true }).count()).toBe(0);

    const labels = catalog[locale];
    const assetTag = page.locator('input[id*="/properties/assetTag-input"]:visible');
    await expect.poll(() => assetTag.count()).toBe(1);
    await expect
      .poll(() =>
        page
          .locator('input:visible')
          .evaluateAll(
            (nodes) =>
              nodes.filter((node) => (node as HTMLInputElement).value === 'Projector').length,
          ),
      )
      .toBe(1);
    expect(await assetTag.inputValue()).toBe('AB1234');
    await expect.poll(() => page.getByRole('checkbox', { checked: true }).count()).toBe(1);
    for (const key of [
      'specCombinators.schema/properties/equipment/properties/name.label',
      'specCombinators.schema/properties/equipment/allOf/0/properties/assetTag.label',
      'specCombinators.schema/properties/equipment/allOf/1/properties/working.label',
    ] as const) {
      await expect.poll(() => page.getByText(labels[key], { exact: true }).count()).toBe(1);
    }

    const attendees = page.getByLabel(labels['specCombinators.schema/properties/attendees.label'], {
      exact: true,
    });
    const seats = page.getByLabel(labels['specCombinators.schema/properties/seatsPerTable.label'], {
      exact: true,
    });
    await expect.poll(() => attendees.count()).toBe(1);
    await expect.poll(() => seats.count()).toBe(1);
    expect(await attendees.inputValue()).toBe('8');
    expect(await seats.inputValue()).toBe('6');
    for (const input of [attendees, seats]) {
      expect(await input.getAttribute('min')).toBeNull();
      expect(await input.getAttribute('max')).toBeNull();
    }
    if (locale === 'en' && !webcomponent) {
      await mkdir('test-results', { recursive: true });
      await page.screenshot({
        path: `test-results/composition-generated-${family}.png`,
        fullPage: true,
      });
    }

    const room = page.locator('input[id*="/properties/room-input"]');
    await expect.poll(() => room.inputValue()).toBe('Willow Room');
    await page.getByRole('tab', { name: labels.Online, exact: true }).click();
    await page.locator('input[id*="/properties/joinUrl-input"]').waitFor();
    await page.getByRole('tab', { name: labels['On site'], exact: true }).click();
    await expect.poll(() => room.inputValue()).toBe('Willow Room');

    await attendees.fill('30');
    await seats.fill('15');
    await seats.press('Tab');
    await expect.poll(() => attendees.getAttribute('aria-invalid')).toBe('true');
    await expect.poll(() => seats.getAttribute('aria-invalid')).toBe('true');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const lines = page.locator('.monaco-editor:visible .view-lines');
    await lines.waitFor();
    const data = JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' '));
    expect([data.attendees, data.seatsPerTable]).toEqual([30, 15]);
    expect(data.location).toEqual({ room: 'Willow Room' });
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
