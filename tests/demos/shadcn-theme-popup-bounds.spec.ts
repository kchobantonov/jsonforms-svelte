import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';

demoTest(
  'shadcn-theme-popup-bounds',
  async ({ page, family, locale, base }) => {
    await page.setViewportSize({ width: 900, height: 360 });
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/spec-choice-controls?drawer=false`);
    await page.getByRole('button', { name: messages[locale]['theme.customize'] }).click();
    for (const label of [
      messages[locale]['theme.iconLibrary'],
      messages[locale]['theme.font'],
      messages[locale]['theme.menu'],
    ]) {
      const trigger = page.locator(
        `[data-slot="select-trigger"][aria-label=${JSON.stringify(label)}]`,
      );
      await trigger.click();
      const menu = page.locator('[data-slot="select-content"][data-state="open"]');
      await menu.waitFor();
      await expect
        .poll(async () => {
          const bounds = await menu.boundingBox();
          return bounds !== null && bounds.y >= 0 && bounds.y + bounds.height <= 360;
        })
        .toBe(true);

      const lastItem = menu.locator('[data-slot="select-item"]').last();
      await lastItem.scrollIntoViewIfNeeded();
      await expect
        .poll(async () => {
          const [menuBounds, itemBounds] = await Promise.all([
            menu.boundingBox(),
            lastItem.boundingBox(),
          ]);
          return (
            menuBounds !== null &&
            itemBounds !== null &&
            menuBounds.y >= 0 &&
            menuBounds.y + menuBounds.height <= 360 &&
            itemBounds.y >= menuBounds.y &&
            itemBounds.y + itemBounds.height <= menuBounds.y + menuBounds.height
          );
        })
        .toBe(true);
      await page.keyboard.press('Escape');
    }

    await page.getByRole('button', { name: messages[locale]['nav.openSettings'] }).click();
    for (const id of ['validation-mode', 'locale', 'layout']) {
      await page.locator(`[data-slot="select-trigger"]#${id}`).click();
      const menu = page.locator('[data-slot="select-content"][data-state="open"]');
      await menu.waitFor();
      const lastItem = menu.locator('[data-slot="select-item"]').last();
      await lastItem.scrollIntoViewIfNeeded();
      await expect
        .poll(async () => {
          const [menuBounds, itemBounds] = await Promise.all([
            menu.boundingBox(),
            lastItem.boundingBox(),
          ]);
          return (
            menuBounds !== null &&
            itemBounds !== null &&
            menuBounds.y >= 0 &&
            menuBounds.y + menuBounds.height <= 360 &&
            itemBounds.y >= menuBounds.y &&
            itemBounds.y + itemBounds.height <= menuBounds.y + menuBounds.height
          );
        })
        .toBe(true);
      await page.keyboard.press('Escape');
    }
  },
  { families: ['shadcn'], hosts: ['native'] },
);
