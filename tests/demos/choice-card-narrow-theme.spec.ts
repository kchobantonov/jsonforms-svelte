import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import demoMessages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/translations.json';

const luminance = (channels: number[]) =>
  channels
    .map((value) => value / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);

demoTest(
  'choice card narrow theme',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(
      `${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page.setViewportSize({ width: 390, height: 900 });
    const labels = translations[locale];
    await page.getByRole('tab', { name: labels['cards.navigation.label'], exact: true }).click();
    const decision = page.getByRole('radiogroup', { name: labels['cardDecision.label'] });
    const approve = decision.getByRole('radio', {
      name: labels['cards.approve.label'],
      exact: true,
    });
    const decline = decision.getByRole('radio', {
      name: labels['cards.decline.label'],
      exact: true,
    });
    const directory = path.resolve('test-results/choice-card-visual-review');
    await mkdir(directory, { recursive: true });
    for (const mode of ['light', 'dark'] as const) {
      if (webcomponent) {
        await page.locator(`jsonforms-svelte-${family}`).evaluate((element, value) => {
          element.setAttribute('mode', value);
        }, mode);
      } else {
        await page.locator('html').evaluate(
          (element, { family, mode }) => {
            element.setAttribute('data-mode', mode);
            element.classList.toggle('dark', mode === 'dark' && family === 'flowbite');
          },
          { family, mode },
        );
      }
      await expect.poll(() => approve.isChecked()).toBe(true);
      const geometry = await decision.evaluate((group) => {
        const bounds = group.getBoundingClientRect();
        const cards = [...group.querySelectorAll('[data-part="item"], label')].filter((element) =>
          element.querySelector('input[type="radio"], [role="radio"]'),
        );
        return {
          groupWidth: bounds.width,
          cards: cards.map((element) => {
            const rect = element.getBoundingClientRect();
            return { width: rect.width, left: rect.left, right: rect.right };
          }),
        };
      });
      expect(geometry.cards).toHaveLength(2);
      for (const card of geometry.cards) {
        expect(card.width).toBeLessThanOrEqual(geometry.groupWidth + 2);
      }
      await expect
        .poll(() =>
          approve.evaluate((radio) => {
            const presentation = radio.closest('label')?.querySelector('.card-presentation');
            return presentation ? presentation.scrollWidth <= presentation.clientWidth + 1 : false;
          }),
        )
        .toBe(true);
      const border = async (radio: typeof approve) =>
        radio.evaluate((element) => {
          const card = element.closest('label') ?? element;
          return getComputedStyle(card).borderTopColor;
        });
      await expect.poll(async () => border(approve)).not.toBe(await border(decline));
      await expect
        .poll(async () => {
          const { foreground, background } = await approve.evaluate((radio, choiceLabel) => {
            const card = radio.closest('label')!;
            const label = [...card.querySelectorAll('*')].find(
              (element) =>
                element.children.length === 0 &&
                element.textContent?.trim() === choiceLabel &&
                getComputedStyle(element).visibility !== 'hidden',
            )!;
            const context = document.createElement('canvas').getContext('2d')!;
            const channels = (color: string) => {
              context.clearRect(0, 0, 1, 1);
              context.fillStyle = color;
              context.fillRect(0, 0, 1, 1);
              return [...context.getImageData(0, 0, 1, 1).data];
            };
            const background = [0, 0, 0];
            let opacity = 0;
            let ancestor: Element | null = card;
            while (ancestor && opacity < 0.999) {
              const color = channels(getComputedStyle(ancestor).backgroundColor);
              const layer = color[3] / 255;
              for (let index = 0; index < 3; index++) {
                background[index] += color[index] * layer * (1 - opacity);
              }
              opacity += layer * (1 - opacity);
              ancestor =
                ancestor.parentElement ??
                (ancestor.getRootNode() instanceof ShadowRoot
                  ? (ancestor.getRootNode() as ShadowRoot).host
                  : null);
            }
            for (let index = 0; index < 3; index++) {
              background[index] += 255 * (1 - opacity);
            }
            return {
              foreground: channels(getComputedStyle(label).color).slice(0, 3),
              background,
            };
          }, labels['cards.approve.label']);
          const bright = Math.max(luminance(foreground), luminance(background));
          const dark = Math.min(luminance(foreground), luminance(background));
          return (bright + 0.05) / (dark + 0.05);
        })
        .toBeGreaterThanOrEqual(4.5);
      await decision.screenshot({
        path: path.join(
          directory,
          `${family}-${locale}-${webcomponent ? 'webcomponent' : 'native'}-${mode}.png`,
        ),
        animations: 'disabled',
      });
    }
    await page.getByRole('button', { name: demoMessages[locale]['nav.openSettings'] }).click();
    await page.getByText('RTL', { exact: true }).click();
    await page.keyboard.press('Escape');
    await expect
      .poll(() => decision.evaluate((group) => getComputedStyle(group).direction))
      .toBe('rtl');
    await expect.poll(() => approve.isVisible()).toBe(true);
    await expect.poll(() => decline.isVisible()).toBe(true);
    const rtlCards = await decision.evaluate((group) => {
      const bounds = group.getBoundingClientRect();
      const cards = [...group.querySelectorAll('[data-part="item"], label')].filter((element) =>
        element.querySelector('input[type="radio"], [role="radio"]'),
      );
      return {
        group: { left: bounds.left, right: bounds.right, width: bounds.width },
        cards: cards.map((element) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right, width: rect.width };
        }),
      };
    });
    expect(rtlCards.cards).toHaveLength(2);
    for (const card of rtlCards.cards) {
      expect(card.width).toBeLessThanOrEqual(rtlCards.group.width + 2);
      expect(card.left).toBeGreaterThanOrEqual(Math.max(0, rtlCards.group.left) - 2);
      expect(card.right).toBeLessThanOrEqual(Math.min(390, rtlCards.group.right) + 2);
    }
    await decision.screenshot({
      path: path.join(
        directory,
        `${family}-${locale}-${webcomponent ? 'webcomponent' : 'native'}-dark-rtl.png`,
      ),
      animations: 'disabled',
    });
  },
  { timeout: 30000 },
);
