import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'choice card show radio and error',
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
    await page.goto(`${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=true`);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.evaluate(
      async ({ family, locale }) => {
        const tag = `jsonforms-svelte-${family}`;
        await customElements.whenDefined(tag);
        const host = document.createElement(tag);
        host.id = 'show-radio-card-host';
        host.style.cssText =
          'position:fixed;z-index:9999;top:70px;left:10px;width:320px;background:white;';
        host.setAttribute(
          'schema',
          JSON.stringify({ type: 'string', title: 'Plan', enum: ['A', 'B'], minLength: 2 }),
        );
        host.setAttribute(
          'uischema',
          JSON.stringify({
            type: 'Control',
            scope: '#',
            options: { format: 'cards', showRadio: true },
          }),
        );
        host.setAttribute('locale', locale);
        host.setAttribute('data', JSON.stringify('A'));
        document.body.append(host);
      },
      { family, locale },
    );
    const host = page.locator('#show-radio-card-host');
    const group = host.getByRole('radiogroup', { name: 'Plan' });
    const first = group.getByRole('radio', { name: 'A', exact: true });
    const second = group.getByRole('radio', { name: 'B', exact: true });
    const directory = path.resolve('test-results/choice-card-visual-review');
    await mkdir(directory, { recursive: true });
    for (const mode of ['light', 'dark'] as const) {
      await host.evaluate((element, value) => element.setAttribute('mode', value), mode);
      await expect.poll(() => first.isChecked()).toBe(true);
      await expect.poll(() => group.getAttribute('aria-invalid')).toBe('true');
      const styles = await first.evaluate((radio, family) => {
        const card = radio.closest('label')!;
        const sibling = card.parentElement!.querySelectorAll('label')[1]!;
        const marker =
          family === 'skeleton' ? card.querySelector('span[aria-hidden="true"].size-4') : radio;
        const markerBounds = marker?.getBoundingClientRect();
        const cardStyle = getComputedStyle(card);
        return {
          firstBorder: cardStyle.borderTopColor,
          secondBorder: getComputedStyle(sibling).borderTopColor,
          borderWidth: cardStyle.borderTopWidth,
          markerWidth: markerBounds?.width ?? 0,
          markerHeight: markerBounds?.height ?? 0,
        };
      }, family);
      expect(styles.firstBorder).toBe(styles.secondBorder);
      expect(styles.borderWidth).toBe('2px');
      expect(styles.markerWidth).toBeGreaterThanOrEqual(12);
      expect(styles.markerHeight).toBeGreaterThanOrEqual(12);
      await page.keyboard.press('Tab');
      await first.focus();
      await expect
        .poll(() =>
          first.evaluate((radio) => {
            const card = radio.closest('label')!;
            return getComputedStyle(card).outlineStyle !== 'none';
          }),
        )
        .toBe(true);
      await group.screenshot({
        path: path.join(directory, `${family}-${locale}-show-radio-error-${mode}.png`),
        animations: 'disabled',
      });
    }
    await host.evaluate((element) => {
      element.setAttribute(
        'schema',
        JSON.stringify({ type: 'string', title: 'Plan', enum: ['A', 'B'] }),
      );
    });
    await expect.poll(() => group.getAttribute('aria-invalid')).not.toBe('true');
    await expect
      .poll(async () =>
        first.evaluate((radio) => {
          const card = radio.closest('label')!;
          const sibling = card.parentElement!.querySelectorAll('label')[1]!;
          return getComputedStyle(card).borderTopColor !== getComputedStyle(sibling).borderTopColor;
        }),
      )
      .toBe(true);
    await group.getByText('B', { exact: true }).click();
    await expect.poll(() => second.isChecked()).toBe(true);
    expect(pageErrors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 30000 },
);
