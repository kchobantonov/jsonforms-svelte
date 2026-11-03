import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-markup-label/translations.json';

demoTest(
  'label-native-typography',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => {
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        );
        localStorage.setItem(
          `${family}-example-mode`,
          JSON.stringify({
            version: 1,
            value: sessionStorage.getItem('label-test-mode') ?? 'light',
          }),
        );
      },
      { family, locale },
    );
    const url = `${base}/${family}/#/examples/spec-markup-label?use-webcomponent=${webcomponent}&drawer=false`;

    const styles = async (mode: 'light' | 'dark') => {
      if (mode === 'dark') {
        await page.evaluate(() => sessionStorage.setItem('label-test-mode', 'dark'));
        await page.reload();
      } else await page.goto(url);

      const markdown = page.locator('.markup-content').filter({
        has: page.locator('strong').filter({
          hasText: locale === 'bg' ? 'Инструкции за пристигане.' : 'Joining instructions.',
        }),
      });
      await expect.poll(() => markdown.isVisible()).toBe(true);
      if (process.env.JSONFORMS_LABEL_VISUAL_CAPTURE === '1' && locale === 'en' && !webcomponent) {
        await page.screenshot({
          path: `test-results/label-typography-${family}-${mode}.png`,
          fullPage: true,
        });
      }
      const blockStyle = await markdown.evaluate((element) => {
        const style = getComputedStyle(element.parentElement!);
        return [style.color, style.fontSize, style.fontWeight];
      });

      await page
        .getByRole('tab', { name: translations[locale]['featureNavigation.section2.label'] })
        .click();
      const plain = page.getByText(translations[locale]['plainAsterisks.text'], {
        exact: true,
      });
      await expect.poll(() => plain.isVisible()).toBe(true);
      const plainStyle = await plain.evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.color, style.fontSize, style.fontWeight];
      });
      expect(blockStyle).toEqual(plainStyle);

      await page
        .getByRole('tab', { name: translations[locale]['featureNavigation.section3.label'] })
        .click();
      const bare = page
        .locator('.markup-content')
        .filter({ hasText: locale === 'bg' ? '15 минути' : '15 minutes' });
      await expect.poll(() => bare.isVisible()).toBe(true);
      const familyWrapperClass = {
        flowbite: 'text-gray-700',
        shadcn: 'text-foreground',
        skeleton: 'text-surface-950-50',
      }[family];
      expect(
        await bare.evaluate(
          (element, wrapperClass) =>
            element.parentElement?.classList.contains(wrapperClass) ?? false,
          familyWrapperClass,
        ),
      ).toBe(false);
      const terms = bare.getByRole('link', {
        name: locale === 'bg' ? 'условията за резервация' : 'booking terms',
      });
      expect(
        await terms.evaluate((element) => getComputedStyle(element).textDecorationLine),
      ).toContain('underline');
      return plainStyle[0];
    };

    const lightColor = await styles('light');
    const darkColor = await styles('dark');
    expect(darkColor).not.toBe(lightColor);
  },
  { timeout: 30_000 },
);
