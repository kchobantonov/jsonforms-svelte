import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/translations.json';

demoTest('choice-card-rich-content', async ({ page, family, locale, webcomponent, base }) => {
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
  const catalog = translations[locale];
  await page.getByRole('tab', { name: catalog['cards.navigation.label'], exact: true }).click();
  const decision = page.getByRole('radiogroup', { name: catalog['cardDecision.label'] });
  const approve = decision.getByRole('radio', {
    name: catalog['cards.approve.label'],
    exact: true,
  });
  const decline = decision.getByRole('radio', {
    name: catalog['cards.decline.label'],
    exact: true,
  });
  await expect.poll(() => approve.isChecked()).toBe(true);
  await expect
    .poll(() => decision.locator('strong:visible').allTextContents())
    .toContain(locale === 'en' ? 'Approved' : 'Одобрено');
  await expect.poll(() => decision.locator('img:visible').count()).toBeGreaterThan(0);
  await expect
    .poll(() =>
      approve.evaluate((radio) => {
        const card = radio.closest('label');
        return card?.textContent?.includes(radio.getAttribute('aria-label') ?? '');
      }),
    )
    .toBe(true);
  await expect
    .poll(() =>
      approve.evaluate((radio, choiceLabel) => {
        const card = radio.closest('label');
        const presentation = card?.querySelector('.card-presentation');
        const label = [...(card?.querySelectorAll('*') ?? [])].find(
          (element) => element.children.length === 0 && element.textContent?.trim() === choiceLabel,
        );
        return !!(
          presentation &&
          label &&
          presentation.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING
        );
      }, catalog['cards.approve.label']),
    )
    .toBe(true);

  await decision
    .getByText(catalog['cards.decline.label'], { exact: true })
    .filter({ visible: true })
    .click();
  await expect.poll(() => decline.isChecked()).toBe(true);
  await expect.poll(() => approve.isChecked()).toBe(false);
  await expect.poll(() => decision.locator('strong:visible').count()).toBe(0);
});
