import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/translations.json';

demoTest('choice-card-sizing', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  await page.goto(
    `${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const labels = translations[locale];
  await page.getByRole('tab', { name: labels['cards.navigation.label'], exact: true }).click();
  const decision = page.getByRole('radiogroup', { name: labels['cardDecision.label'] });
  const approve = decision.getByRole('radio', { name: labels['cards.approve.label'] });
  const decline = decision.getByRole('radio', { name: labels['cards.decline.label'] });
  const dimensions = async () =>
    Promise.all(
      [approve, decline].map((radio) =>
        radio.evaluate((element) => {
          const card = element.closest('label') ?? element;
          const bounds = card.getBoundingClientRect();
          return { width: bounds.width, height: bounds.height };
        }),
      ),
    );

  const before = await dimensions();
  expect(Math.abs(before[0].width - before[1].width)).toBeLessThan(2);
  expect(Math.abs(before[0].height - before[1].height)).toBeLessThan(2);
  await expect
    .poll(async () => (await decision.locator('img:visible').first().boundingBox())?.width)
    .toBeLessThan(110);
  await decision
    .getByText(labels['cards.decline.label'], { exact: true })
    .filter({ visible: true })
    .click();
  await expect.poll(() => decline.isChecked()).toBe(true);
  const after = await dimensions();
  expect(Math.abs(after[0].width - after[1].width)).toBeLessThan(2);
  expect(Math.abs(after[0].height - after[1].height)).toBeLessThan(2);
  for (let index = 0; index < before.length; index++) {
    expect(Math.abs(after[index].width - before[index].width)).toBeLessThan(2);
    expect(Math.abs(after[index].height - before[index].height)).toBeLessThan(2);
  }
});
