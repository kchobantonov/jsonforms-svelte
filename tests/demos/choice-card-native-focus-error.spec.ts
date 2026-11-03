import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/translations.json';

demoTest(
  'choice card native focus and error visuals',
  async ({ page, family, locale, base }) => {
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
      `${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=false&drawer=false`,
    );
    await page.setViewportSize({ width: 390, height: 900 });
    const labels = translations[locale];
    const directory = path.resolve('test-results/choice-card-visual-review');
    await mkdir(directory, { recursive: true });
    for (const mode of ['light', 'dark'] as const) {
      await page.locator('html').evaluate(
        (element, { family, mode }) => {
          element.setAttribute('data-mode', mode);
          element.classList.toggle('dark', mode === 'dark' && family === 'flowbite');
        },
        { family, mode },
      );
      await page.getByRole('tab', { name: labels['cards.navigation.label'], exact: true }).click();
      const visibleRadioGroup = page.getByRole('radiogroup', {
        name: labels['cardAutomatic.label'],
      });
      const medium = visibleRadioGroup.getByRole('radio', {
        name: labels['cardAutomatic.choices.1.label'],
      });
      await expect.poll(() => medium.isChecked()).toBe(true);
      await page.keyboard.press('Tab');
      await medium.focus();
      const focused = await medium.evaluate((radio, family) => {
        const card = radio.closest('label')!;
        const marker =
          family === 'skeleton' ? card.querySelector('span[aria-hidden="true"].size-4') : radio;
        const bounds = marker?.getBoundingClientRect();
        return {
          focused: getComputedStyle(card).outlineStyle !== 'none',
          markerWidth: bounds?.width ?? 0,
          markerHeight: bounds?.height ?? 0,
        };
      }, family);
      expect(focused.focused).toBe(true);
      expect(focused.markerWidth).toBeGreaterThanOrEqual(12);
      expect(focused.markerHeight).toBeGreaterThanOrEqual(12);
      await visibleRadioGroup.screenshot({
        path: path.join(directory, `${family}-${locale}-native-radio-focus-${mode}.png`),
        animations: 'disabled',
      });

      await page.getByRole('tab', { name: labels['cards.validation.label'], exact: true }).click();
      const invalidGroup = page.getByRole('radiogroup', {
        name: labels['cards.invalidDecision.label'],
      });
      await expect.poll(() => invalidGroup.getAttribute('aria-invalid')).toBe('true');
      const radios = invalidGroup.getByRole('radio');
      const invalidStyles = await radios.first().evaluate((radio) => {
        const card = radio.closest('label')!;
        const sibling = card.parentElement!.querySelectorAll('label')[1]!;
        const group = radio.closest('[role="radiogroup"]')!;
        return {
          firstBorder: getComputedStyle(card).borderTopColor,
          secondBorder: getComputedStyle(sibling).borderTopColor,
          borderWidth: getComputedStyle(card).borderTopWidth,
          cardWidth: card.getBoundingClientRect().width,
          groupWidth: group.getBoundingClientRect().width,
        };
      });
      expect(invalidStyles.firstBorder).toBe(invalidStyles.secondBorder);
      expect(invalidStyles.borderWidth).toBe('2px');
      expect(invalidStyles.cardWidth).toBeLessThanOrEqual(invalidStyles.groupWidth + 2);
      await invalidGroup.screenshot({
        path: path.join(directory, `${family}-${locale}-native-focus-error-${mode}.png`),
        animations: 'disabled',
      });
    }
    expect(pageErrors).toEqual([]);
  },
  { hosts: ['native'], timeout: 30000 },
);
