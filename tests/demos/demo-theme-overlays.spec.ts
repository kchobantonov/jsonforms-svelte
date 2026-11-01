import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';

demoTest(
  'demo-theme-overlays',
  async ({ page, family, locale, base }) => {
    await page.setViewportSize({ width: 900, height: 360 });
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/spec-choice-controls?drawer=false`);

    if (family === 'flowbite') {
      await page.locator('#theme-color-trigger').click();
      const menu = page.locator('[popover="manual"]').filter({
        has: page.getByRole('button', { name: messages[locale]['theme.forest'] }),
      });
      await menu.waitFor();
      const bounds = await menu.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(360);
      await menu.getByRole('button', { name: messages[locale]['theme.amber'] }).click();
      await expect.poll(() => menu.isVisible()).toBe(false);
      return;
    }

    await page.getByRole('button', { name: messages[locale]['settings.theme'] }).click();
    const panel = page.locator('[data-scope="popover"][data-part="content"][data-state="open"]');
    await panel.waitFor();
    const lastTheme = panel.locator('button[data-theme]').last();
    await lastTheme.scrollIntoViewIfNeeded();
    const [panelBounds, themeBounds] = await Promise.all([
      panel.boundingBox(),
      lastTheme.boundingBox(),
    ]);
    expect(panelBounds).not.toBeNull();
    expect(themeBounds).not.toBeNull();
    expect(panelBounds!.y).toBeGreaterThanOrEqual(0);
    expect(panelBounds!.y + panelBounds!.height).toBeLessThanOrEqual(360);
    expect(themeBounds!.y).toBeGreaterThanOrEqual(panelBounds!.y);
    expect(themeBounds!.y + themeBounds!.height).toBeLessThanOrEqual(
      panelBounds!.y + panelBounds!.height,
    );
    await lastTheme.click();
  },
  { families: ['flowbite', 'skeleton'], hosts: ['native'] },
);
