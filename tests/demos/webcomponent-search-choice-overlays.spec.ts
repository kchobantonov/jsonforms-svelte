import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'webcomponent-search-choice-overlays',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(
      `${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=true&drawer=false`,
    );
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section5.label'],
        exact: true,
      })
      .click();

    const trigger = page.locator('[id*="/properties/origin-input"]').first();
    if (family === 'skeleton') await trigger.fill('Se');
    else {
      await trigger.click();
      await page
        .getByPlaceholder(messages[locale]['arrayChoices.search'], { exact: true })
        .filter({ visible: true })
        .fill('Se');
    }
    const option = page
      .getByRole('option', { name: 'Seattle', exact: true })
      .and(page.locator('[role=option]'));
    await option.waitFor();
    const popup = option.locator(
      'xpath=ancestor::*[@role="dialog" or @data-slot="popover-content" or (@data-scope="combobox" and @data-part="content")][1]',
    );
    await popup.waitFor();
    expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      true,
    );
    const bounds = await popup.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(900);
    await expect
      .poll(() =>
        option.evaluate((element) => {
          const box = element.getBoundingClientRect();
          const x = box.left + box.width / 2;
          const y = box.top + box.height / 2;
          let hit: Element | null = document.elementFromPoint(x, y);
          while (hit?.shadowRoot) hit = hit.shadowRoot.elementFromPoint(x, y);
          return !!hit && element.contains(hit);
        }),
      )
      .toBe(true);
    await page.keyboard.press('Escape');
    await popup.waitFor({ state: 'hidden' });
    await expect.poll(() => trigger.evaluate((element) => element.matches(':focus'))).toBe(true);
    expect(errors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 45_000 },
);
