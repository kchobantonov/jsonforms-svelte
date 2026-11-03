import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/translations.json';

demoTest(
  'choice cards remain operable by touch at narrow width',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.setViewportSize({ width: 390, height: 850 });
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
      `${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const labels = translations[locale];
    await page.getByRole('tab', { name: labels['cards.navigation.label'], exact: true }).tap();
    const group = page.getByRole('radiogroup', { name: labels['cardDecision.label'] });
    const approve = group.getByRole('radio', {
      name: labels['cards.approve.label'],
      exact: true,
    });
    const decline = group.getByRole('radio', {
      name: labels['cards.decline.label'],
      exact: true,
    });
    await expect.poll(() => approve.isChecked()).toBe(true);
    await group.locator('label').filter({ hasText: labels['cards.decline.label'] }).first().tap();
    await expect.poll(() => decline.isChecked()).toBe(true);
    await group.locator('label').filter({ hasText: labels['cards.approve.label'] }).first().tap();
    await expect.poll(() => approve.isChecked()).toBe(true);
    const geometry = await group.evaluate((element) => ({
      group: element.getBoundingClientRect().toJSON(),
      cards: [...element.querySelectorAll('label')].map((card) =>
        card.getBoundingClientRect().toJSON(),
      ),
    }));
    expect(geometry.cards).toHaveLength(2);
    for (const card of geometry.cards) {
      expect(card.x).toBeGreaterThanOrEqual(geometry.group.x - 1);
      expect(card.right).toBeLessThanOrEqual(geometry.group.right + 1);
      expect(card.right).toBeLessThanOrEqual(391);
    }
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(390);
    expect(pageErrors).toEqual([]);
  },
  { hasTouch: true, timeout: 30_000 },
);
