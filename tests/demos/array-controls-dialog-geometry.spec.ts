import { expect } from 'vite-plus/test';
import type { Locator } from 'playwright';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';
import fields from '@chobantonov/jsonforms-extended-spec/examples/array-controls/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'array-controls-dialog-geometry',
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
    const tabLabel = translations[locale]['rowDialogTab.label'];
    await page.getByRole('tab', { name: tabLabel, exact: true }).click();
    const panel = page.getByRole('tabpanel', { name: tabLabel, exact: true });
    const dialog = page.getByRole('dialog');
    const exercise = async (surface: Locator, trigger: Locator, width: number) => {
      expect(await dialog.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
        webcomponent,
      );
      expect(
        await dialog.evaluate((element) => getComputedStyle(element).backgroundColor),
      ).not.toBe('rgba(0, 0, 0, 0)');
      const cancelButton = dialog.getByRole('button', {
        name: messages[locale]['composite.cancel'],
        exact: true,
      });
      await cancelButton.hover();
      const actionHint = dialog.getByRole('tooltip', {
        name: messages[locale]['composite.cancelTooltip'],
        exact: true,
      });
      await actionHint.waitFor();
      expect(
        await actionHint.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
      ).toBe(webcomponent);
      expect(
        await actionHint.evaluate((element) => getComputedStyle(element).backgroundColor),
      ).not.toBe('rgba(0, 0, 0, 0)');
      await page.mouse.move(0, 0);
      await expect.poll(() => actionHint.isVisible()).toBe(false);
      await cancelButton.focus();
      await expect.poll(() => actionHint.isVisible()).toBe(true);
      await expect.poll(async () => Math.round((await surface.boundingBox())!.width)).toBe(width);
      const initial = (await surface.boundingBox())!;
      const header = (await surface.locator('[data-detail-dialog-header]').boundingBox())!;
      await page.mouse.move(header.x + 80, header.y + header.height / 2);
      await page.mouse.down();
      await page.mouse.move(header.x, header.y + header.height / 2 - 30, { steps: 8 });
      await page.mouse.up();
      await expect
        .poll(async () => Math.round((await surface.boundingBox())!.x))
        .toBe(Math.round(initial.x - 80));
      const moved = (await surface.boundingBox())!;
      await page.mouse.move(moved.x + moved.width - 3, moved.y + moved.height - 3);
      await page.mouse.down();
      await page.mouse.move(moved.x + moved.width + 37, moved.y + moved.height + 27, { steps: 8 });
      await page.mouse.up();
      await expect
        .poll(async () => (await surface.boundingBox())!.width)
        .toBeGreaterThan(moved.width + 10);
      const resizedWidth = Math.round((await surface.boundingBox())!.width);
      await dialog
        .getByRole('button', { name: messages[locale]['dialog.maximize'], exact: true })
        .click();
      await expect.poll(async () => Math.round((await surface.boundingBox())!.height)).toBe(968);
      await dialog
        .getByRole('button', { name: messages[locale]['dialog.restore'], exact: true })
        .click();
      await expect
        .poll(async () => Math.round((await surface.boundingBox())!.width))
        .toBe(resizedWidth);
      await dialog
        .getByRole('button', { name: messages[locale]['composite.cancel'], exact: true })
        .click();
      await expect.poll(() => dialog.count()).toBe(0);
      await expect.poll(() => trigger.evaluate((element) => element.matches(':focus'))).toBe(true);
    };

    const editRow = panel
      .getByRole('button', {
        name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
        exact: true,
      })
      .first();
    await editRow.click();
    await exercise(dialog, editRow, 900);

    const roomLabel =
      fields[locale]['specArrayControls.schema.properties.sessions.items.properties.room.label'];
    const editRoom = panel
      .locator('tbody tr')
      .first()
      .getByRole('button', {
        name: messages[locale]['composite.edit'].replace('{label}', roomLabel),
        exact: true,
      });
    await editRoom.click();
    await exercise(dialog, editRoom, 720);
    expect(pageErrors).toEqual([]);
  },
  { timeout: 25_000 },
);
