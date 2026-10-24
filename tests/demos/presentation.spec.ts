import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-presentation/translations.supplement.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-presentation/translations.json';

demoTest('presentation', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-presentation?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const banner = page.getByRole('img', {
    name: fields[locale]['specPresentation.ui.elements.1.elements.0.elements.1.alt'],
    exact: true,
  });
  const badge = page.getByRole('img', {
    name: fields[locale]['specPresentation.ui.elements.1.elements.0.elements.5.alt'],
    exact: true,
  });
  await expect.poll(() => banner.isVisible()).toBe(true);
  await expect.poll(() => badge.isVisible()).toBe(true);
  await page
    .getByRole('checkbox', {
      name: fields[locale]['specPresentation.schema.properties.showBanner.label'],
      exact: true,
    })
    .click();
  await expect.poll(() => banner.count()).toBe(0);
  await page
    .getByRole('textbox', {
      name: fields[locale]['specPresentation.schema.properties.badgeImage.label'],
      exact: true,
    })
    .fill('');
  await expect.poll(() => badge.count()).toBe(0);
  expect(await page.locator('img[alt=""]').count()).toBeGreaterThan(0);
  await page
    .getByRole('tab', {
      name: fields[locale]['specPresentation.ui.elements.1.elements.1.label'],
      exact: true,
    })
    .click();
  const link = page.getByRole('link', {
    name: translations[locale]['jsonformsDocs.label'],
    exact: true,
  });
  expect(await link.getAttribute('target')).toBe('_blank');
  expect((await link.getAttribute('rel'))?.split(/\s+/)).toEqual(
    expect.arrayContaining(['noopener', 'noreferrer']),
  );
  const refused = page.locator('[data-link-inert]').filter({
    hasText: fields[locale]['specPresentation.ui.elements.1.elements.1.elements.6.label'],
  });
  await expect.poll(() => refused.isVisible()).toBe(true);
  await page
    .getByRole('tab', {
      name: fields[locale]['specPresentation.ui.elements.1.elements.2.label'],
      exact: true,
    })
    .click();
  const spacing = page.getByRole('tabpanel', {
    name: fields[locale]['specPresentation.ui.elements.1.elements.2.label'],
    exact: true,
  });
  const spacers = spacing.locator('[data-spacer]');
  expect(await spacers.count()).toBe(3);
  expect(
    await spacers.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().height),
    ),
  ).toEqual([32, 64, 0]);
  expect(
    await spacers.evaluateAll((elements) =>
      elements.every(
        (element) =>
          element.getAttribute('aria-hidden') === 'true' && !element.hasAttribute('tabindex'),
      ),
    ),
  ).toBe(true);
  const separators = spacing.getByRole('separator');
  expect(await separators.count()).toBe(2);
  const vertical = spacing.locator(
    '[role="separator"][aria-orientation="vertical"]:visible, hr[aria-orientation="vertical"]:visible',
  );
  const line = await vertical.boundingBox();
  expect(line?.height).toBeGreaterThan(30);
  const thickness = await vertical.evaluate((element) => {
    const style = getComputedStyle(element);
    // Skeleton's native vr paints a border inside its allocated layout cell;
    // Flowbite/shadcn paint a narrow background instead.
    return (
      parseFloat(style.borderLeftWidth) ||
      parseFloat(style.borderRightWidth) ||
      element.getBoundingClientRect().width
    );
  });
  expect(thickness).toBeGreaterThan(0);
  expect(thickness).toBeLessThanOrEqual(2);
  expect(
    await separators.evaluateAll((elements) =>
      elements.every((element) => !element.hasAttribute('tabindex')),
    ),
  ).toBe(true);
  await page.goto(
    `${base}/${family}/#/examples/spec-draft-07-metaschema?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const title = page.getByRole('textbox', { name: 'Title', exact: true }).first();
  await expect.poll(() => title.inputValue()).toBe('Inventory item');
  await title.fill('Updated inventory schema');
  await title.blur();
  await expect.poll(() => title.inputValue()).toBe('Updated inventory schema');
  expect(errors).toEqual([]);
});
