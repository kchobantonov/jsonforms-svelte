import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import jobMessages from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-kitchen-sink/translations.json';

demoTest(
  'shadcn-stepper-bounds',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    await page.goto(
      `${base}/${family}/#/examples/spec-kitchen-sink?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const jobLabel = jobMessages[locale]['jobStep.label'];
    const nav = page
      .locator('[data-slot="stepper-nav"]')
      .filter({ has: page.locator('[data-slot="stepper-trigger"]').filter({ hasText: jobLabel }) })
      .first();
    await nav.waitFor();
    await expect.poll(() => nav.locator('[data-slot="stepper-indicator"]').count()).toBe(4);
    await expect.poll(() => nav.locator('[data-slot="stepper-separator"]').count()).toBe(4);

    const assertNoOverlap = async () => {
      await expect
        .poll(async () => {
          const geometry = await nav.evaluate((element) => {
            const trigger = element.querySelector<HTMLElement>(
              '[data-slot="stepper-trigger"][data-state="active"]',
            );
            const pane = element.parentElement?.parentElement?.querySelector<HTMLElement>(
              ':scope > [role="tabpanel"]:not([hidden])',
            );
            if (!trigger || !pane) return null;
            const navBox = element.getBoundingClientRect();
            const triggerBox = trigger.getBoundingClientRect();
            const paneBox = pane.getBoundingClientRect();
            return {
              navHeight: navBox.height,
              triggerBottom: triggerBox.bottom,
              navBottom: navBox.bottom,
              paneTop: paneBox.top,
            };
          });
          return {
            rendered: !!geometry && geometry.navHeight > 0 && geometry.paneTop > 0,
            triggerWithinNav: !!geometry && geometry.triggerBottom <= geometry.navBottom + 1,
            paneBelowNav: !!geometry && geometry.paneTop >= geometry.navBottom - 1,
          };
        })
        .toEqual({ rendered: true, triggerWithinNav: true, paneBelowNav: true });
    };

    await assertNoOverlap();
    await nav.locator('[data-slot="stepper-trigger"]').filter({ hasText: jobLabel }).click();
    await expect
      .poll(() => nav.locator('[data-slot="stepper-trigger"][data-state="active"]').textContent())
      .toContain(jobLabel);
    await assertNoOverlap();
    await nav.locator('[data-slot="stepper-trigger"][data-state="active"]').press('ArrowRight');
    await expect
      .poll(() => nav.locator('[data-slot="stepper-trigger"][data-state="active"]').textContent())
      .toContain(jobMessages[locale]['referencesStep.label']);
    await assertNoOverlap();
    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoOverlap();
  },
  { families: ['shadcn'] },
);
