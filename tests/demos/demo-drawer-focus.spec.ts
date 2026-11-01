import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';

demoTest(
  'narrow example drawer moves focus in and restores it on Escape',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/${family}/#/examples/spec-presentation?drawer=false`);
    const trigger = page.getByRole('button', {
      name: messages[locale]['nav.showExamples'],
      exact: true,
    });
    await trigger.click();
    const drawer = page.locator('aside').first();
    await expect.poll(() => drawer.isVisible()).toBe(true);
    expect(await drawer.getAttribute('role')).toBe('dialog');
    expect(await drawer.getAttribute('aria-modal')).toBe('true');
    await expect
      .poll(() => drawer.evaluate((node) => node.contains(document.activeElement)))
      .toBe(true);
    await drawer.evaluate((node) => {
      const first = [
        ...node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].find((element) => element.getClientRects().length > 0);
      first?.focus();
    });
    await page.keyboard.press('Shift+Tab');
    await expect
      .poll(() => drawer.evaluate((node) => node.contains(document.activeElement)))
      .toBe(true);
    await page.keyboard.press('Tab');
    await expect
      .poll(() => drawer.evaluate((node) => node.contains(document.activeElement)))
      .toBe(true);
    await page.keyboard.press('Escape');
    await expect.poll(() => drawer.isVisible()).toBe(false);
    await expect.poll(() => trigger.evaluate((node) => node === document.activeElement)).toBe(true);
    await trigger.click();
    await expect.poll(() => drawer.isVisible()).toBe(true);
    await page.mouse.click(378, 420);
    await expect.poll(() => drawer.isVisible()).toBe(false);
    await expect.poll(() => trigger.evaluate((node) => node === document.activeElement)).toBe(true);
  },
  { hosts: ['native'], timeout: 45_000 },
);

demoTest(
  'settings drawer moves focus in and restores it on Escape',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/spec-presentation`);
    const trigger = page.getByRole('button', { name: messages[locale]['nav.openSettings'] });
    await trigger.click();
    const drawer = page.getByRole('dialog');
    await expect.poll(() => drawer.isVisible()).toBe(true);
    await expect
      .poll(() => drawer.getByText(messages[locale]['settings.description']).isVisible())
      .toBe(true);
    await expect
      .poll(() => drawer.evaluate((node) => node.contains(document.activeElement)))
      .toBe(true);
    await page.keyboard.press('Escape');
    await expect.poll(() => drawer.isVisible()).toBe(false);
    await expect.poll(() => trigger.evaluate((node) => node === document.activeElement)).toBe(true);
    await trigger.click();
    await expect.poll(() => drawer.isVisible()).toBe(true);
    await expect
      .poll(() => drawer.evaluate((node) => node.getBoundingClientRect().left < innerWidth))
      .toBe(true);
    await expect
      .poll(() => drawer.evaluate((node) => node.contains(document.activeElement)))
      .toBe(true);
    if (family === 'skeleton') {
      await expect
        .poll(() =>
          page.evaluate(() => {
            const backdrop = document.querySelector<HTMLElement>('[data-part="backdrop"]');
            return backdrop && document.elementFromPoint(500, 420) === backdrop;
          }),
        )
        .toBe(true);
    }
    await page.mouse.click(500, 420);
    await expect.poll(() => drawer.isVisible()).toBe(false);
    await expect.poll(() => trigger.evaluate((node) => node === document.activeElement)).toBe(true);
  },
  { hosts: ['native'], timeout: 45_000 },
);

demoTest(
  'settings drawer scrolls to its final common option',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto(`${base}/${family}/#/examples/spec-presentation`);
    await page.getByRole('button', { name: messages[locale]['nav.openSettings'] }).click();
    const drawer = page.getByRole('dialog');
    await drawer.waitFor();
    const scrollTop = await drawer.evaluate((node) => {
      const scroller = [node, ...node.querySelectorAll<HTMLElement>('*')].find((element) => {
        const overflow = getComputedStyle(element).overflowY;
        return /auto|scroll/.test(overflow) && element.scrollHeight > element.clientHeight + 100;
      });
      if (!scroller) return -1;
      scroller.scrollTop = scroller.scrollHeight;
      return scroller.scrollTop;
    });
    expect(scrollTop).toBeGreaterThan(100);
    const finalOption = drawer.getByText(messages[locale]['settings.additional'], { exact: true });
    await expect.poll(() => finalOption.isVisible()).toBe(true);
    const optionBox = (await finalOption.boundingBox())!;
    const drawerBox = (await drawer.boundingBox())!;
    expect(optionBox.y).toBeGreaterThanOrEqual(drawerBox.y);
    expect(optionBox.y + optionBox.height).toBeLessThanOrEqual(drawerBox.y + drawerBox.height);
  },
  { hosts: ['native'], timeout: 45_000 },
);
